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
    const conversations = await Conversation.find({ status: 'open' })
      .populate('orderId', 'totalAmount createdAt')
      .sort({ lastMessageTime: -1 });
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
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
    const order = await Order.findById(orderId);
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

    // For guest users, allow sending messages without authentication
    const isGuest = !req.user;
    const senderType = isGuest ? 'customer' : (req.user.role === 'admin' ? 'admin' : 'customer');

    // Create message
    const message = new Message({
      conversationId,
      senderId: req.user?.id || null,
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
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message: ' + error.message });
  }
});

// Close conversation
router.put('/:id/close', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Only admin can close conversations
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    conversation.status = 'closed';
    await conversation.save();

    res.json({ message: 'Conversation closed' });
  } catch (error) {
    console.error('Error closing conversation:', error);
    res.status(500).json({ error: 'Failed to close conversation' });
  }
});

module.exports = router;
