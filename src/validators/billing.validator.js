const Joi = require('joi');

const createInvoiceSchema = Joi.object({
    client_id: Joi.string().uuid().required(),
    appointment_id: Joi.string().uuid().allow(null),
    amount: Joi.number().precision(2).positive().required(),
    due_date: Joi.date().iso().allow(null),
    description: Joi.string().allow('', null),
});

const revenueQuerySchema = Joi.object({
    year: Joi.number().integer().min(2020).max(2100).required(),
    month: Joi.number().integer().min(1).max(12),
});

module.exports = { createInvoiceSchema, revenueQuerySchema };
