const mongoose = require('mongoose');

const discountCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed']
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minimumAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    min: 0
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: String
  }],
  usageLimit: {
    type: Number,
    min: 1
  },
  usageCount: {
    type: Number,
    default: 0
  },
  userUsageLimit: {
    type: Number,
    min: 1,
    default: 1
  },
  userUsageCount: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better performance
discountCodeSchema.index({ code: 1 });
discountCodeSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Instance methods
discountCodeSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive && 
         now >= this.startDate && 
         now <= this.endDate &&
         (this.usageLimit ? this.usageCount < this.usageLimit : true);
};

discountCodeSchema.methods.canBeUsedByUser = function(userId) {
  const userUsage = this.userUsageCount.find(u => u.userId.toString() === userId.toString());
  return !userUsage || userUsage.count < this.userUsageLimit;
};

discountCodeSchema.methods.incrementUsage = function(userId) {
  this.usageCount += 1;
  
  let userUsage = this.userUsageCount.find(u => u.userId.toString() === userId.toString());
  if (!userUsage) {
    userUsage = { userId, count: 0 };
    this.userUsageCount.push(userUsage);
  }
  userUsage.count += 1;
  
  return this.save();
};

discountCodeSchema.methods.calculateDiscount = function(originalAmount, productId = null, productCategory = null) {
  // Check if code is applicable to this product
  if (this.applicableProducts.length > 0 && productId) {
    if (!this.applicableProducts.includes(productId)) {
      return { eligible: false, reason: 'الكود غير صالح لهذا المنتج' };
    }
  }
  
  if (this.applicableCategories.length > 0 && productCategory) {
    if (!this.applicableCategories.includes(productCategory)) {
      return { eligible: false, reason: 'الكود غير صالح لهذه الفئة' };
    }
  }
  
  // Check minimum amount
  if (originalAmount < this.minimumAmount) {
    return { 
      eligible: false, 
      reason: `الحد الأدنى للشراء هو ${this.minimumAmount}$` 
    };
  }
  
  let discountAmount = 0;
  
  if (this.discountType === 'percentage') {
    discountAmount = (originalAmount * this.discountValue) / 100;
    
    // Apply max discount limit if set
    if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
      discountAmount = this.maxDiscountAmount;
    }
  } else {
    discountAmount = this.discountValue;
  }
  
  // Ensure discount doesn't exceed original amount
  discountAmount = Math.min(discountAmount, originalAmount);
  
  return {
    eligible: true,
    discountAmount,
    finalAmount: originalAmount - discountAmount,
    discountPercentage: Math.round((discountAmount / originalAmount) * 100)
  };
};

const DiscountCode = mongoose.model('DiscountCode', discountCodeSchema);

module.exports = DiscountCode;
