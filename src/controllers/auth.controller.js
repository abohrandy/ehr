const authService = require('../services/auth.service');

async function register(req, res, next) {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({ success: true, data: user });
    } catch (err) { next(err); }
}

async function login(req, res, next) {
    try {
        const result = await authService.login(req.body);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

async function refresh(req, res, next) {
    try {
        const tokens = await authService.refreshToken(req.body.refresh_token);
        res.json({ success: true, data: tokens });
    } catch (err) { next(err); }
}

async function logout(req, res, next) {
    try {
        await authService.logout(req.user.id);
        res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) { next(err); }
}

async function me(req, res, next) {
    try {
        const user = await authService.getProfile(req.user.id);
        res.json({ success: true, data: user });
    } catch (err) { next(err); }
}

module.exports = { register, login, refresh, logout, me };
