const db = require('../db/knex');

async function listUsers(req, res, next) {
    try {
        const users = await db('users')
            .select('id', 'email', 'role', 'first_name', 'last_name', 'phone', 'is_active', 'last_login_at', 'created_at')
            .orderBy('created_at', 'desc');
        res.json({ success: true, data: users });
    } catch (err) { next(err); }
}

async function getUser(req, res, next) {
    try {
        const user = await db('users')
            .select('id', 'email', 'role', 'first_name', 'last_name', 'phone', 'is_active', 'last_login_at', 'created_at')
            .where({ id: req.params.id })
            .first();
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
        res.json({ success: true, data: user });
    } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
    try {
        const allowedFields = ['first_name', 'last_name', 'phone', 'role', 'is_active'];
        const updates = {};
        allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
        updates.updated_at = db.fn.now();

        const [user] = await db('users').where({ id: req.params.id }).update(updates)
            .returning(['id', 'email', 'role', 'first_name', 'last_name', 'phone', 'is_active']);
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
        res.json({ success: true, data: user });
    } catch (err) { next(err); }
}

async function deactivateUser(req, res, next) {
    try {
        const [user] = await db('users').where({ id: req.params.id })
            .update({ is_active: false, updated_at: db.fn.now() })
            .returning(['id', 'email', 'is_active']);
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
        res.json({ success: true, data: user, message: 'User deactivated.' });
    } catch (err) { next(err); }
}
const bcrypt = require('bcryptjs');

async function updateProfile(req, res, next) {
    try {
        const userId = req.user.id;
        const { first_name, last_name, phone, password } = req.body;

        const updates = { updated_at: db.fn.now() };
        if (first_name !== undefined) updates.first_name = first_name;
        if (last_name !== undefined) updates.last_name = last_name;
        if (phone !== undefined) updates.phone = phone;

        if (password) {
            updates.password_hash = await bcrypt.hash(password, 12);
        }

        const [user] = await db('users')
            .where({ id: userId })
            .update(updates)
            .returning(['id', 'email', 'role', 'first_name', 'last_name', 'phone']);

        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

        res.json({ success: true, data: user, message: 'Profile updated successfully.' });
    } catch (err) { next(err); }
}

async function createUser(req, res, next) {
    try {
        const { email, password, role, first_name, last_name, phone } = req.body;

        if (!email || !password || !role || !first_name || !last_name) {
            return res.status(400).json({ success: false, error: 'Missing required fields.' });
        }

        const existing = await db('users').where({ email }).first();
        if (existing) {
            return res.status(409).json({ success: false, error: 'Email already registered.' });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const [user] = await db('users')
            .insert({
                email,
                password_hash,
                role,
                first_name,
                last_name,
                phone,
                is_active: true
            })
            .returning(['id', 'email', 'role', 'first_name', 'last_name', 'is_active', 'created_at']);

        res.status(201).json({ success: true, data: user, message: 'User created successfully.' });
    } catch (err) { next(err); }
}

module.exports = { listUsers, getUser, updateUser, deactivateUser, updateProfile, createUser };
