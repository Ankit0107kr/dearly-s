const Joi = require('joi');
const { DISCOUNT_TYPES, DELIVERY_TYPES } = require('../utils/constants');

const validateCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().required(),
  subtotal: Joi.number().min(0).optional(),
});

const createCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().required(),
  discountType: Joi.string()
    .valid(...Object.values(DISCOUNT_TYPES))
    .required(),
  discountValue: Joi.number().min(0).required(),
  minimumAmount: Joi.number().min(0).default(0),
  maximumDiscount: Joi.number().min(0).optional(),
  startDate: Joi.date().required(),
  expiryDate: Joi.date().greater(Joi.ref('startDate')).required(),
  usageLimit: Joi.number().min(1).optional(),
  applicableCategories: Joi.array().items(Joi.string().hex().length(24)).default([]),
  applicableProducts: Joi.array().items(Joi.string().hex().length(24)).default([]),
  isActive: Joi.boolean().default(true),
});

const updateCouponSchema = createCouponSchema.fork(
  ['code', 'discountType', 'discountValue', 'startDate', 'expiryDate'],
  (schema) => schema.optional()
);

module.exports = {
  validateCouponSchema,
  createCouponSchema,
  updateCouponSchema,
};
