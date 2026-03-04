const knex = require('knex');
const knexConfig = require('../../knexfile');
const config = require('../config');

const environment = config.nodeEnv || 'development';
const db = knex(knexConfig[environment]);

module.exports = db;
