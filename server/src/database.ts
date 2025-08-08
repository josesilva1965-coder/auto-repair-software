
import knex from 'knex';
import knexConfig from '../../knexfile.js';

const isProduction = process.env.NODE_ENV === 'production';
export const dbConfig = isProduction ? knexConfig.production : knexConfig.development;
export const db = knex(dbConfig);
