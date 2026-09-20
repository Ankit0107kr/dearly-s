const rateLimit = require('express-rate-limit');

const build = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });

const apiLimiter = build(600, 'Too many requests. Please try again later.');
const authLimiter = build(30, 'Too many authentication attempts. Please try again later.');
const writeLimiter = build(60, 'Too many requests. Please slow down.');

module.exports = { apiLimiter, authLimiter, writeLimiter };
