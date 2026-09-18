const Joi = require('joi');
const { CUSTOMIZATION_FIELD_TYPES, DELIVERY_TYPES } = require('../utils/constants');

const imageSchema = Joi.object({
  url: Joi.string().uri().required(),
  publicId: Joi.string().optional(),
  alt: Joi.string().optional(),
});

const customizationFieldSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string()
    .valid(...Object.values(CUSTOMIZATION_FIELD_TYPES))
    .required(),
  required: Joi.boolean().default(false),
  placeholder: Joi.string().allow(''),
  options: Joi.array().items(Joi.string()),
});

const variantSchema = Joi.object({
  label: Joi.string().allow(''),
  attributes: Joi.object({
    size: Joi.string().allow(''),
    color: Joi.string().allow(''),
    material: Joi.string().allow(''),
  }).default({}),
  sku: Joi.string().allow(''),
  price: Joi.number().min(0),
  stock: Joi.number().min(0).default(0),
  images: Joi.array().items(imageSchema),
});

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  slug: Joi.string().trim().lowercase().optional(),
  description: Joi.string().allow(''),
  shortDescription: Joi.string().allow(''),
  category: Joi.string().hex().length(24).required(),
  subCategory: Joi.string().hex().length(24).optional(),
  price: Joi.number().min(0).required(),
  discountPrice: Joi.number().min(0).optional(),
  variants: Joi.array().items(variantSchema).default([]),
  customizationFields: Joi.array().items(customizationFieldSchema).default([]),
  inventory: Joi.object({
    sku: Joi.string().allow(''),
    stock: Joi.number().min(0).default(0),
  }).optional(),
  tags: Joi.array().items(Joi.string()).default([]),
  isFeatured: Joi.boolean().default(false),
  images: Joi.array().items(imageSchema).default([]),
});

const updateProductSchema = createProductSchema.fork(
  ['name', 'category', 'price'],
  (schema) => schema.optional()
);

module.exports = {
  createProductSchema,
  updateProductSchema,
};
