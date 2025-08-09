
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import process from 'process';
import { db, dbConfig } from './database.js';
import apiRouter from './api/index.js';

const app: express.Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for photo uploads

// API Routes
app.use('/api', [apiRouter]);

const startServer = async () => {
    try {
        // Run migrations to ensure the database schema is up to date
        console.log('Running database migrations...');
        await db.migrate.latest(dbConfig.migrations);
        console.log('Migrations are up to date.');

        // Start server
        app.listen(PORT, async () => {
            console.log(`Server is running on http://localhost:${PORT}`);
            
            // Check if the database is empty and seed if necessary
            try {
                const customers = await db('customers').select('id').limit(1);
                // Only seed if the DB is empty and a seed config exists (i.e., in development)
                if (customers.length === 0 && 'seeds' in dbConfig && dbConfig.seeds) {
                    console.log('Database appears to be empty. Running seed...');
                    await db.seed.run(dbConfig.seeds);
                    console.log('Database seeded successfully.');
                } else if (customers.length > 0) {
                    console.log('Database already contains data.');
                }
            } catch (error) {
                console.error('Error during initial database check/seed:', error);
            }
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();