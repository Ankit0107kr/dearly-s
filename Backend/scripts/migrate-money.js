require('dotenv').config();

const mongoose = require('mongoose');
const { env, validateEnv } = require('../src/config/env');

// Rewrites money fields written as BSON doubles before the Decimal128 change.
// Safe to re-run: values already stored as decimal are left alone.
const TARGETS = [
  { collection: 'products', fields: ['price', 'discountPrice'], arrays: [{ path: 'variants', fields: ['price'] }] },
  { collection: 'carts', fields: ['totalAmount'], arrays: [{ path: 'items', fields: ['unitPrice'] }] },
  {
    collection: 'orders',
    fields: ['subtotal', 'discount', 'deliveryFee', 'totalAmount'],
    arrays: [{ path: 'items', fields: ['price'] }],
  },
  { collection: 'coupons', fields: ['discountValue', 'minimumAmount', 'maximumDiscount'], arrays: [] },
  { collection: 'payments', fields: ['amount'], arrays: [] },
];

// Via $toString so the decimal is built from the double's printed value rather
// than its exact binary expansion (499.99 -> "499.99", not 499.99000000000000909).
const convert = (ref) => ({
  $cond: [
    { $and: [{ $isNumber: ref }, { $ne: [{ $type: ref }, 'decimal'] }] },
    { $toDecimal: { $toString: { $round: [ref, 2] } } },
    ref,
  ],
});

const buildStage = ({ fields, arrays }) => {
  const stage = {};

  for (const field of fields) {
    stage[field] = convert(`$${field}`);
  }

  for (const { path, fields: itemFields } of arrays) {
    stage[path] = {
      $map: {
        input: { $ifNull: [`$${path}`, []] },
        as: 'item',
        in: {
          $mergeObjects: [
            '$$item',
            Object.fromEntries(itemFields.map((f) => [f, convert(`$$item.${f}`)])),
          ],
        },
      },
    };
  }

  return stage;
};

const migrate = async () => {
  validateEnv();
  await mongoose.connect(env.mongoUri);

  for (const target of TARGETS) {
    const collection = mongoose.connection.db.collection(target.collection);
    const result = await collection.updateMany({}, [{ $set: buildStage(target) }]);
    console.log(`${target.collection}: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
  }

  await mongoose.disconnect();
  console.log('Money migration complete');
};

migrate().catch((error) => {
  console.error('Money migration failed:', error.message);
  process.exit(1);
});
