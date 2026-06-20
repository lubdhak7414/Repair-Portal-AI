import Joi from 'joi';

export const createServiceSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  category: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  estimatedPrice: Joi.object({
    min: Joi.number().min(0).required(),
    max: Joi.number().min(0).required(),
  }).required(),
  estimatedDuration: Joi.number().integer().min(1).required(),
  image: Joi.string().uri().allow('').default(''),
});

export const updateServiceSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  category: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().min(10).max(2000),
  estimatedPrice: Joi.object({
    min: Joi.number().min(0),
    max: Joi.number().min(0),
  }),
  estimatedDuration: Joi.number().integer().min(1),
  image: Joi.string().uri().allow(''),
  isActive: Joi.boolean(),
}).min(1).message('At least one field must be provided for update');
