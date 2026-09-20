const { DELIVERY_TYPES, FREE_SHIPPING_THRESHOLD } = require('../utils/constants');

const DELIVERY_FEES = {
  [DELIVERY_TYPES.STANDARD]: 99,
  [DELIVERY_TYPES.SAME_DAY]: 349,
  [DELIVERY_TYPES.EXPRESS]: 199,
  [DELIVERY_TYPES.SCHEDULED]: 349,
};

// The city-based discount that used to live here was removed: it was not shown
// anywhere in the UI, so the cart preview and the charged total disagreed.
const calculateDeliveryFee = ({ deliveryType = DELIVERY_TYPES.STANDARD, subtotal = 0 }) => {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return DELIVERY_FEES[deliveryType] ?? DELIVERY_FEES[DELIVERY_TYPES.STANDARD];
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
  DELIVERY_FEES,
  calculateDeliveryFee,
  validateDeliveryDate,
  validateDeliverySlot,
};
