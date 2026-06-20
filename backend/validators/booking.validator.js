import Joi from 'joi';

export const createBookingSchema = Joi.object({
  user: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  technician: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, ''),
  service: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  images: Joi.array().items(Joi.string()).default([]),
  preferredDate: Joi.date().iso().required(),
  preferredTime: Joi.string().required(),
  urgency: Joi.string()
    .valid('low', 'medium', 'high', 'emergency')
    .default('medium'),
  address: Joi.string().trim().min(5).max(500).required(),
  estimatedCost: Joi.number().min(0).default(0),
  isBidding: Joi.boolean().default(false),
  biddingDeadline: Joi.date().iso().allow(null, ''),
});

export const cancelBookingSchema = Joi.object({
  cancellationReason: Joi.string().trim().max(500).default('Cancelled by user'),
});

export const rescheduleBookingSchema = Joi.object({
  preferredDate: Joi.date().iso().required(),
  preferredTime: Joi.string().required(),
  rescheduleReason: Joi.string().trim().max(500).allow('').default(''),
});
