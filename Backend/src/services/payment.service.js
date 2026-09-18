const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { env } = require('../config/env');
const { getRazorpayClient, isRazorpayConfigured } = require('../config/razorpay');
const { PAYMENT_STATUS, PAYMENT_PROVIDERS, ORDER_STATUS } = require('../utils/constants');
const orderService = require('./order.service');
const mongoose = require('mongoose');

const createPaymentOrder = async ({ order, userId }) => {
  if (!isRazorpayConfigured()) {
    return {
      providerConfigured: false,
      amount: order.totalAmount,
      currency: 'INR',
      orderId: order._id,
      message: 'Razorpay keys not configured. Order created with pending payment.',
    };
  }

  const razorpay = getRazorpayClient();
  const amountPaise = Math.round(order.totalAmount * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: order._id.toString(),
    notes: {
      orderId: order._id.toString(),
      userId: userId.toString(),
    },
  });

  const payment = await Payment.create({
    orderId: order._id,
    userId,
    provider: PAYMENT_PROVIDERS.RAZORPAY,
    providerOrderId: razorpayOrder.id,
    amount: order.totalAmount,
    currency: 'INR',
    status: PAYMENT_STATUS.PENDING,
    rawResponse: razorpayOrder,
  });

  return {
    providerConfigured: true,
    keyId: env.razorpay.keyId,
    amount: order.totalAmount,
    currency: 'INR',
    orderId: order._id,
    paymentId: payment._id,
    razorpayOrderId: razorpayOrder.id,
  };
};

const verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(body)
    .digest('hex');
  return expected === razorpay_signature;
};

const verifyPayment = async (userId, payload) => {
  if (!isRazorpayConfigured()) {
    const error = new Error('Razorpay is not configured');
    error.statusCode = 503;
    throw error;
  }

  const isValid = verifyRazorpaySignature(payload);
  if (!isValid) {
    const error = new Error('Invalid payment signature');
    error.statusCode = 400;
    throw error;
  }

  const payment = await Payment.findOne({
    providerOrderId: payload.razorpay_order_id,
    userId,
  });

  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    payment.paymentId = payload.razorpay_payment_id;
    payment.status = PAYMENT_STATUS.PAID;
    payment.rawResponse = payload;
    await payment.save({ session });

    const order = await orderService.markOrderPaid(payment.orderId, session);
    await session.commitTransaction();

    return { payment, order };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const handleWebhook = async (rawBody, signature) => {
  if (!env.razorpay.webhookSecret) {
    const error = new Error('Webhook secret is not configured');
    error.statusCode = 503;
    throw error;
  }

  const expected = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expected !== signature) {
    const error = new Error('Invalid webhook signature');
    error.statusCode = 400;
    throw error;
  }

  const event = JSON.parse(rawBody.toString());
  if (event.event === 'payment.captured') {
    const paymentEntity = event.payload.payment.entity;
    const payment = await Payment.findOne({ providerOrderId: paymentEntity.order_id });
    if (payment && payment.status !== PAYMENT_STATUS.PAID) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        payment.paymentId = paymentEntity.id;
        payment.status = PAYMENT_STATUS.PAID;
        payment.method = paymentEntity.method;
        payment.rawResponse = paymentEntity;
        await payment.save({ session });
        await orderService.markOrderPaid(payment.orderId, session);
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }
  }

  if (event.event === 'payment.failed') {
    const paymentEntity = event.payload.payment.entity;
    await Payment.findOneAndUpdate(
      { providerOrderId: paymentEntity.order_id },
      {
        status: PAYMENT_STATUS.FAILED,
        paymentId: paymentEntity.id,
        rawResponse: paymentEntity,
      }
    );
    await Order.findOneAndUpdate(
      { _id: paymentEntity.notes?.orderId },
      { paymentStatus: PAYMENT_STATUS.FAILED, orderStatus: ORDER_STATUS.FAILED }
    );
  }

  return { received: true };
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
};
