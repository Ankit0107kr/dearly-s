const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { registerSchema, loginSchema, googleSchema } = require('../validators/auth.validator');
const { authLimiter } = require('../middlewares/rateLimit.middleware');

const router = express.Router();


router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

router.post('/login', authLimiter, validate(loginSchema), authController.login);

router.post('/google', authLimiter, validate(googleSchema), authController.google);

router.get('/config', authController.config);

router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.getMe);

module.exports = router;
