/**
 * Joi validation middleware wrapper.
 * Validates request body, query, or params against a Joi schema.
 *
 * Usage: validate(schema, 'body')
 */
function validate(schema, property = 'body') {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors,
            });
        }

        // Replace with sanitized values
        req[property] = value;
        next();
    };
}

module.exports = { validate };
