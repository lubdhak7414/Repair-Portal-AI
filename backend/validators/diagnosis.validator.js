import Joi from 'joi';

export const diagnosisSchema = Joi.object({
  description: Joi.string().trim().max(5000).allow('').default(''),
  images: Joi.array().items(Joi.string()).max(3).default([]),
}).or('description', 'images');
