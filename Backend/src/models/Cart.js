const mongoose = require('mongoose');
const { money, moneyJson } = require('../utils/money');

const cartItemCustomizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, trim: true },
    value: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    imagePublicId: { type: String, trim: true },
  },
  { _id: false }
);

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: money({ required: true }),
    customization: [cartItemCustomizationSchema],
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    totalAmount: money({ default: 0 }),
  },
  { timestamps: true, ...moneyJson }
);

module.exports = mongoose.model('Cart', cartSchema);
