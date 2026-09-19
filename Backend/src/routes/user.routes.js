const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const userController = require('../controllers/user.controller');
const addressController = require('../controllers/address.controller');
const { addressSchema, updateAddressSchema } = require('../validators/address.validator');

const router = express.Router();

router.get('/me', authenticate, userController.getProfile);
router.patch('/me', authenticate, userController.updateProfile);

router.get('/me/addresses', authenticate, addressController.listAddresses);
router.post('/me/addresses', authenticate, validate(addressSchema), addressController.createAddress);
router.patch(
  '/me/addresses/:id',
  authenticate,
  validate(updateAddressSchema),
  addressController.updateAddress
);
router.patch('/me/addresses/:id/default', authenticate, addressController.setDefaultAddress);
router.delete('/me/addresses/:id', authenticate, addressController.deleteAddress);

module.exports = router;
