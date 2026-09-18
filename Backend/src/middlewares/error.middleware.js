const { env } = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errorPayload = null;

  if (err.isValidationError && err.details) {
    statusCode = 400;
    message = 'Validation failed';
    errorPayload = err.details;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errorPayload = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
    errorPayload = { field };
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier';
  } else if (statusCode >= 500 && env.nodeEnv === 'production') {
    message = 'Internal server error';
    errorPayload = null;
  } else if (env.nodeEnv !== 'production' && statusCode >= 500) {
    errorPayload = {
      name: err.name,
      stack: err.stack,
    };
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  const body = {
    success: false,
    message,
  };

  if (errorPayload) {
    body.error = errorPayload;
  }

  res.status(statusCode).json(body);
};

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFoundHandler };
