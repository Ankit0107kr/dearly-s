const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');

// $addToSet / $pull compare ObjectIds in the server, so populated docs can never
// break the match the way an in-memory toString() comparison did.
const upsertWishlist = (userId, update = {}) =>
  Wishlist.findOneAndUpdate({ userId }, { $setOnInsert: { userId }, ...update }, {
    new: true,
    upsert: true,
  }).populate('products');

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await upsertWishlist(req.user._id);
  return sendSuccess(res, {
    message: 'Wishlist fetched successfully',
    data: { wishlist },
  });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.productId, isActive: true });
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const wishlist = await upsertWishlist(req.user._id, {
    $addToSet: { products: product._id },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Product added to wishlist',
    data: { wishlist },
  });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await upsertWishlist(req.user._id, {
    $pull: { products: req.params.productId },
  });

  return sendSuccess(res, {
    message: 'Product removed from wishlist',
    data: { wishlist },
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
