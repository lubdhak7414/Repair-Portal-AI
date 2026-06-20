import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  sender: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  receiver: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  message: Joi.string().trim().max(5000),
  content: Joi.string().trim().max(5000),
  messageType: Joi.string()
    .valid('text', 'image', 'file')
    .default('text'),
  booking: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, ''),
  conversationId: Joi.string().allow(null, ''),
}).or('message', 'content');
