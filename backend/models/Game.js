const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  platform: {
    type: String,
    enum: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'],
    required: true
  },
  region: {
    type: String,
    enum: ['Global', 'North America', 'Europe', 'Asia', 'Middle East'],
    required: true
  },
  images: [{
    type: String
  }],
  availability: {
    type: String,
    enum: ['available', 'sold', 'reserved'],
    default: 'available'
  },
  accountDetails: {
    username: String,
    password: String,
    email: String,
    additionalInfo: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Game || mongoose.model('Game', GameSchema);
