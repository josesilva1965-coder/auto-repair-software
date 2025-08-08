
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { db, dbConfig } from './database.js';
import apiRouter from './api/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({}));
app.use(express.json({ limit: '10mb' })); // Increase limit for photo uploads

// API Routes
app.use('/api', apiRouter);

// Start server
app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    
    // Check if the database is empty and seed if necessary
    try {
        const customers = await db('customers').select('id').limit(1);
        // Only seed if the DB is empty and a seed config exists (i.e., in development)
        if (customers.length === 0 && dbConfig.seeds) {
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