const Review = require('../models/Review');
const Order = require('../models/Order');
const productService = require('../services/product.service');
const { ORDER_STATUS } = require('../utils/constants');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');

const listProductReviews = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = { productId: req.params.productId, isApproved: true };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: 'Reviews fetched successfully',
    data: {
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

const assertPurchasedProduct = async (userId, productId, orderId) => {
  const order = await Order.findOne({
    _id: orderId,
    userId,
    orderStatus: ORDER_STATUS.DELIVERED,
  });

  if (!order) {
    const error = new Error('Delivered order required before reviewing');
    error.statusCode = 400;
    throw error;
  }

  const purchased = order.items.some((item) => item.productId.toString() === productId);
  if (!purchased) {
    const error = new Error('You can only review products you purchased');
    error.statusCode = 403;
    throw error;
  }
};

const createReview = asyncHandler(async (req, res) => {
  await assertPurchasedProduct(req.user._id, req.params.productId, req.body.orderId);

  const review = await Review.create({
    userId: req.user._id,
    productId: req.params.productId,
    orderId: req.body.orderId,
    rating: req.body.rating,
    comment: req.body.comment,
    images: req.body.images || [],
  });

  await productService.recalculateProductRating(req.params.productId);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Review submitted successfully',
    data: { review },
  });
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, userId: req.user._id });
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  await review.save();

  await productService.recalculateProductRating(review.productId);

  return sendSuccess(res, {
    message: 'Review updated successfully',
    data: { review },
  });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  await productService.recalculateProductRating(review.productId);

  return sendSuccess(res, {
    message: 'Review deleted successfully',
  });
});

const adminListReviews = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};
  if (req.query.isApproved === 'true') filter.isApproved = true;
  if (req.query.isApproved === 'false') filter.isApproved = false;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('productId', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: 'Reviews fetched successfully',
    data: {
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

const adminModerateReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: Boolean(req.body.isApproved) },
    { new: true }
  );

  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  // Hidden reviews must stop counting toward the product's rating.
  await productService.recalculateProductRating(review.productId);

  return sendSuccess(res, {
    message: 'Review moderated successfully',
    data: { review },
  });
});

module.exports = {
  listProductReviews,
  adminListReviews,
  adminModerateReview,
  createReview,
  updateReview,
  deleteReview,
};
