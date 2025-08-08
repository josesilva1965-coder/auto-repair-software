
import { Router } from 'express';
import { db } from '../database.js';
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

    try {
        if ('id' in partData && partData.id) {
            // Update
            await db('inventoryParts').where({ id: partData.id }).update({ ...partData, compatibleBrands: JSON.stringify(partData.compatibleBrands || []) });
            const updatedPart = await db('inventoryParts').where({ id: partData.id }).first().then(parsePart);
            res.json(updatedPart);
        } else {
            // Create
            const newPart: InventoryPart = {
                ...(partData as Omit<InventoryPart, 'id'>),
                id: `PART-${Date.now()}`,
            };
            await db('inventoryParts').insert({ ...newPart, compatibleBrands: JSON.stringify(newPart.compatibleBrands || []) });
            res.status(201).json(newPart);
        }
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving inventory part' });
    }
});

export default router;
