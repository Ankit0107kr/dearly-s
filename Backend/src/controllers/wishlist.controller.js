const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ userId }).populate('products');
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, products: [] });
  }
  return wishlist;
};

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
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

  const wishlist = await getOrCreateWishlist(req.user._id);
  const exists = wishlist.products.some((id) => id.toString() === product._id.toString());
  if (!exists) {
    wishlist.products.push(product._id);
    await wishlist.save();
  }

  await wishlist.populate('products');
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Product added to wishlist',
    data: { wishlist },
  });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== req.params.productId
  );
  await wishlist.save();
  await wishlist.populate('products');

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
