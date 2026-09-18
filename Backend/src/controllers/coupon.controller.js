const Coupon = require('../models/Coupon');
const couponService = require('../services/coupon.service');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');

const validateCoupon = asyncHandler(async (req, res) => {
  const subtotal = req.body.subtotal || 0;
  const result = await couponService.validateCouponForCart({
    code: req.body.code,
    subtotal,
    cartItems: req.body.cartItems || [],
  });

  return sendSuccess(res, {
    message: 'Coupon is valid',
    data: {
      code: result.coupon.code,
      discount: result.discount,
      discountType: result.coupon.discountType,
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
