// This file needs to be in JS format for the knex CLI to work correctly.
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust base directory for production environment (when running from 'dist' folder)
const isProduction = process.env.NODE_ENV === 'production';
// In production, the compiled knexfile is in `dist`, so we need to go up one level to the server root.
const baseDir = isProduction ? path.join(__dirname, '..') : __dirname;

// On Render, the persistent disk is mounted at /data. Use this for production database storage.
// Fallback to a 'database' directory in the project root for other environments.
const prodDbPath = process.env.RENDER_DISK_PATH || path.resolve(baseDir, 'database');


export default {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'database', 'dev.sqlite3')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'database', 'migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'database', 'seeds')
    }
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(prodDbPath, 'prod.sqlite3')
    },
    useNullAsDefault: true,
    migrations: {
      // Point to the source migrations directory, not the compiled output directory
      directory: path.resolve(baseDir, 'database', 'migrations')
    }
  }
};
