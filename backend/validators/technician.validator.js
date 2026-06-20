import Joi from 'joi';

export const createTechnicianSchema = Joi.object({
  userId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  user: Joi.alternatives().try(Joi.string(), Joi.number()),
  services: Joi.array().items(Joi.alternatives().try(Joi.string(), Joi.number())).min(1).required(),
  experience: Joi.number().integer().min(0).required(),
  hourlyRate: Joi.number().positive().required(),
  availability: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      start: Joi.string().allow(''),
      end: Joi.string().allow(''),
      available: Joi.boolean(),
    })
  ).default({}),
  serviceArea: Joi.array().default([]),
  certifications: Joi.array().default([]),
});

export const searchTechniciansSchema = Joi.object({
  name: Joi.string().trim().allow(''),
  services: Joi.string().allow(''),
  minRating: Joi.number().min(0).max(5),
  city: Joi.string().trim().allow(''),
  area: Joi.string().trim().allow(''),
  experience: Joi.number().integer().min(0),
});
