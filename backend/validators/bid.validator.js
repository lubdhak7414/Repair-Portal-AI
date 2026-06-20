import Joi from 'joi';

export const createBidSchema = Joi.object({
  booking: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  technician: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  bidAmount: Joi.number().positive().required(),
  message: Joi.string().trim().max(1000).allow('').default(''),
  estimatedDuration: Joi.number().positive().required(),
});
