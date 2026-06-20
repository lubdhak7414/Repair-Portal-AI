import Joi from 'joi';

export const createWarrantyClaimSchema = Joi.object({
  description: Joi.string().trim().min(10).max(2000).required(),
});
