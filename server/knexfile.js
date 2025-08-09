// This file needs to be in JS format for the knex CLI to work correctly.
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Render, the persistent disk is mounted at /data. Use this for production.
const prodDbPath = process.env.RENDER_DISK_PATH || path.resolve(__dirname, 'database');


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
      directory: path.resolve(__dirname, 'database', 'migrations')
    }
  }
};