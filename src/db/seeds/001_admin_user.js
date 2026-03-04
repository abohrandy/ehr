const bcrypt = require('bcryptjs');
const config = require('../../config');

exports.seed = async function (knex) {
    // Check if admin already exists
    const existing = await knex('users').where({ email: config.admin.email }).first();
    if (existing) {
        console.log('Admin user already exists, skipping seed.');
        return;
    }

    const passwordHash = await bcrypt.hash(config.admin.password, 12);

    await knex('users').insert({
        email: config.admin.email,
        password_hash: passwordHash,
        role: 'admin',
        first_name: config.admin.firstName,
        last_name: config.admin.lastName,
        is_active: true,
    });

    console.log(`Admin user created: ${config.admin.email}`);
};
