import { Router } from 'express';
import { db } from '../index.js';
import { InventoryPart } from '../types.js';

const router = Router();

const parsePart = (row: any) => row ? { ...row, compatibleBrands: JSON.parse(row.compatibleBrands || '[]') } : null;

// GET all inventory parts
router.get('/', async (req, res) => {
    const parts = await db('inventoryParts').select('*').then(rows => rows.map(parsePart));
    res.json(parts);
});

// POST to create or update an inventory part
router.post('/', async (req, res) => {
    const partData: Omit<InventoryPart, 'id'> | InventoryPart = req.body;

    if ('id' in partData) {
        // Update
        await db('inventoryParts').where({ id: partData.id }).update({ ...partData, compatibleBrands: JSON.stringify(partData.compatibleBrands || []) });
        res.json(partData);
    } else {
        // Create
        const newPart: InventoryPart = {
            ...partData,
            id: `PART-${Date.now()}`,
        };
        await db('inventoryParts').insert({ ...newPart, compatibleBrands: JSON.stringify(newPart.compatibleBrands || []) });
        res.status(201).json(newPart);
    }
});

export default router;
