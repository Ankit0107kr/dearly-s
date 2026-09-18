const Product = require('../models/Product');

const getAvailableStock = (stock, reservedStock) => Math.max(0, (stock || 0) - (reservedStock || 0));

const findVariant = (product, variantId) => {
  if (!variantId) {
    return null;
  }
  return product.variants.id(variantId);
};

const resolveInventoryTarget = (product, variantId) => {
  const variant = findVariant(product, variantId);
  if (variant) {
    return {
      type: 'variant',
      product,
      variant,
      getStock: () => variant.stock,
      getReserved: () => variant.reservedStock,
      setReserved: (value) => {
        variant.reservedStock = value;
      },
      setStock: (value) => {
        variant.stock = value;
      },
    };
  }

  return {
    type: 'product',
    product,
    variant: null,
    getStock: () => product.inventory?.stock ?? 0,
    getReserved: () => product.inventory?.reservedStock ?? 0,
    setReserved: (value) => {
      product.inventory = product.inventory || {};
      product.inventory.reservedStock = value;
    },
    setStock: (value) => {
      product.inventory = product.inventory || {};
      product.inventory.stock = value;
    },
  };
};

const checkAvailability = async ({ productId, variantId, quantity, session }) => {
  const product = await Product.findById(productId).session(session || null);
  if (!product || !product.isActive) {
    const error = new Error('Product is not available');
    error.statusCode = 400;
    throw error;
  }

  const target = resolveInventoryTarget(product, variantId);
  const available = getAvailableStock(target.getStock(), target.getReserved());

  if (available < quantity) {
    const error = new Error('Insufficient stock');
    error.statusCode = 400;
    throw error;
  }

  return { product, target, available };
};

const reserveStock = async ({ productId, variantId, quantity, session }) => {
  const { product, target } = await checkAvailability({ productId, variantId, quantity, session });
  target.setReserved(target.getReserved() + quantity);
  await product.save({ session });
  return product;
};

const releaseStock = async ({ productId, variantId, quantity, session }) => {
  const product = await Product.findById(productId).session(session || null);
  if (!product) {
    return;
  }

  const target = resolveInventoryTarget(product, variantId);
  target.setReserved(Math.max(0, target.getReserved() - quantity));
  await product.save({ session });
};

const reduceStock = async ({ productId, variantId, quantity, session }) => {
  const product = await Product.findById(productId).session(session || null);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const target = resolveInventoryTarget(product, variantId);
  target.setStock(Math.max(0, target.getStock() - quantity));
  target.setReserved(Math.max(0, target.getReserved() - quantity));
  await product.save({ session });
};

const restoreStock = async ({ productId, variantId, quantity, session }) => {
  const product = await Product.findById(productId).session(session || null);
  if (!product) {
    return;
  }

  const target = resolveInventoryTarget(product, variantId);
  target.setStock(target.getStock() + quantity);
  await product.save({ session });
};

module.exports = {
  checkAvailability,
  reserveStock,
  releaseStock,
  reduceStock,
  restoreStock,
  getAvailableStock,
};
