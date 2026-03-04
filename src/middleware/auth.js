const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * JWT Authentication middleware.
 * Extracts and verifies JWT from Authorization header.
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Access denied. No token provided.',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired. Please refresh your token.',
            });
        }
        return res.status(401).json({
            success: false,
            error: 'Invalid token.',
        });
    }
}

module.exports = { authenticate };
