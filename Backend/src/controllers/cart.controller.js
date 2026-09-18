const cartService = require('../services/cart.service');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  return sendSuccess(res, {
    message: 'Cart fetched successfully',
    data: { cart },
  });
});

const addCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.addCartItem(req.user._id, req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Item added to cart',
    data: { cart },
  });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateCartItem(req.user._id, req.params.itemId, req.body);
  return sendSuccess(res, {
    message: 'Cart item updated',
    data: { cart },
  });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCartItem(req.user._id, req.params.itemId);
  return sendSuccess(res, {
    message: 'Cart item removed',
    data: { cart },
  });
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);
  return sendSuccess(res, {
    message: 'Cart cleared',
    data: { cart },
  });
});

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};
