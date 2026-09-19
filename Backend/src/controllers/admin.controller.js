const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../utils/constants');
const { toNumber } = require('../utils/money');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');

const getDashboardStats = asyncHandler(async (req, res) => {
  const [customers, products, orders, revenueAgg, pendingReviews] = await Promise.all([
    User.countDocuments({ role: 'CUSTOMER' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: PAYMENT_STATUS.PAID } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
    ]),
    Review.countDocuments({ isApproved: false }),
  ]);

  const revenue = toNumber(revenueAgg[0]?.revenue) || 0;
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'firstName lastName email');

  return sendSuccess(res, {
    message: 'Dashboard stats fetched successfully',
    data: {
      stats: {
        customers,
        activeProducts: products,
        totalOrders: orders,
        revenue,
        pendingReviews,
        ordersByStatus: await Order.aggregate([
          { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
        ]),
      },
      recentOrders,
    },
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = req.query.role ? { role: req.query.role } : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: 'Users fetched successfully',
    data: {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

module.exports = {
  getDashboardStats,
  listUsers,
};
