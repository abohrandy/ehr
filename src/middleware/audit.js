const db = require('../db/knex');

/**
 * Audit logging middleware.
 * Automatically logs create/update/delete actions.
 *
 * Usage: auditLog('CREATE', 'session_notes')
 */
function auditLog(action, resourceType) {
    return async (req, res, next) => {
        // Store original json method to capture response
        const originalJson = res.json.bind(res);

        res.json = function (data) {
            // Log after successful response
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                const resourceId = data?.data?.id || req.params?.id || null;

                db('audit_logs')
                    .insert({
                        user_id: req.user.id,
                        action: action,
                        resource_type: resourceType,
                        resource_id: resourceId,
                        details: JSON.stringify({
                            method: req.method,
                            path: req.originalUrl,
                            body: sanitizeBody(req.body),
                        }),
                        ip_address: req.ip || req.connection?.remoteAddress,
                    })
                    .catch((err) => {
                        console.error('Audit log error:', err.message);
                    });
            }

            return originalJson(data);
        };

        next();
    };
}

/**
 * Remove sensitive fields from body before logging.
 */
function sanitizeBody(body) {
    if (!body) return {};
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'password_hash', 'refresh_token', 'content'];
    sensitiveFields.forEach((field) => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });
    return sanitized;
}

module.exports = { auditLog };
