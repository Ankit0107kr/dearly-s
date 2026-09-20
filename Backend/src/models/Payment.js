const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_PROVIDERS } = require('../utils/constants');
const { money, moneyJson } = require('../utils/money');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: Object.values(PAYMENT_PROVIDERS),
      default: PAYMENT_PROVIDERS.RAZORPAY,
    },
    paymentId: { type: String, trim: true },
    providerOrderId: { type: String, trim: true },
    amount: money({ required: true }),
    currency: { type: String, default: 'INR' },
    method: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    rawResponse: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true, ...moneyJson }
);

// Unique so a retried webhook racing a client verify collides on write instead of
// creating a second payment row for one gateway order.
paymentSchema.index({ providerOrderId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ paymentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
