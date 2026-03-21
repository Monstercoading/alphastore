const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Conversation, Message } = require('../models/Conversation');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/conversations/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all conversations for admin
router.get('/admin', auth, async (req, res) => {
  try {
    console.log('Admin conversations request from user:', req.user);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('Access denied - user is not admin:', req.user.role);
      return res.status(403).json({ error: 'Access denied - admin only' });
    }

    console.log('Fetching admin conversations...');
    const conversations = await Conversation.find({ status: 'open' })
      .populate('orderId', 'totalAmount createdAt')
      .populate('customerId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    // Format conversations to handle missing dates
    const formattedConversations = conversations.map(conv => ({
      ...conv.toObject(),
      lastMessageTime: conv.lastMessageTime || conv.createdAt,
      customerName: conv.customerName || (conv.customerId?.firstName && conv.customerId?.lastName 
        ? `${conv.customerId.firstName} ${conv.customerId.lastName}` 
        : 'زائر'),
      customerEmail: conv.customerEmail || conv.customerId?.email || 'guest@example.com'
    }));
    
    console.log('Admin conversations found:', formattedConversations.length);
    res.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations: ' + error.message });
  }
});

// Get conversations for customer
router.get('/customer', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({ 
      customerId: req.user.id 
    })
      .populate('orderId', 'totalAmount createdAt')
      .sort({ lastMessageTime: -1 });
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching customer conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get single conversation with messages
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching conversation:', req.params.id);
    const conversation = await Conversation.findById(req.params.id)
      .populate('orderId', 'totalAmount createdAt')
      .populate('customerId', 'firstName lastName email');
    
    if (!conversation) {
      console.log('Conversation not found:', req.params.id);
      return res.status(404).json({ error: 'Conversation not found' });
    }

    console.log('Conversation found:', conversation);

    // Get messages
    const messages = await Message.find({ conversationId: req.params.id })
      .sort({ createdAt: 1 });

    console.log('Messages found:', messages.length);

    // For guest users, skip authorization check and read status updates
    res.json({ conversation, messages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation: ' + error.message });
  }
});

// Create new conversation (when customer clicks support button)
router.post('/', async (req, res) => {
  try {
    const { orderId } = req.body;

    console.log('Creating conversation for order:', orderId);

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Verify order exists
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('Order found:', order);

    // For guest users, create conversation without authentication
    let conversation = await Conversation.findOne({ orderId });
    
    if (!conversation) {
      console.log('Creating new conversation...');
      conversation = new Conversation({
        orderId,
        customerId: order.user?._id || null,
        customerName: order.user?.firstName && order.user?.lastName 
          ? `${order.user.firstName} ${order.user.lastName}` 
          : 'زائر',
        customerEmail: order.user?.email || 'guest@example.com',
        lastMessage: 'تم فتح المحادثة'
      });
      
      await conversation.save();
      console.log('Conversation saved:', conversation);
    } else {
      console.log('Existing conversation found:', conversation);
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation: ' + error.message });
  }
});

// Send message
router.post('/:id/message', upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    const conversationId = req.params.id;

    console.log('Sending message to conversation:', conversationId);
    console.log('Content:', content);
    console.log('Has file:', !!req.file);

    // Get conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.log('Conversation not found:', conversationId);
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Try to get user from token if available
    let user = null;
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        user = decoded.user;
      } catch (err) {
        console.log('Invalid token, proceeding as guest');
      }
    }

    // Determine sender type
    const isGuest = !user;
    const senderType = isGuest ? 'customer' : (user.role === 'admin' ? 'admin' : 'customer');

    // Create message
    const message = new Message({
      conversationId,
      senderId: user?.id || null,
      senderType,
      content: content || '',
      imageUrl: req.file ? `/uploads/conversations/${req.file.filename}` : null
    });

    await message.save();
    console.log('Message saved:', message);

    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content || (req.file ? 'صورة' : ''),
      lastMessageTime: new Date(),
      unreadByAdmin: (conversation.unreadByAdmin || 0) + 1
    });

    console.log('Conversation updated');

    // Notify via SSE (for real-time updates)
    const notification = {
      type: 'NEW_MESSAGE',
      conversationId,
      message: {
        id: message._id,
        content: message.content,
        imageUrl: message.imageUrl,
        senderType: message.senderType,
        createdAt: message.createdAt
      }
    };

    // Send to admin notification listeners
    if (global.adminNotificationListeners) {
      console.log('Sending notification to admins');
      global.adminNotificationListeners.forEach(listener => {
        try {
          listener.res.write(`data: ${JSON.stringify(notification)}\n\n`);
        } catch (err) {
          console.error('Error sending message notification:', err);
        }
      });
    }

    res.status(201).json(message);
    
    // Emit real-time message via Socket.io
    const reqIo = req.app.get('io');
    if (reqIo) {
      reqIo.to(conversationId).emit('newMessage', {
        conversationId,
        message,
        senderType,
        timestamp: new Date()
      });

      // Also emit receiveMessage for frontend compatibility
      reqIo.to(conversationId).emit('receiveMessage', {
        conversationId,
        message,
        senderType,
        timestamp: new Date()
      });

      // Notify admin if customer sends message
      if (senderType === 'customer') {
        reqIo.emit('newConversationMessage', {
          conversationId,
          message: message.content || 'صورة',
          timestamp: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message: ' + error.message });
  }
});

// Close conversation
router.put('/:id/close', auth, async (req, res) => {
  try {
    const conversationId = req.params.id;
    
    // Update conversation status to closed
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { status: 'closed' },
      { new: true }
    ).populate('orderId', 'totalAmount createdAt')
     .populate('customerId', 'firstName lastName email');
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Emit real-time update via Socket.io
    const reqIo = req.app.get('io');
    if (reqIo) {
      reqIo.to(conversationId).emit('conversationClosed', {
        conversationId,
        status: 'closed'
      });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Error closing conversation:', error);
    res.status(500).json({ error: 'Failed to close conversation: ' + error.message });
  }
});

// Mark messages as read (for admin)
router.put('/:id/read', auth, async (req, res) => {
  try {
    const conversationId = req.params.id;
    
    // Only admin can mark messages as read
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update all messages in conversation to isRead: true
    await Message.updateMany(
      { conversationId },
      { isRead: true, read: true }
    );
    
    // Emit real-time update via Socket.io
    const reqIo = req.app.get('io');
    if (reqIo) {
      reqIo.to(conversationId).emit('messagesRead', {
        conversationId
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read: ' + error.message });
  }
});

// SSE for real-time notifications
router.get('/notifications', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Store the connection for sending notifications
  if (!global.adminNotificationListeners) {
    global.adminNotificationListeners = [];
  }
  
  const listener = { res, id: Date.now() };
  global.adminNotificationListeners.push(listener);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Connected to notifications' })}\n\n`);

  // Remove listener when connection closes
  req.on('close', () => {
    global.adminNotificationListeners = global.adminNotificationListeners.filter(l => l.id !== listener.id);
  });
});

module.exports = router;
