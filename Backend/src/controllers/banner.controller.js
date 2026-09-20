const Banner = require('../models/Banner');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');

const listBanners = asyncHandler(async (req, res) => {
  const now = new Date();
  const filter = {
    isActive: true,
    // A scheduling window is optional; an unset bound means "always".
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  };
  if (req.query.placement) {
    filter.placement = req.query.placement;
  }

  const banners = await Banner.find(filter).sort({ placement: 1, sortOrder: 1 });

  return sendSuccess(res, {
    message: 'Banners fetched successfully',
    data: { banners },
  });
});

const adminListBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ placement: 1, sortOrder: 1 });
  return sendSuccess(res, { message: 'Banners fetched successfully', data: { banners } });
});

const createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Banner created successfully',
    data: { banner },
  });
});

const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!banner) {
    const error = new Error('Banner not found');
    error.statusCode = 404;
    throw error;
  }
  return sendSuccess(res, { message: 'Banner updated successfully', data: { banner } });
});

const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!banner) {
    const error = new Error('Banner not found');
    error.statusCode = 404;
    throw error;
  }
  return sendSuccess(res, { message: 'Banner deactivated successfully', data: { banner } });
});

module.exports = {
  listBanners,
  adminListBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
