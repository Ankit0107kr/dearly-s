const mongoose = require('mongoose');
const { DISCOUNT_TYPES } = require('../utils/constants');
const { money, moneyJson } = require('../utils/money');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: Object.values(DISCOUNT_TYPES),
      required: true,
    },
    discountValue: money({ required: true }),
    minimumAmount: money({ default: 0 }),
    maximumDiscount: money(),
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, ...moneyJson }
);

module.exports = mongoose.model('Coupon', couponSchema);
