const Joi = require('joi');

const goalSchema = Joi.object({
    goal: Joi.string().required(),
    objectives: Joi.array().items(Joi.string()).default([]),
    status: Joi.string().valid('not_started', 'in_progress', 'completed').default('not_started'),
});

const createPlanSchema = Joi.object({
    client_id: Joi.string().uuid().required(),
    diagnosis: Joi.string().allow('', null),
    goals: Joi.array().items(goalSchema).default([]),
    start_date: Joi.date().iso().allow(null),
    target_end_date: Joi.date().iso().allow(null),
    case_type: Joi.string().valid('individual', 'couple', 'family', 'divorce', 'child').default('individual'),
    case_group_id: Joi.string().uuid().allow(null),
});

const updatePlanSchema = Joi.object({
    diagnosis: Joi.string().allow('', null),
    goals: Joi.array().items(goalSchema),
    target_end_date: Joi.date().iso().allow(null),
    case_type: Joi.string().valid('individual', 'couple', 'family', 'divorce', 'child'),
}).min(1);

const progressNoteSchema = Joi.object({
    note: Joi.string().required(),
});

module.exports = { createPlanSchema, updatePlanSchema, progressNoteSchema };
