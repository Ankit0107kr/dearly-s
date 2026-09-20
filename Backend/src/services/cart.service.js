const Cart = require('../models/Cart');
const Product = require('../models/Product');
const productService = require('./product.service');
const inventoryService = require('./inventory.service');
const { round2 } = require('../utils/money');

const recalculateCartTotal = (cart) => {
  cart.totalAmount = round2(
    cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );
  return cart;
};

// Deliberately unpopulated: the write paths compare item.productId by id, and a
// populated document's toString() is its inspect output, not the id.
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [], totalAmount: 0 });
  }
  return cart;
};

const resolveCartItemPricing = async ({ productId, variantId, quantity, customization }) => {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    const error = new Error('Product is not available');
    error.statusCode = 400;
    throw error;
  }

  let variant = null;
  if (variantId) {
    variant = product.variants.id(variantId);
    if (!variant) {
      const error = new Error('Invalid product variant');
      error.statusCode = 400;
      throw error;
    }
  } else if (product.variants?.length) {
    const error = new Error('Variant selection is required for this product');
    error.statusCode = 400;
    throw error;
  }

  productService.validateCustomizationInput(product, customization);
  await inventoryService.checkAvailability({ productId, variantId, quantity });

  return {
    product,
    variant,
    unitPrice: productService.getUnitPrice(product, variant),
  };
};

const getCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  return cart.populate('items.productId');
};

const addCartItem = async (userId, payload) => {
  const cart = await getOrCreateCart(userId);
  const { product, variant, unitPrice } = await resolveCartItemPricing(payload);

  const existing = cart.items.find(
    (item) =>
      item.productId.toString() === product._id.toString() &&
      String(item.variantId || '') === String(payload.variantId || '') &&
      JSON.stringify(item.customization || []) === JSON.stringify(payload.customization || [])
  );

  if (existing) {
    existing.quantity += payload.quantity;
    await inventoryService.checkAvailability({
      productId: product._id,
      variantId: payload.variantId,
      quantity: existing.quantity,
    });
    existing.unitPrice = unitPrice;
  } else {
    cart.items.push({
      productId: product._id,
      variantId: payload.variantId,
      quantity: payload.quantity,
      unitPrice,
      customization: payload.customization || [],
    });
  }

  recalculateCartTotal(cart);
  await cart.save();
  return cart.populate('items.productId');
};

const updateCartItem = async (userId, itemId, payload) => {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);

  if (!item) {
    const error = new Error('Cart item not found');
    error.statusCode = 404;
    throw error;
  }

  const quantity = payload.quantity ?? item.quantity;
  await inventoryService.checkAvailability({
    productId: item.productId,
    variantId: item.variantId,
    quantity,
  });

  const product = await Product.findById(item.productId);
  const variant = item.variantId ? product?.variants.id(item.variantId) : null;
  item.quantity = quantity;
  item.unitPrice = productService.getUnitPrice(product, variant);

  recalculateCartTotal(cart);
  await cart.save();
  return cart.populate('items.productId');
};

const removeCartItem = async (userId, itemId) => {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) {
    const error = new Error('Cart item not found');
    error.statusCode = 404;
    throw error;
  }

  item.deleteOne();
  recalculateCartTotal(cart);
  await cart.save();
  return cart.populate('items.productId');
};

const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  cart.totalAmount = 0;
  await cart.save();
  return cart;
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};
