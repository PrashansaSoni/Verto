import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-()]+$/).required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  role: Joi.string().valid('admin', 'user').default('user')
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-()]+$/).required()
});
