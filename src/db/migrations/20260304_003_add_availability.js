/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('therapist_availability', table => {
            table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
            table.uuid('therapist_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
            table.integer('day_of_week').notNullable(); // 0 (Sun) to 6 (Sat)
            table.time('start_time').notNullable();
            table.time('end_time').notNullable();
            table.integer('session_duration').defaultTo(45); // minutes
            table.integer('buffer_duration').defaultTo(15); // minutes
            table.integer('min_advance_hours').defaultTo(4);
            table.integer('max_sessions_per_day').nullable();
            table.unique(['therapist_id', 'day_of_week']);
            table.timestamps(true, true);
        })
        .createTable('therapist_breaks', table => {
            table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
            table.uuid('therapist_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
            table.string('break_type').notNullable(); // 'lunch', 'admin', 'other'
            table.time('start_time').notNullable();
            table.time('end_time').notNullable();
            table.string('days_of_week').nullable(); // comma separated numbers '1,2,3,4,5'
            table.timestamps(true, true);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('therapist_breaks')
        .dropTableIfExists('therapist_availability');
};
