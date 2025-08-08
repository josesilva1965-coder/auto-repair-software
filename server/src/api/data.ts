import { Router } from 'express';
import { db } from '../index.js';
import { seed } from '../../database/seeds/initial_data.js';

const router = Router();

const ALL_STORES = ['customers', 'vehicles', 'quotes', 'appointments', 'inventoryParts', 'technicians', 'shopSettings', 'communicationLogs', 'maintenanceSchedules', 'vehicleMaintenance'];

// Helper to parse all JSON fields from DB rows
const parseRow = (row: any, tableName: string) => {
    if (!row) return null;
    const parsed = { ...row };
    const jsonFields: Record<string, string[]> = {
        'customers': ['tags'],
        'vehicles': ['photos'],
        'quotes': ['services', 'payments'],
        'technicians': ['availability'],
        'inventoryParts': ['compatibleBrands'],
        'shopSettings': ['operatingHours', 'daysOpen'],
        'communicationLogs': ['customerIds']
    };
    if (jsonFields[tableName]) {
        for (const field of jsonFields[tableName]) {
            if (parsed[field] && typeof parsed[field] === 'string') {
                parsed[field] = JSON.parse(parsed[field]);
            }
        }
    }
    return parsed;
}

// GET to export all data
router.get('/export', async (req, res) => {
    const allData: Record<string, any[]> = {};
    for (const tableName of ALL_STORES) {
        allData[tableName] = await db(tableName).select('*').then(rows => rows.map(r => parseRow(r, tableName)));
    }
    res.json(allData);
});

// POST to import data
router.post('/import', async (req, res) => {
    const data: Record<string, any[]> = req.body;
    try {
        await db.transaction(async trx => {
            // Delete in reverse order of creation
            for (let i = ALL_STORES.length - 1; i >= 0; i--) {
                const tableName = ALL_STORES[i];
                if (tableName === 'shopSettings') continue; // Don't delete settings
                await trx(tableName).del();
            }

            // Insert in order of creation
            for (const tableName of ALL_STORES) {
                if (data[tableName] && data[tableName].length > 0) {
                     await trx(tableName).insert(data[tableName].map(r => parseRow(r, tableName)));
                }
            }
        });
        res.status(200).json({ message: 'Data imported successfully' });
    } catch (error) {
        console.error('Import failed:', error);
        res.status(500).json({ message: 'Data import failed' });
    }
});


export default router;
