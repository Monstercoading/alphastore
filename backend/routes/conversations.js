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
router.get('/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('orderId', 'totalAmount createdAt')
      .populate('customerId', 'firstName lastName email');
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is authorized (customer or admin)
    if (conversation.customerId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get messages
    const messages = await Message.find({ conversationId: req.params.id })
      .sort({ createdAt: 1 });

    // Mark messages as read
    const isCustomer = conversation.customerId._id.toString() === req.user.id;
    await Message.updateMany(
      { 
        conversationId: req.params.id,
        senderType: isCustomer ? 'admin' : 'customer',
        read: false
      },
      { read: true }
    );

    // Update unread count
    if (isCustomer) {
      await Conversation.findByIdAndUpdate(req.params.id, { unreadByCustomer: 0 });
    } else {
      await Conversation.findByIdAndUpdate(req.params.id, { unreadByAdmin: 0 });
    }

    res.json({ conversation, messages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Create new conversation (when customer clicks support button)
router.post('/', async (req, res) => {
  try {
    const { orderId } = req.body;

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // For guest users, create conversation without authentication
    let conversation = await Conversation.findOne({ orderId });
    
    if (!conversation) {
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
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Send message
router.post('/:id/message', auth, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    const conversationId = req.params.id;

    // Get conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check authorization
    const isCustomer = conversation.customerId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create message
    const message = new Message({
      conversationId,
      senderId: req.user.id,
      senderType: isCustomer ? 'customer' : 'admin',
      content: content || '',
      imageUrl: req.file ? `/uploads/conversations/${req.file.filename}` : null
    });

    await message.save();

    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content || (req.file ? 'صورة' : ''),
      lastMessageTime: new Date(),
      [`unreadBy${isCustomer ? 'Admin' : 'Customer'}`]: conversation[`unreadBy${isCustomer ? 'Admin' : 'Customer'}`] + 1
    });

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
    if (isCustomer && global.adminNotificationListeners) {
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
    res.status(500).json({ error: 'Failed to send message' });
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
