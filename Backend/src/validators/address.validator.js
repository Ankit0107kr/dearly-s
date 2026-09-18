const Joi = require('joi');
const { ADDRESS_TYPES } = require('../utils/constants');

const addressSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).required(),
  phone: Joi.string().trim().min(8).max(20).required(),
  addressLine1: Joi.string().trim().min(3).max(200).required(),
  addressLine2: Joi.string().trim().max(200).allow(''),
  landmark: Joi.string().trim().max(120).allow(''),
  city: Joi.string().trim().min(2).max(80).required(),
  state: Joi.string().trim().min(2).max(80).required(),
  country: Joi.string().trim().default('India'),
  postalCode: Joi.string().trim().min(4).max(12).required(),
  addressType: Joi.string()
    .valid(...Object.values(ADDRESS_TYPES))
    .default(ADDRESS_TYPES.HOME),
  isDefault: Joi.boolean().default(false),
});

const updateAddressSchema = addressSchema.fork(Object.keys(addressSchema.describe().keys), (s) =>
  s.optional()
);

module.exports = {
  addressSchema,
  updateAddressSchema,
};
