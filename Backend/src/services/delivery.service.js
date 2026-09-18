const { DELIVERY_TYPES } = require('../utils/constants');

const DELIVERY_FEES = {
  [DELIVERY_TYPES.STANDARD]: 49,
  [DELIVERY_TYPES.SAME_DAY]: 149,
  [DELIVERY_TYPES.EXPRESS]: 99,
  [DELIVERY_TYPES.SCHEDULED]: 79,
};

const calculateDeliveryFee = ({ deliveryType = DELIVERY_TYPES.STANDARD, city }) => {
  const base = DELIVERY_FEES[deliveryType] ?? DELIVERY_FEES[DELIVERY_TYPES.STANDARD];
  if (city && String(city).toLowerCase() === 'mumbai') {
    return Math.max(0, base - 20);
  }
  return base;
};

const validateDeliveryDate = ({ deliveryType, deliveryDate }) => {
  if (deliveryType === DELIVERY_TYPES.SCHEDULED && !deliveryDate) {
    const error = new Error('Delivery date is required for scheduled delivery');
    error.statusCode = 400;
    throw error;
  }

  if (!deliveryDate) {
    return;
  }

  const date = new Date(deliveryDate);
  if (Number.isNaN(date.getTime())) {
    const error = new Error('Invalid delivery date');
    error.statusCode = 400;
    throw error;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date < today) {
    const error = new Error('Delivery date cannot be in the past');
    error.statusCode = 400;
    throw error;
  }
};

const validateDeliverySlot = ({ deliveryType, deliverySlot }) => {
  if (deliveryType === DELIVERY_TYPES.SCHEDULED && !deliverySlot) {
    const error = new Error('Delivery slot is required for scheduled delivery');
    error.statusCode = 400;
    throw error;
  }
};

module.exports = {
  calculateDeliveryFee,
  validateDeliveryDate,
  validateDeliverySlot,
};
