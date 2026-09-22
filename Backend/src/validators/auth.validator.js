const Joi = require('joi');

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(80).required(),
  lastName: Joi.string().trim().min(1).max(80).required(),
  email: Joi.string().trim().lowercase().email().required(),
  phone: Joi.string().trim().min(8).max(20).optional().allow(''),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

const googleSchema = Joi.object({
  credential: Joi.string().min(10).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleSchema,
};
