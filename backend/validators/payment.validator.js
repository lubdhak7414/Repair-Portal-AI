import Joi from 'joi';

export const createPaymentSchema = Joi.object({
  booking: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  user: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  technician: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  amount: Joi.number().positive().required(),
  paymentMethod: Joi.string()
    .valid('bkash', 'nagad', 'rocket', 'card', 'cash')
    .required(),
});

export const processPaymentSchema = Joi.object({
  transactionId: Joi.string().trim().required(),
  gatewayResponse: Joi.string().allow('').default(''),
});
