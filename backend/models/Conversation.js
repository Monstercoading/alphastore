const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  unreadByCustomer: {
    type: Number,
    default: 0
  },
  unreadByAdmin: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  senderType: {
    type: String,
    enum: ['customer', 'admin'],
    required: true
  },
  content: {
    type: String,
    required: false
  },
  imageUrl: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better performance and uniqueness
conversationSchema.index({ orderId: 1 }, { unique: true });
conversationSchema.index({ customerId: 1 });
conversationSchema.index({ status: 1 });
messageSchema.index({ conversationId: 1, createdAt: 1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = { Conversation, Message };
