const config = require('./src/config');

module.exports = {
    development: {
        client: 'pg',
        connection: {
            host: config.db.host,
            port: config.db.port,
            database: config.db.name,
            user: config.db.user,
            password: config.db.password,
        },
        migrations: {
            directory: './src/db/migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
        pool: {
            min: 2,
            max: 10,
        },
    },

    production: {
        client: 'pg',
        connection: {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
        },
        migrations: {
            directory: './src/db/migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
        pool: {
            min: 2,
            max: 20,
        },
    },

    test: {
        client: 'pg',
        connection: {
            host: config.db.host,
            port: config.db.port,
            database: config.db.name + '_test',
            user: config.db.user,
            password: config.db.password,
        },
        migrations: {
            directory: './src/db/migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
    },
};
