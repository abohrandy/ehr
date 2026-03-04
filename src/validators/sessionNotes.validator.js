const Joi = require('joi');

const createNoteSchema = Joi.object({
    appointment_id: Joi.string().uuid().allow(null),
    client_id: Joi.string().uuid().required(),
    note_type: Joi.string().valid('soap', 'dap', 'progress').required(),
    // SOAP fields
    subjective: Joi.string().allow('', null),
    objective: Joi.string().allow('', null),
    assessment_section: Joi.string().allow('', null),
    plan_section: Joi.string().allow('', null),
    // DAP fields
    data_section: Joi.string().allow('', null),
    // Progress fields
    intervention: Joi.string().allow('', null),
});

const updateNoteSchema = Joi.object({
    subjective: Joi.string().allow('', null),
    objective: Joi.string().allow('', null),
    assessment_section: Joi.string().allow('', null),
    plan_section: Joi.string().allow('', null),
    data_section: Joi.string().allow('', null),
    intervention: Joi.string().allow('', null),
}).min(1);

const searchNotesSchema = Joi.object({
    client_id: Joi.string().uuid(),
    note_type: Joi.string().valid('soap', 'dap', 'progress'),
    search: Joi.string().min(1),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { createNoteSchema, updateNoteSchema, searchNotesSchema };
