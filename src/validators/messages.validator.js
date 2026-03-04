const Joi = require('joi');

const sendMessageSchema = Joi.object({
    recipient_id: Joi.string().uuid().required(),
    content: Joi.string().min(1).required(),
});

module.exports = { sendMessageSchema };
