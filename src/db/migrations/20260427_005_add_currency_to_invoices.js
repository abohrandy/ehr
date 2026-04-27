exports.up = async function (knex) {
    await knex.schema.alterTable('invoices', (table) => {
        table.string('currency', 3).defaultTo('NGN').notNullable();
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable('invoices', (table) => {
        table.dropColumn('currency');
    });
};
