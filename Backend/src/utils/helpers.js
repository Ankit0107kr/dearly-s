const { sendError } = require('./response');
const { env } = require('../config/env');

const logControllerError = (context, error) => {
  const statusCode = error?.statusCode || 500;
  if (statusCode >= 500) {
    console.error(`---------ERROR ${context}---------`, error);
    return;
  }
  console.log(`---------ERROR ${context}---------`, error?.message || error);
};

const handleControllerError = (res, error, context) => {
  if (error?.isValidationError && error.details) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Validation failed',
      error: error.details,
    });
  }

  if (error?.name === 'CastError') {
    return sendError(res, { statusCode: 400, message: 'Invalid identifier' });
  }

  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return sendError(res, {
      statusCode: 409,
      message: `Duplicate value for ${field}`,
    });
  }

  const statusCode = error?.statusCode || 500;
  logControllerError(context, error);

  const message =
    statusCode >= 500 && env.nodeEnv === 'production'
      ? 'Internal server error'
      : error?.message || 'Internal server error';

  return sendError(res, { statusCode, message });
};

const asyncHandler = (fn, context) => (req, res, next) => {
  const label = context || `${req.method} ${req.originalUrl}`;
  Promise.resolve(fn(req, res, next)).catch((error) => {
    if (res.headersSent) {
      return next(error);
    }
    return handleControllerError(res, error, label);
  });
};

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toObjectIdString = (id) => (id ? id.toString() : id);

const pickDefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

module.exports = {
  asyncHandler,
  slugify,
  toObjectIdString,
  pickDefined,
};
