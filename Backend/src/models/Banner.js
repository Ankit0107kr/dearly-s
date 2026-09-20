const mongoose = require('mongoose');
const { BANNER_PLACEMENTS } = require('../utils/constants');

const bannerSchema = new mongoose.Schema(
  {
    placement: {
      type: String,
      enum: Object.values(BANNER_PLACEMENTS),
      required: true,
      index: true,
    },
    eyebrow: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    accent: { type: String, trim: true },
    copy: { type: String, trim: true },
    image: {
      _id: false,
      url: { type: String, required: true },
      publicId: { type: String },
      alt: { type: String, trim: true },
    },
    ctaLabel: { type: String, trim: true },
    ctaHref: { type: String, trim: true },
    altCtaLabel: { type: String, trim: true },
    altCtaHref: { type: String, trim: true },
    motif: { type: String, trim: true },
    align: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
    sortOrder: { type: Number, default: 0 },
    startsAt: { type: Date },
    endsAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

bannerSchema.index({ placement: 1, isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
