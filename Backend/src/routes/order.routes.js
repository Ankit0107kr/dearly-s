const express = require('express');
const orderController = require('../controllers/order.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { createOrderSchema } = require('../validators/order.validator');
const { writeLimiter } = require('../middlewares/rateLimit.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', writeLimiter, validate(createOrderSchema), orderController.createOrder);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;
