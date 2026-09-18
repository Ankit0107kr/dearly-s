const mongoose = require('mongoose');
const { CUSTOMIZATION_FIELD_TYPES } = require('../utils/constants');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    alt: { type: String, trim: true },
  },
  { _id: false }
);

const customizationFieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(CUSTOMIZATION_FIELD_TYPES),
      required: true,
    },
    required: { type: Boolean, default: false },
    placeholder: { type: String, trim: true },
    options: [{ type: String, trim: true }],
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    attributes: {
      size: { type: String, trim: true },
      color: { type: String, trim: true },
      material: { type: String, trim: true },
    },
    sku: { type: String, trim: true, index: true },
    price: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    images: [imageSchema],
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    shortDescription: { type: String, trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    images: [imageSchema],
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    variants: [variantSchema],
    customizationFields: [customizationFieldSchema],
    inventory: {
      sku: { type: String, trim: true },
      stock: { type: Number, default: 0, min: 0 },
      reservedStock: { type: Number, default: 0, min: 0 },
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', tags: 'text', shortDescription: 'text' });

module.exports = mongoose.model('Product', productSchema);
