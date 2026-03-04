const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter: 100 requests per 15 minutes.
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests. Please try again later.',
    },
});

/**
 * Auth rate limiter: 5 requests per 15 minutes.
 * Prevents brute-force login attempts.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
    },
});

module.exports = { generalLimiter, authLimiter };
