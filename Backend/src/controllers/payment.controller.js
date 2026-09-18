const paymentService = require('../services/payment.service');
const Order = require('../models/Order');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');
const { isRazorpayConfigured } = require('../config/razorpay');

const createPayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, userId: req.user._id });
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const payment = await paymentService.createPaymentOrder({ order, userId: req.user._id });
  return sendSuccess(res, {
    message: 'Payment initiated successfully',
    data: payment,
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyPayment(req.user._id, req.body);
  return sendSuccess(res, {
    message: 'Payment verified successfully',
    data: result,
  });
});

const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  await paymentService.handleWebhook(req.body, signature);
  return sendSuccess(res, { message: 'Webhook processed' });
});

const getPaymentConfig = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Payment configuration',
    data: { razorpayConfigured: isRazorpayConfigured() },
  })
);

module.exports = {
  createPayment,
  verifyPayment,
  webhook,
  getPaymentConfig,
};
