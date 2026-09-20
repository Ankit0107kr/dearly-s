const mongoose = require('mongoose');
const { TAXONOMY_KINDS } = require('../utils/constants');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    alt: { type: String, trim: true },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    image: imageSchema,
    // Occasions share slugs, images and motifs with categories, so they live in
    // the same collection behind a discriminator rather than a parallel model.
    kind: {
      type: String,
      enum: Object.values(TAXONOMY_KINDS),
      default: TAXONOMY_KINDS.CATEGORY,
      index: true,
    },
    blurb: { type: String, trim: true },
    note: { type: String, trim: true },
    window: { type: String, trim: true },
    motif: { type: String, trim: true },
    accent: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

categorySchema.index({ kind: 1, isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
