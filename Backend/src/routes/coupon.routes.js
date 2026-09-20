const express = require('express');
const couponController = require('../controllers/coupon.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { validateCouponSchema } = require('../validators/coupon.validator');
const { writeLimiter } = require('../middlewares/rateLimit.middleware');

const router = express.Router();

router.post('/validate', writeLimiter, authenticate, validate(validateCouponSchema), couponController.validateCoupon);

module.exports = router;
