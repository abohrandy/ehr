const Joi = require('joi');

const createClientSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    first_name: Joi.string().min(1).max(100).required(),
    last_name: Joi.string().min(1).max(100).required(),
    phone: Joi.string().max(20).allow('', null),
    date_of_birth: Joi.date().iso().allow(null),
    gender: Joi.string().max(20).allow('', null),
    address: Joi.string().allow('', null),
    emergency_contact_name: Joi.string().max(100).allow('', null),
    emergency_contact_phone: Joi.string().max(20).allow('', null),
    case_type: Joi.string().valid('individual', 'couple', 'family', 'child').default('individual'),
    assigned_therapist_id: Joi.string().uuid().allow(null),
});

const updateClientSchema = Joi.object({
    first_name: Joi.string().min(1).max(100),
    last_name: Joi.string().min(1).max(100),
    phone: Joi.string().max(20).allow('', null),
    date_of_birth: Joi.date().iso().allow(null),
    gender: Joi.string().max(20).allow('', null),
    address: Joi.string().allow('', null),
    emergency_contact_name: Joi.string().max(100).allow('', null),
    emergency_contact_phone: Joi.string().max(20).allow('', null),
    case_type: Joi.string().valid('individual', 'couple', 'family', 'child'),
    status: Joi.string().valid('active', 'inactive', 'discharged'),
    assigned_therapist_id: Joi.string().uuid().allow(null),
    notes: Joi.string().allow('', null),
}).min(1);

const linkRelationshipSchema = Joi.object({
    client_id_1: Joi.string().uuid().required(),
    client_id_2: Joi.string().uuid().required(),
    relationship_type: Joi.string().valid('spouse', 'partner', 'parent', 'child', 'sibling', 'guardian', 'other').required(),
    case_group_id: Joi.string().uuid().allow(null),
});

module.exports = { createClientSchema, updateClientSchema, linkRelationshipSchema };
