const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const CouponRedemption = require('../models/CouponRedemption');
const { DISCOUNT_TYPES } = require('../utils/constants');
const { round2 } = require('../utils/money');

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

// minimumAmount qualifies on the whole cart; the discount itself only ever
// applies to the subtotal of the items the coupon is scoped to.
const calculateDiscountAmount = (coupon, eligibleSubtotal, cartSubtotal = eligibleSubtotal) => {
  if (cartSubtotal < coupon.minimumAmount) {
    const error = new Error(`Minimum order amount of ${coupon.minimumAmount} required for this coupon`);
    error.statusCode = 400;
    throw error;
  }

  let discount = 0;
  if (coupon.discountType === DISCOUNT_TYPES.PERCENTAGE) {
    discount = (eligibleSubtotal * coupon.discountValue) / 100;
    if (coupon.maximumDiscount) {
      discount = Math.min(discount, coupon.maximumDiscount);
    }
  } else {
    discount = coupon.discountValue;
  }

  return round2(Math.min(discount, eligibleSubtotal));
};

const sumItems = (items) => round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));

const resolveEligibleItems = async (coupon, cartItems) => {
  const productIds = new Set((coupon.applicableProducts || []).map(String));
  const categoryIds = new Set((coupon.applicableCategories || []).map(String));

  if (!productIds.size && !categoryIds.size) {
    return cartItems;
  }

  let categoriesByProduct = new Map();
  if (categoryIds.size) {
    const products = await Product.find({ _id: { $in: cartItems.map((item) => item.productId) } })
      .select('category subCategory');
    categoriesByProduct = new Map(
      products.map((product) => [
        product._id.toString(),
        [product.category, product.subCategory].filter(Boolean).map(String),
      ])
    );
  }

  return cartItems.filter((item) => {
    const id = item.productId.toString();
    return (
      productIds.has(id) ||
      (categoriesByProduct.get(id) || []).some((category) => categoryIds.has(category))
    );
  });
};

const validateCouponForCart = async ({ code, cartItems = [], userId }) => {
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() });
  assertCouponIsUsable(coupon);

  if (userId && (await CouponRedemption.exists({ couponId: coupon._id, userId }))) {
    const error = new Error('You have already used this coupon');
    error.statusCode = 400;
    throw error;
  }

  const eligibleItems = await resolveEligibleItems(coupon, cartItems);
  if (!eligibleItems.length) {
    const error = new Error('Coupon is not applicable to cart items');
    error.statusCode = 400;
    throw error;
  }

  const eligibleSubtotal = sumItems(eligibleItems);
  const discount = calculateDiscountAmount(coupon, eligibleSubtotal, sumItems(cartItems));

  return { coupon, discount, eligibleSubtotal };
};

// The limit is re-checked in the same write that increments, so two concurrent
// checkouts cannot both pass an earlier read and overshoot usageLimit.
const incrementCouponUsage = async (couponId, session) => {
  const updated = await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
    },
    { $inc: { usedCount: 1 } },
    { session: session || undefined, new: true }
  );

  if (!updated) {
    const error = new Error('Coupon usage limit reached');
    error.statusCode = 400;
    throw error;
  }

  return updated;
};

const recordRedemption = async ({ couponId, userId, orderId }, session) => {
  await CouponRedemption.create([{ couponId, userId, orderId }], { session });
};

// A cancelled or expired order gives the coupon back rather than burning it.
const releaseRedemption = async ({ couponId, userId }, session) => {
  const deleted = await CouponRedemption.findOneAndDelete({ couponId, userId }, { session });
  if (deleted) {
    await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: -1 } }, { session });
  }
};

module.exports = {
  validateCouponForCart,
  recordRedemption,
  releaseRedemption,
  calculateDiscountAmount,
  incrementCouponUsage,
  assertCouponIsUsable,
};
