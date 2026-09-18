const express = require('express');
const couponController = require('../controllers/coupon.controller');
const validate = require('../middlewares/validation.middleware');
const { validateCouponSchema } = require('../validators/coupon.validator');

const router = express.Router();

router.post('/validate', validate(validateCouponSchema), couponController.validateCoupon);

module.exports = router;
