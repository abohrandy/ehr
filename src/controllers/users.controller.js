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

module.exports = { listUsers, getUser, updateUser, deactivateUser };
