
import { Router } from 'express';
import { db } from '../database.js';

const router = Router();

// GET all vehicle maintenance records
router.get('/', async (req, res) => {
    const records = await db('vehicleMaintenance').select('*');
    res.json(records);
});

export default router;
