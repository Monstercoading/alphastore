const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  games: [{
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add auto-increment plugin
OrderSchema.plugin(AutoIncrement, { inc_field: 'orderNumber', start_seq: 1 });

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
