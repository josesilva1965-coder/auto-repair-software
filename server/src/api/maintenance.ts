import { Router } from 'express';
import { db } from '../index.js';
import { MaintenanceSchedule } from '../types.js';

const router = Router();

// GET all maintenance schedules
router.get('/', async (req, res) => {
    const schedules = await db('maintenanceSchedules').select('*');
    res.json(schedules);
});

// POST to create a maintenance schedule
router.post('/', async (req, res) => {
    const scheduleData: Omit<MaintenanceSchedule, 'id'> = req.body;
    const newSchedule: MaintenanceSchedule = {
        ...scheduleData,
        id: `MS-${Date.now()}`,
    };
    await db('maintenanceSchedules').insert(newSchedule);
    res.status(201).json(newSchedule);
});

export default router;
