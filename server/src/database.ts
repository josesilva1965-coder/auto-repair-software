import knex from 'knex';
import knexConfig from '../knexfile.js';
import fs from 'fs';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
export const dbConfig = isProduction ? knexConfig.production : knexConfig.development;

// Ensure the directory for the SQLite database exists before initializing Knex.
// This is crucial for environments like Render where the persistent disk might be empty.
const connection = dbConfig.connection;
if (typeof connection === 'object' && connection !== null && 'filename' in connection) {
    const dbFilePath = connection.filename as string;
    const dbDir = path.dirname(dbFilePath);
    if (!fs.existsSync(dbDir)) {
        console.log(`Database directory not found. Creating: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true });
    }
}

export const db = knex(dbConfig);