const bcrypt = require('bcryptjs');

/**
 * Migration to ensure abohrandy@gmail.com has admin access.
 */
exports.up = async function (knex) {
    const email = 'abohrandy@gmail.com';
    const existing = await knex('users').where({ email }).first();

    if (existing) {
        // Ensure they have admin role if they already exist
        await knex('users')
            .where({ email })
            .update({
                role: 'admin',
                is_active: true,
                updated_at: knex.fn.now()
            });
        console.log(`Updated existing user to admin: ${email}`);
    } else {
        // Create new admin user if they don't exist
        // Temporary password, should be changed immediately
        const passwordHash = await bcrypt.hash('Abohrandy2026!', 12);
        await knex('users').insert({
            email,
            password_hash: passwordHash,
            role: 'admin',
            first_name: 'Abohrandy',
            last_name: 'Admin',
            is_active: true
        });
        console.log(`Created new admin user: ${email}`);
    }
};

exports.down = async function (knex) {
    // We don't necessarily want to delete the user on rollback if they were important,
    // but for completeness of the migration pattern:
    // await knex('users').where({ email: 'abohrandy@gmail.com' }).delete();
};
