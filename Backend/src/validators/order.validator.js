const Joi = require('joi');
const { DELIVERY_TYPES } = require('../utils/constants');

const customizationItemSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().optional(),
  value: Joi.string().allow(''),
  imageUrl: Joi.string().uri().optional(),
});

const addCartItemSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  variantId: Joi.string().hex().length(24).optional(),
  quantity: Joi.number().integer().min(1).default(1),
  customization: Joi.array().items(customizationItemSchema).default([]),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

const createOrderSchema = Joi.object({
  addressId: Joi.string().hex().length(24).required(),
  couponCode: Joi.string().trim().uppercase().optional(),
  deliveryType: Joi.string()
    .valid(...Object.values(DELIVERY_TYPES))
    .default(DELIVERY_TYPES.STANDARD),
  deliveryDate: Joi.date().optional(),
  deliverySlot: Joi.string().trim().optional(),
});

const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

const reviewSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(2000).allow(''),
});

module.exports = {
  addCartItemSchema,
  updateCartItemSchema,
  createOrderSchema,
  verifyPaymentSchema,
  reviewSchema,
};
