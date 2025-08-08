
import { Router } from 'express';
import { db } from '../database.js';
import { CommunicationLog } from '../types.js';

const router = Router();

const parseLog = (row: any) => row ? { ...row, customerIds: JSON.parse(row.customerIds || '[]') } : null;

// GET all logs
router.get('/', async (req, res) => {
    const logs = await db('communicationLogs').select('*').then(rows => rows.map(parseLog));
    res.json(logs);
});

// POST to create a log
router.post('/', async (req, res) => {
    const { customerIds, subject, message } = req.body;
    const newLog: CommunicationLog = {
        id: `LOG-${Date.now()}`,
        customerIds,
        subject,
        message,
        date: new Date().toISOString()
    };
    await db('communicationLogs').insert({ ...newLog, customerIds: JSON.stringify(customerIds) });
    res.status(201).json(newLog);
});

export default router;
