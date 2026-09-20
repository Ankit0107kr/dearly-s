const orderService = require('../services/order.service');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');
const Order = require('../models/Order');

const createOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrderFromCart(
    req.user._id,
    req.body,
    req.headers['idempotency-key']
  );
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Order created successfully',
    data: result,
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getUserOrders(req.user._id, req.query);
  return sendSuccess(res, {
    message: 'Orders fetched successfully',
    data: result,
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user._id, req.params.id);
  return sendSuccess(res, {
    message: 'Order fetched successfully',
    data: { order },
  });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user._id, req.params.id);
  return sendSuccess(res, {
    message: 'Order cancelled successfully',
    data: { order },
  });
});

const adminListOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.orderStatus) filter.orderStatus = req.query.orderStatus;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.fromDate || req.query.toDate) {
    filter.createdAt = {};
    if (req.query.fromDate) {
      const from = new Date(req.query.fromDate);
      if (!Number.isNaN(from.getTime())) filter.createdAt.$gte = from;
    }
    if (req.query.toDate) {
      const to = new Date(req.query.toDate);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }
    if (!Object.keys(filter.createdAt).length) delete filter.createdAt;
  }

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'firstName lastName email'),
    Order.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: 'Orders fetched successfully',
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.orderStatus, {
    adminId: req.user._id,
    note: req.body.note,
  });

  return sendSuccess(res, {
    message: 'Order status updated',
    data: { order },
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  adminListOrders,
  adminUpdateOrderStatus,
};
