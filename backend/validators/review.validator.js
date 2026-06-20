import Joi from 'joi';

export const createReviewSchema = Joi.object({
  booking: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  user: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  technician: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  rating: Joi.object({
    overall: Joi.number().integer().min(1).max(5).required(),
    punctuality: Joi.number().integer().min(1).max(5),
    workQuality: Joi.number().integer().min(1).max(5),
    communication: Joi.number().integer().min(1).max(5),
    cleanliness: Joi.number().integer().min(1).max(5),
  }).required(),
  comment: Joi.string().trim().max(2000).allow('').default(''),
  images: Joi.array().items(Joi.string()).default([]),
  wouldRecommend: Joi.boolean().default(true),
  isAnonymous: Joi.boolean().default(false),
});

export const respondToReviewSchema = Joi.object({
  comment: Joi.string().trim().max(2000).required(),
  technicianId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
});
