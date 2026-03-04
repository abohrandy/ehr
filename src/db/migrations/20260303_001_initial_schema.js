/**
 * Full database schema migration for Futurology EHR.
 * Creates all tables in a single migration for initial setup.
 */
exports.up = async function (knex) {
    // Enable uuid-ossp extension
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // 1. Users table
    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('email', 255).unique().notNullable();
        table.string('password_hash', 255).notNullable();
        table.enu('role', ['admin', 'therapist', 'client']).notNullable().defaultTo('client');
        table.string('first_name', 100).notNullable();
        table.string('last_name', 100).notNullable();
        table.string('phone', 20);
        table.boolean('is_active').defaultTo(true);
        table.text('refresh_token');
        table.timestamp('last_login_at');
        table.timestamps(true, true);
    });

    // 2. Clients table
    await knex.schema.createTable('clients', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.uuid('assigned_therapist_id').references('id').inTable('users').onDelete('SET NULL');
        table.date('date_of_birth');
        table.string('gender', 20);
        table.text('address');
        table.string('emergency_contact_name', 100);
        table.string('emergency_contact_phone', 20);
        table.enu('case_type', ['individual', 'couple', 'family', 'child']).defaultTo('individual');
        table.date('intake_date');
        table.enu('status', ['active', 'inactive', 'discharged']).defaultTo('active');
        table.text('notes'); // encrypted at application level
        table.timestamps(true, true);
    });

    // 3. Family relationship links
    await knex.schema.createTable('family_relationship_links', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('client_id_1').references('id').inTable('clients').onDelete('CASCADE').notNullable();
        table.uuid('client_id_2').references('id').inTable('clients').onDelete('CASCADE').notNullable();
        table.enu('relationship_type', ['spouse', 'partner', 'parent', 'child', 'sibling', 'guardian', 'other']).notNullable();
        table.uuid('case_group_id');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // 4. Appointments
    await knex.schema.createTable('appointments', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('therapist_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE').notNullable();
        table.timestamp('start_time').notNullable();
        table.timestamp('end_time').notNullable();
        table.timestamp('buffer_end_time').notNullable();
        table.enu('status', ['scheduled', 'completed', 'cancelled', 'no_show']).defaultTo('scheduled');
        table.enu('session_type', ['individual', 'couple', 'family', 'child']).defaultTo('individual');
        table.string('location', 100).defaultTo('in-person');
        table.text('notes');
        table.text('cancelled_reason');
        table.timestamps(true, true);
        // Index for overlap checking
        table.index(['therapist_id', 'start_time', 'buffer_end_time']);
    });

    // 5. Session notes
    await knex.schema.createTable('session_notes', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('appointment_id').references('id').inTable('appointments').onDelete('SET NULL');
        table.uuid('therapist_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE').notNullable();
        table.enu('note_type', ['soap', 'dap', 'progress']).notNullable();
        // SOAP fields
        table.text('subjective');
        table.text('objective');
        table.text('assessment_section');
        table.text('plan_section');
        // DAP fields (reuses assessment_section and plan_section)
        table.text('data_section');
        // Progress fields (reuses plan_section as intervention)
        table.text('intervention');
        // Lock
        table.boolean('is_locked').defaultTo(false);
        table.timestamp('locked_at');
        table.uuid('locked_by').references('id').inTable('users').onDelete('SET NULL');
        // Edit history
        table.jsonb('edit_history').defaultTo('[]');
        table.timestamps(true, true);
        // Index for search
        table.index(['client_id', 'therapist_id']);
        table.index(['note_type']);
    });

    // 6. Treatment plans
    await knex.schema.createTable('treatment_plans', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE').notNullable();
        table.uuid('therapist_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.text('diagnosis');
        table.jsonb('goals').defaultTo('[]');
        table.date('start_date');
        table.date('target_end_date');
        table.enu('status', ['active', 'completed', 'closed']).defaultTo('active');
        table.enu('case_type', ['individual', 'couple', 'family', 'divorce', 'child']).defaultTo('individual');
        table.uuid('case_group_id');
        table.jsonb('progress_notes').defaultTo('[]');
        table.timestamps(true, true);
    });

    // 7. Invoices
    await knex.schema.createTable('invoices', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE').notNullable();
        table.uuid('appointment_id').references('id').inTable('appointments').onDelete('SET NULL');
        table.decimal('amount', 10, 2).notNullable();
        table.enu('status', ['pending', 'paid', 'overdue', 'cancelled']).defaultTo('pending');
        table.date('due_date');
        table.timestamp('paid_at');
        table.text('description');
        table.timestamps(true, true);
    });

    // 8. Messages
    await knex.schema.createTable('messages', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('conversation_id').notNullable();
        table.uuid('sender_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.uuid('recipient_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.text('content').notNullable(); // AES-256-GCM encrypted
        table.string('content_iv', 64);
        table.string('content_tag', 64);
        table.boolean('has_attachment').defaultTo(false);
        table.string('attachment_path', 500);
        table.string('attachment_name', 255);
        table.boolean('is_read').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index(['conversation_id', 'created_at']);
        table.index(['sender_id', 'recipient_id']);
    });

    // 9. Audit logs
    await knex.schema.createTable('audit_logs', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
        table.string('action', 100).notNullable();
        table.string('resource_type', 50);
        table.uuid('resource_id');
        table.jsonb('details');
        table.string('ip_address', 45);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index(['user_id', 'created_at']);
        table.index(['resource_type', 'resource_id']);
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('audit_logs');
    await knex.schema.dropTableIfExists('messages');
    await knex.schema.dropTableIfExists('invoices');
    await knex.schema.dropTableIfExists('treatment_plans');
    await knex.schema.dropTableIfExists('session_notes');
    await knex.schema.dropTableIfExists('appointments');
    await knex.schema.dropTableIfExists('family_relationship_links');
    await knex.schema.dropTableIfExists('clients');
    await knex.schema.dropTableIfExists('users');
};
