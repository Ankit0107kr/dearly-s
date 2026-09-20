const mongoose = require('mongoose');
const Order = require('../models/Order');
const inventoryService = require('./inventory.service');
const couponService = require('./coupon.service');
const { ORDER_STATUS, PAYMENT_STATUS, RESERVATION_TTL_MINUTES } = require('../utils/constants');
const logger = require('../config/logger');

const getReservationExpiry = () => new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

const releaseOrderReservation = async (order, session) => {
  for (const item of order.items) {
    await inventoryService.releaseStock({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      session,
    });
  }
  order.reservationExpiresAt = undefined;
};

const failOrderAndRelease = async (orderId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Re-read the guard inside the transaction: the order may have been paid
    // between the sweep query and this write.
    const order = await Order.findOne({
      _id: orderId,
      paymentStatus: PAYMENT_STATUS.PENDING,
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return false;
    }

    await releaseOrderReservation(order, session);
    if (order.couponId) {
      await couponService.releaseRedemption({ couponId: order.couponId, userId: order.userId }, session);
    }
    order.paymentStatus = PAYMENT_STATUS.FAILED;
    order.orderStatus = ORDER_STATUS.FAILED;
    order.statusHistory.push({
      status: ORDER_STATUS.FAILED,
      at: new Date(),
      note: 'Payment not completed before the stock reservation expired',
    });
    await order.save({ session });
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const releaseExpiredReservations = async (limit = 50) => {
  const expired = await Order.find({
    paymentStatus: PAYMENT_STATUS.PENDING,
    orderStatus: ORDER_STATUS.PLACED,
    reservationExpiresAt: { $lte: new Date() },
  })
    .select('_id')
    .limit(limit);

  let released = 0;
  for (const { _id } of expired) {
    try {
      if (await failOrderAndRelease(_id)) {
        released += 1;
      }
    } catch (error) {
      logger.error({ err: error, orderId: _id }, 'Reservation release failed');
    }
  }

  return released;
};

module.exports = {
  getReservationExpiry,
  releaseOrderReservation,
  failOrderAndRelease,
  releaseExpiredReservations,
};
