/**
 * Migration to add app_settings table for global configurations.
 */
exports.up = async function (knex) {
    await knex.schema.createTable('app_settings', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('key', 100).unique().notNullable();
        table.text('value').notNullable();
        table.string('group', 50).defaultTo('general');
        table.string('description', 255);
        table.timestamps(true, true);
    });

    // Seed default settings
    const defaults = [
        { key: 'practice_name', value: 'Futurology Global Therapists', group: 'general', description: 'The name of your practice displayed in the app.' },
        { key: 'practice_email', value: 'contact@futurologyglobal.com', group: 'general', description: 'Contact email for system notifications.' },
        { key: 'practice_phone', value: '+1 (555) 000-0000', group: 'general', description: 'Main contact phone number.' },
        { key: 'session_buffer_minutes', value: '15', group: 'clinical', description: 'Default buffer time between appointments.' },
        { key: 'portal_enabled', value: 'true', group: 'portal', description: 'Whether the client portal is active.' },
        { key: 'allow_client_booking', value: 'false', group: 'portal', description: 'Whether clients can book their own appointments.' }
    ];

    await knex('app_settings').insert(defaults);
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('app_settings');
};
