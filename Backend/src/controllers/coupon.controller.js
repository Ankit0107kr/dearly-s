const Coupon = require('../models/Coupon');
const couponService = require('../services/coupon.service');
const cartService = require('../services/cart.service');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');

const validateCoupon = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  if (!cart.items.length) {
    const error = new Error('Cart is empty');
    error.statusCode = 400;
    throw error;
  }

  const result = await couponService.validateCouponForCart({
    code: req.body.code,
    userId: req.user._id,
    cartItems: cart.items.map((item) => ({
      productId: item.productId?._id || item.productId,
      price: item.unitPrice,
      quantity: item.quantity,
    })),
  });

  return sendSuccess(res, {
    message: 'Coupon is valid',
    data: {
      code: result.coupon.code,
      discount: result.discount,
      discountType: result.coupon.discountType,
      eligibleSubtotal: result.eligibleSubtotal,
    },
  });
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Coupon created successfully',
    data: { coupon },
  });
});

const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return sendSuccess(res, {
    message: 'Coupons fetched successfully',
    data: { coupons },
  });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) {
    const error = new Error('Coupon not found');
    error.statusCode = 404;
    throw error;
  }
  return sendSuccess(res, {
    message: 'Coupon updated successfully',
    data: { coupon },
  });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!coupon) {
    const error = new Error('Coupon not found');
    error.statusCode = 404;
    throw error;
  }
  return sendSuccess(res, {
    message: 'Coupon deactivated successfully',
    data: { coupon },
  });
});

module.exports = {
  validateCoupon,
  createCoupon,
  listCoupons,
  updateCoupon,
  deleteCoupon,
};
