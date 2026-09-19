const mongoose = require('mongoose');

const couponRedemptionSchema = new mongoose.Schema(
  {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  },
  { timestamps: true }
);

// One redemption per customer per coupon; the unique index is what makes the
// limit hold when the same customer checks out twice concurrently.
couponRedemptionSchema.index({ couponId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CouponRedemption', couponRedemptionSchema);
