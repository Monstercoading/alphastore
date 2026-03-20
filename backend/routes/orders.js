const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Game = require('../models/Game');
const auth = require('../middleware/auth');

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { games } = req.body;
    
    let totalAmount = 0;
    const orderGames = [];

    for (let gameItem of games) {
      const game = await Game.findById(gameItem.gameId);
      if (!game || game.availability !== 'available') {
        return res.status(400).json({ message: `Game ${game.title} is not available` });
      }
      
      totalAmount += game.price;
      orderGames.push({
        game: game._id,
        price: game.price
      });
    }

    const newOrder = new Order({
      user: req.user.id,
      games: orderGames,
      totalAmount
    });

    // Update game availability to sold
    for (let gameItem of orderGames) {
      await Game.findByIdAndUpdate(gameItem.game, { availability: 'sold' });
    }

    const order = await newOrder.save();
    await order.populate('games.game');
    
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
