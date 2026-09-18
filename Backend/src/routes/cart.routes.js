const express = require('express');
const cartController = require('../controllers/cart.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { addCartItemSchema, updateCartItemSchema } = require('../validators/order.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', validate(addCartItemSchema), cartController.addCartItem);
router.patch('/items/:itemId', validate(updateCartItemSchema), cartController.updateCartItem);
router.delete('/items/:itemId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
