import { Router } from 'express';
import { db } from '../index.js';
import { Technician } from '../types.js';

const router = Router();

const parseTechnician = (row: any) => row ? { ...row, availability: JSON.parse(row.availability) } : null;

// GET all technicians
router.get('/', async (req, res) => {
    const technicians = await db('technicians').select('*').then(rows => rows.map(parseTechnician));
    res.json(technicians);
});

// POST to create a technician
router.post('/', async (req, res) => {
    const techData: Omit<Technician, 'id' | 'availability'> = req.body;
    const newTech: Technician = {
        ...techData,
        id: `TECH-${Date.now()}`,
        availability: { 'Monday': true, 'Tuesday': true, 'Wednesday': true, 'Thursday': true, 'Friday': true, 'Saturday': false, 'Sunday': false }
    };
    await db('technicians').insert({ ...newTech, availability: JSON.stringify(newTech.availability) });
    res.status(201).json(newTech);
});

// PUT for batch updating technicians (for timetable)
router.put('/batch', async (req, res) => {
    const { technicians } = req.body as { technicians: Technician[] };
    try {
        await db.transaction(async trx => {
            for (const tech of technicians) {
                await trx('technicians').where({ id: tech.id }).update({ availability: JSON.stringify(tech.availability) });
            }
        });
        res.json(technicians);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update technicians' });
    }
});

export default router;