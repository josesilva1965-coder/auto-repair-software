
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import knex from 'knex';

import knexConfig from '../knexfile.js';
import apiRouter from './api/index.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Database
const dbConfig = isProduction ? knexConfig.production : knexConfig.development;
export const db = knex(dbConfig);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for photo uploads

// API Routes
app.use('/api', apiRouter);

// Start server
app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    
    // Check if the database is empty and seed if necessary
    try {
        const customers = await db('customers').select('id').limit(1);
        if (customers.length === 0) {
            console.log('Database appears to be empty. Running seed...');
            await db.seed.run(dbConfig.seeds);
            console.log('Database seeded successfully.');
        } else {
            console.log('Database already contains data.');
        }
    } catch (error) {
        console.error('Error during initial database check/seed:', error);
    }
});
