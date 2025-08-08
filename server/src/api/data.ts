
import { Router } from 'express';
import { db } from '../database.js';

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
                try {
                   parsed[field] = JSON.parse(parsed[field]);
                } catch(e) {
                    console.error(`Failed to parse JSON for field ${field} in table ${tableName}`, parsed[field]);
                }
            }
        }
    }
    return parsed;
}

// Helper to stringify all JSON fields for DB insertion
const stringifyRow = (row: any, tableName: string) => {
    if (!row) return null;
    const stringified = { ...row };
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
            if (stringified[field] && typeof stringified[field] !== 'string') {
                stringified[field] = JSON.stringify(stringified[field]);
            }
        }
    }
    return stringified;
}

// GET to export all data
router.get('/export', async (req, res) => {
    try {
        const allData: Record<string, any[]> = {};
        for (const tableName of ALL_STORES) {
            allData[tableName] = await db(tableName).select('*').then(rows => rows.map(r => parseRow(r, tableName)));
        }
        res.json(allData);
    } catch (error) {
        console.error('Export failed:', error);
        res.status(500).json({ message: 'Data export failed' });
    }
});

// POST to import data
router.post('/import', async (req, res) => {
    const data: Record<string, any[]> = req.body;
    try {
        await db.transaction(async trx => {
            // Delete in reverse order of creation
            const reversedStores = [...ALL_STORES].reverse();
            for (const tableName of reversedStores) {
                await trx(tableName).del();
            }

            // Insert in order of creation
            for (const tableName of ALL_STORES) {
                const tableData = data[tableName];
                if (tableData && Array.isArray(tableData) && tableData.length > 0) {
                     const stringifiedData = tableData.map(row => stringifyRow(row, tableName));
                     await trx(tableName).insert(stringifiedData);
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
