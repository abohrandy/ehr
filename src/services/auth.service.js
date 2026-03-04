const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/knex');
const config = require('../config');

const SALT_ROUNDS = 12;

/**
 * Register a new user.
 */
async function register({ email, password, role, first_name, last_name, phone }) {
    const existing = await db('users').where({ email }).first();
    if (existing) {
        const error = new Error('Email already registered.');
        error.statusCode = 409;
        throw error;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db('users')
        .insert({ email, password_hash, role, first_name, last_name, phone })
        .returning(['id', 'email', 'role', 'first_name', 'last_name', 'phone', 'is_active', 'created_at']);

    return user;
}

/**
 * Login and return tokens.
 */
async function login({ email, password }) {
    const user = await db('users').where({ email }).first();
    if (!user || !user.is_active) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401;
        throw error;
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    const refreshToken = jwt.sign(tokenPayload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });

    // Store refresh token
    await db('users').where({ id: user.id }).update({
        refresh_token: refreshToken,
        last_login_at: db.fn.now(),
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
    };
}

/**
 * Refresh access token using a valid refresh token.
 */
async function refreshToken(token) {
    try {
        const decoded = jwt.verify(token, config.jwt.refreshSecret);
        const user = await db('users').where({ id: decoded.id, refresh_token: token }).first();

        if (!user || !user.is_active) {
            const error = new Error('Invalid refresh token.');
            error.statusCode = 401;
            throw error;
        }

        const tokenPayload = { id: user.id, email: user.email, role: user.role };
        const newAccessToken = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
        const newRefreshToken = jwt.sign(tokenPayload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });

        await db('users').where({ id: user.id }).update({ refresh_token: newRefreshToken });

        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
        };
    } catch (err) {
        if (err.statusCode) throw err;
        const error = new Error('Invalid refresh token.');
        error.statusCode = 401;
        throw error;
    }
}

/**
 * Logout — invalidate refresh token.
 */
async function logout(userId) {
    await db('users').where({ id: userId }).update({ refresh_token: null });
}

/**
 * Get user profile by ID.
 */
async function getProfile(userId) {
    const user = await db('users')
        .select('id', 'email', 'role', 'first_name', 'last_name', 'phone', 'is_active', 'last_login_at', 'created_at')
        .where({ id: userId })
        .first();

    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    return user;
}

module.exports = { register, login, refreshToken, logout, getProfile };
