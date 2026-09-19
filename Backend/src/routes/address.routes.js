const express = require('express');
const addressController = require('../controllers/address.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { addressSchema, updateAddressSchema } = require('../validators/address.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', addressController.listAddresses);
router.post('/', validate(addressSchema), addressController.createAddress);
router.patch('/:id', validate(updateAddressSchema), addressController.updateAddress);
router.patch('/:id/default', addressController.setDefaultAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
