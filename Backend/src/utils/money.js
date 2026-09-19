const mongoose = require('mongoose');

// Money is stored as Decimal128 so persisted amounts are exact. Arithmetic still
// happens in JS, so every computed amount goes through round2 before it is stored.
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const toNumber = (value) => {
  if (value === null || value === undefined) {
    return value;
  }
  return typeof value === 'number' ? value : parseFloat(value.toString());
};

const toPaise = (value) => Math.round(toNumber(value) * 100);

// Decimal128 ignores the `min` schema option, so non-negativity needs a validator.
const money = (options = {}) => ({
  type: mongoose.Schema.Types.Decimal128,
  get: toNumber,
  validate: {
    validator: (value) => value === null || value === undefined || toNumber(value) >= 0,
    message: '{PATH} cannot be negative',
  },
  ...options,
});

// Applied to every schema holding money so the API keeps emitting plain numbers.
const moneyJson = { toJSON: { getters: true }, toObject: { getters: true } };

module.exports = { round2, toNumber, toPaise, money, moneyJson };
