/**
 * Global error handler middleware.
 */
function errorHandler(err, req, res, _next) {
    console.error('Error:', err);

    // Knex/PostgreSQL errors
    if (err.code === '23505') {
        return res.status(409).json({
            success: false,
            error: 'A record with this information already exists.',
        });
    }

    if (err.code === '23503') {
        return res.status(400).json({
            success: false,
            error: 'Referenced record does not exist.',
        });
    }

    // Joi validation errors
    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: err.details.map((d) => d.message),
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token.',
        });
    }

    // Custom application errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
    }

    // Default
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
}

module.exports = { errorHandler };
