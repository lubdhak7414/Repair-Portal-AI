import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\+?[0-9]{7,15}$/)
    .required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('user', 'technician', 'admin').default('user'),
  address: Joi.object({
    street: Joi.string().allow('').default(''),
    city: Joi.string().allow('').default(''),
    area: Joi.string().allow('').default(''),
    postalCode: Joi.string().allow('').default(''),
  }).default({}),
  picture: Joi.string().uri().allow('').default(''),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  phone: Joi.string().pattern(/^\+?[0-9]{7,15}$/),
  picture: Joi.string().uri().allow(''),
  isActive: Joi.boolean(),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    area: Joi.string().allow(''),
    postalCode: Joi.string().allow(''),
  }),
  password: Joi.string().min(6).max(128),
}).min(1).message('At least one field must be provided for update');
