const Coupon = require('../models/Coupon');
const { DISCOUNT_TYPES } = require('../utils/constants');

const assertCouponIsUsable = (coupon) => {
  const now = new Date();

  if (!coupon || !coupon.isActive) {
    const error = new Error('Coupon is not valid');
    error.statusCode = 400;
    throw error;
  }

  if (coupon.startDate > now || coupon.expiryDate < now) {
    const error = new Error('Coupon is expired or not yet active');
    error.statusCode = 400;
    throw error;
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    const error = new Error('Coupon usage limit reached');
    error.statusCode = 400;
    throw error;
  }
};

const calculateDiscountAmount = (coupon, subtotal) => {
  if (subtotal < coupon.minimumAmount) {
    const error = new Error(`Minimum order amount of ${coupon.minimumAmount} required for this coupon`);
    error.statusCode = 400;
    throw error;
  }

  let discount = 0;
  if (coupon.discountType === DISCOUNT_TYPES.PERCENTAGE) {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maximumDiscount) {
      discount = Math.min(discount, coupon.maximumDiscount);
    }
  } else {
    discount = coupon.discountValue;
  }

  return Math.min(discount, subtotal);
};

const validateCouponForCart = async ({ code, subtotal, cartItems = [] }) => {
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() });
  assertCouponIsUsable(coupon);

  if (coupon.applicableProducts?.length) {
    const productIds = cartItems.map((item) => item.productId.toString());
    const allowed = coupon.applicableProducts.some((id) => productIds.includes(id.toString()));
    if (!allowed) {
      const error = new Error('Coupon is not applicable to cart items');
      error.statusCode = 400;
      throw error;
    }
  }

  const discount = calculateDiscountAmount(coupon, subtotal);

  return {
    coupon,
    discount,
  };
};

const incrementCouponUsage = async (couponId, session) => {
  await Coupon.findByIdAndUpdate(
    couponId,
    { $inc: { usedCount: 1 } },
    { session: session || undefined }
  );
};

module.exports = {
  validateCouponForCart,
  calculateDiscountAmount,
  incrementCouponUsage,
  assertCouponIsUsable,
};
