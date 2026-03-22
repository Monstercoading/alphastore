const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Game = require('../models/Game');
const auth = require('../middleware/auth');

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required' });
    }
    
    let totalAmount = 0;
    const orderItems = [];

    for (let item of items) {
      const game = await Game.findById(item.gameId);
      if (!game || game.availability !== 'available') {
        return res.status(400).json({ message: `Game ${game?.title || 'Unknown'} is not available` });
      }
      
      totalAmount += game.price;
      orderItems.push({
        game: game._id,
        gameName: game.title,
        price: game.price
      });
    }

    const newOrder = new Order({
      user: req.user.id,
      items: orderItems,
      totalAmount
    });

    // Update game availability to sold
    for (let item of orderItems) {
      await Game.findByIdAndUpdate(item.game, { availability: 'sold' });
    }

    const order = await newOrder.save();
    await order.populate('items.game');
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('games.game')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
