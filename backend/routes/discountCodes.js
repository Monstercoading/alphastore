const express = require('express');
const router = express.Router();
const DiscountCode = require('../models/DiscountCode');
const Game = require('../models/Game');
const auth = require('../middleware/auth');

// Get all discount codes (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const discountCodes = await DiscountCode.find()
      .populate('applicableProducts', 'title')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(discountCodes);
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    res.status(500).json({ error: 'Failed to fetch discount codes' });
  }
});

// Get single discount code (admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const discountCode = await DiscountCode.findById(req.params.id)
      .populate('applicableProducts', 'title price')
      .populate('createdBy', 'firstName lastName');

    if (!discountCode) {
      return res.status(404).json({ error: 'Discount code not found' });
    }

    res.json(discountCode);
  } catch (error) {
    console.error('Error fetching discount code:', error);
    res.status(500).json({ error: 'Failed to fetch discount code' });
  }
});

// Create discount code (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      minimumAmount,
      maxDiscountAmount,
      applicableProducts,
      applicableCategories,
      usageLimit,
      userUsageLimit,
      startDate,
      endDate
    } = req.body;

    // Validate required fields
    if (!code || !description || !discountType || discountValue === undefined || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if code already exists
    const existingCode = await DiscountCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ error: 'Discount code already exists' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Validate applicable products if provided
    if (applicableProducts && applicableProducts.length > 0) {
      const games = await Game.find({ _id: { $in: applicableProducts } });
      if (games.length !== applicableProducts.length) {
        return res.status(400).json({ error: 'Some games not found' });
      }
    }

    const discountCode = new DiscountCode({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minimumAmount: minimumAmount || 0,
      maxDiscountAmount,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      usageLimit,
      userUsageLimit: userUsageLimit || 1,
      startDate,
      endDate,
      createdBy: req.user.id
    });

    await discountCode.save();
    await discountCode.populate('applicableProducts', 'title');
    await discountCode.populate('createdBy', 'firstName lastName');

    res.status(201).json(discountCode);
  } catch (error) {
    console.error('Error creating discount code:', error);
    res.status(500).json({ error: 'Failed to create discount code' });
  }
});

// Update discount code (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const discountCode = await DiscountCode.findById(req.params.id);
    if (!discountCode) {
      return res.status(404).json({ error: 'Discount code not found' });
    }

    const updateData = { ...req.body };
    
    // Convert code to uppercase if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    // Validate dates if provided
    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
      if (start >= end) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
    }

    // Check for duplicate code if code is being changed
    if (updateData.code && updateData.code !== discountCode.code) {
      const existingCode = await DiscountCode.findOne({ code: updateData.code });
      if (existingCode) {
        return res.status(400).json({ error: 'Discount code already exists' });
      }
    }

    Object.assign(discountCode, updateData);
    await discountCode.save();
    await discountCode.populate('applicableProducts', 'title');
    await discountCode.populate('createdBy', 'firstName lastName');

    res.json(discountCode);
  } catch (error) {
    console.error('Error updating discount code:', error);
    res.status(500).json({ error: 'Failed to update discount code' });
  }
});

// Delete discount code (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const discountCode = await DiscountCode.findById(req.params.id);
    if (!discountCode) {
      return res.status(404).json({ error: 'Discount code not found' });
    }

    await DiscountCode.findByIdAndDelete(req.params.id);

    res.json({ message: 'Discount code deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    res.status(500).json({ error: 'Failed to delete discount code' });
  }
});

// Validate and apply discount code
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, amount, productId, productCategory } = req.body;

    if (!code || amount === undefined) {
      return res.status(400).json({ error: 'Code and amount are required' });
    }

    const discountCode = await DiscountCode.findOne({ code: code.toUpperCase() })
      .populate('applicableProducts', 'title category');

    if (!discountCode) {
      return res.status(404).json({ error: 'رمز الخصم غير صحيح' });
    }

    // Check if code is valid (active, within date range, usage limit)
    if (!discountCode.isValid()) {
      let reason = 'رمز الخصم غير صالح';
      if (!discountCode.isActive) {
        reason = 'رمز الخصم غير نشط';
      } else if (new Date() < discountCode.startDate) {
        reason = 'رمز الخصم لم يبدأ بعد';
      } else if (new Date() > discountCode.endDate) {
        reason = 'انتهت صلاحية رمز الخصم';
      } else if (discountCode.usageLimit && discountCode.usageCount >= discountCode.usageLimit) {
        reason = 'تم الوصول إلى الحد الأقصى لاستخدام هذا الرمز';
      }
      return res.status(400).json({ error: reason });
    }

    // Check user usage limit
    if (!discountCode.canBeUsedByUser(req.user.id)) {
      return res.status(400).json({ error: 'لقد استخدمت هذا الرمز الحد الأقصى المسموح به' });
    }

    // Get product category if not provided
    let category = productCategory;
    if (!category && productId) {
      const game = await Game.findById(productId);
      category = game?.category;
    }

    // Calculate discount
    const result = discountCode.calculateDiscount(amount, productId, category);

    if (!result.eligible) {
      return res.status(400).json({ error: result.reason });
    }

    res.json({
      success: true,
      code: discountCode.code,
      description: discountCode.description,
      discountAmount: result.discountAmount,
      originalAmount: amount,
      finalAmount: result.finalAmount,
      discountPercentage: result.discountPercentage,
      discountType: discountCode.discountType,
      discountValue: discountCode.discountValue
    });
  } catch (error) {
    console.error('Error validating discount code:', error);
    res.status(500).json({ error: 'Failed to validate discount code' });
  }
});

// Get available products for discount code selection
router.get('/products/available', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const games = await Game.find({ availability: 'available' })
      .select('_id title price category platform')
      .sort({ title: 1 });

    res.json(games);
  } catch (error) {
    console.error('Error fetching available games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

module.exports = router;
