const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Address = require('../models/Address');
const Product = require('../models/Product');
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
} = require('../utils/constants');
const productService = require('./product.service');
const inventoryService = require('./inventory.service');
const couponService = require('./coupon.service');
const deliveryService = require('./delivery.service');

const buildOrderItemsFromCart = async (cart) => {
  const items = [];

  for (const cartItem of cart.items) {
    const product = await Product.findById(cartItem.productId);
    if (!product || !product.isActive) {
      const error = new Error(`Product ${cartItem.productId} is unavailable`);
      error.statusCode = 400;
      throw error;
    }

    const variant = cartItem.variantId ? product.variants.id(cartItem.variantId) : null;
    if (cartItem.variantId && !variant) {
      const error = new Error('Invalid variant in cart');
      error.statusCode = 400;
      throw error;
    }

    productService.validateCustomizationInput(product, cartItem.customization);
    await inventoryService.checkAvailability({
      productId: product._id,
      variantId: cartItem.variantId,
      quantity: cartItem.quantity,
    });

    const unitPrice = productService.getUnitPrice(product, variant);
    const image = variant?.images?.[0]?.url || product.images?.[0]?.url || null;

    items.push({
      productId: product._id,
      productName: product.name,
      image,
      price: unitPrice,
      quantity: cartItem.quantity,
      variantId: cartItem.variantId,
      variantLabel: variant?.label || null,
      customization: cartItem.customization || [],
    });
  }

  return items;
};

const createOrderFromCart = async (userId, payload) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart || !cart.items.length) {
      const error = new Error('Cart is empty');
      error.statusCode = 400;
      throw error;
    }

    const address = await Address.findOne({ _id: payload.addressId, userId }).session(session);
    if (!address) {
      const error = new Error('Shipping address not found');
      error.statusCode = 404;
      throw error;
    }

    deliveryService.validateDeliveryDate({
      deliveryType: payload.deliveryType,
      deliveryDate: payload.deliveryDate,
    });
    deliveryService.validateDeliverySlot({
      deliveryType: payload.deliveryType,
      deliverySlot: payload.deliverySlot,
    });

    const orderItems = await buildOrderItemsFromCart(cart);
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let discount = 0;
    let couponId;
    let couponCode;

    if (payload.couponCode) {
      const couponResult = await couponService.validateCouponForCart({
        code: payload.couponCode,
        subtotal,
        cartItems: orderItems,
      });
      discount = couponResult.discount;
      couponId = couponResult.coupon._id;
      couponCode = couponResult.coupon.code;
    }

    const deliveryFee = deliveryService.calculateDeliveryFee({
      deliveryType: payload.deliveryType,
      city: address.city,
    });

    const totalAmount = Math.max(0, subtotal - discount + deliveryFee);

    for (const item of orderItems) {
      await inventoryService.reserveStock({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        session,
      });
    }

    const [order] = await Order.create(
      [
        {
          userId,
          items: orderItems,
          shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            landmark: address.landmark,
            city: address.city,
            state: address.state,
            country: address.country,
            postalCode: address.postalCode,
            addressType: address.addressType,
          },
          subtotal,
          discount,
          deliveryFee,
          totalAmount,
          couponId,
          couponCode,
          paymentStatus: PAYMENT_STATUS.PENDING,
          orderStatus: ORDER_STATUS.PLACED,
          deliveryDate: payload.deliveryDate,
          deliverySlot: payload.deliverySlot,
          deliveryType: payload.deliveryType,
        },
      ],
      { session }
    );

    if (couponId) {
      await couponService.incrementCouponUsage(couponId, session);
    }

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save({ session });

    await session.commitTransaction();

    const paymentService = require('./payment.service');
    const paymentInfo = await paymentService.createPaymentOrder({
      order,
      userId,
    });

    return {
      order,
      payment: paymentInfo,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getUserOrders = async (userId, query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = { userId };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    items: orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const getOrderById = async (userId, orderId, { isAdmin = false } = {}) => {
  const filter = isAdmin ? { _id: orderId } : { _id: orderId, userId };
  const order = await Order.findOne(filter);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }
  return order;
};

const cancelOrder = async (userId, orderId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({ _id: orderId, userId }).session(session);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    if ([ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.orderStatus)) {
      const error = new Error('Order cannot be cancelled at this stage');
      error.statusCode = 400;
      throw error;
    }

    for (const item of order.items) {
      if (order.paymentStatus === PAYMENT_STATUS.PAID) {
        await inventoryService.restoreStock({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          session,
        });
      } else {
        await inventoryService.releaseStock({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          session,
        });
      }
    }

    order.orderStatus = ORDER_STATUS.CANCELLED;
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      order.paymentStatus = PAYMENT_STATUS.REFUNDED;
      order.orderStatus = ORDER_STATUS.REFUNDED;
    }

    await order.save({ session });
    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const markOrderPaid = async (orderId, session) => {
  const order = await Order.findById(orderId).session(session);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    return order;
  }

  for (const item of order.items) {
    await inventoryService.reduceStock({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      session,
    });
  }

  order.paymentStatus = PAYMENT_STATUS.PAID;
  order.orderStatus = ORDER_STATUS.PAYMENT_CONFIRMED;
  await order.save({ session });
  return order;
};

module.exports = {
  createOrderFromCart,
  getUserOrders,
  getOrderById,
  cancelOrder,
  markOrderPaid,
};
