const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  authController.register
);

router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.getMe);

module.exports = router;
