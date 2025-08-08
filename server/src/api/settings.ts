
import { Router } from 'express';
import { db } from '../database.js';
import { ShopSettings } from '../types.js';

const router = Router();

const parseSettings = (row: any) => row ? {
    ...row,
    operatingHours: JSON.parse(row.operatingHours || '{}'),
    daysOpen: JSON.parse(row.daysOpen || '[]'),
} : null;

// GET shop settings
router.get('/', async (req, res) => {
    const settings = await db('shopSettings').where({ id: 'default' }).first().then(parseSettings);
    if (settings) {
        res.json(settings);
    } else {
        res.status(404).json({ message: 'Settings not found' });
    }
});

// PUT to update shop settings
router.put('/', async (req, res) => {
    const settings: ShopSettings = req.body;
    await db('shopSettings').where({ id: 'default' }).update({
        ...settings,
        operatingHours: JSON.stringify(settings.operatingHours),
        daysOpen: JSON.stringify(settings.daysOpen),
    });
    res.json(settings);
});

export default router;
