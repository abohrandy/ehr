const Joi = require('joi');

const createAppointmentSchema = Joi.object({
    therapist_id: Joi.string().uuid().required(),
    client_id: Joi.string().uuid().required(),
    start_time: Joi.date().iso().required(),
    session_type: Joi.string().valid('individual', 'couple', 'family', 'child').default('individual'),
    location: Joi.string().max(100).default('in-person'),
    notes: Joi.string().allow('', null),
});

const rescheduleSchema = Joi.object({
    start_time: Joi.date().iso().required(),
});

const cancelSchema = Joi.object({
    cancelled_reason: Joi.string().allow('', null),
});

const slotsQuerySchema = Joi.object({
    therapist_id: Joi.string().uuid().required(),
    date: Joi.date().iso().required(),
});

const calendarQuerySchema = Joi.object({
    therapist_id: Joi.string().uuid(),
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().required(),
});

module.exports = {
    createAppointmentSchema,
    rescheduleSchema,
    cancelSchema,
    slotsQuerySchema,
    calendarQuerySchema,
};
