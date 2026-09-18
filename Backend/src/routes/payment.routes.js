const express = require('express');
const paymentController = require('../controllers/payment.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { verifyPaymentSchema } = require('../validators/order.validator');

const router = express.Router();

router.post('/create', authenticate, paymentController.createPayment);
router.post('/verify', authenticate, validate(verifyPaymentSchema), paymentController.verifyPayment);
router.get('/config', paymentController.getPaymentConfig);

module.exports = router;
