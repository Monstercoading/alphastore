const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const auth = require('../middleware/auth');

// Get all games
router.get('/', async (req, res) => {
  try {
    const { platform, region, availability } = req.query;
    let filter = {};
    
    if (platform) filter.platform = platform;
    if (region) filter.region = region;
    if (availability) filter.availability = availability;
    else filter.availability = 'available';

    const games = await Game.find(filter).sort({ createdAt: -1 });
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get single game
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json(game);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add game (protected)
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      platform,
      region,
      images,
      accountDetails
    } = req.body;

    const newGame = new Game({
      title,
      description,
      price,
      platform,
      region,
      images: images || [],
      accountDetails
    });

    const game = await newGame.save();
    res.json(game);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update game (protected)
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      platform,
      region,
      images,
      availability,
      accountDetails
    } = req.body;

    let game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    game = await Game.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        price,
        platform,
        region,
        images,
        availability,
        accountDetails,
        updatedAt: Date.now()
      },
      { new: true }
    );

    res.json(game);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete game (protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    await Game.findByIdAndDelete(req.params.id);
    res.json({ message: 'Game removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
