/**
 * Role-Based Access Control middleware.
 * Restricts access to specific roles.
 *
 * Usage: rbac('admin', 'therapist')
 */
function rbac(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions. Required roles: ' + allowedRoles.join(', '),
            });
        }

        next();
    };
}

module.exports = { rbac };
