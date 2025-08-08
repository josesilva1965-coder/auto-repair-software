
import { Router } from 'express';
import { db } from '../database.js';
import { Vehicle, Photo } from '../types.js';

const router = Router();

// Helper
const parseVehicle = (row: any) => row ? { ...row, photos: JSON.parse(row.photos || '[]') } : null;

// GET all vehicles
router.get('/', async (req, res) => {
    const vehicles = await db('vehicles').select('*').then(rows => rows.map(parseVehicle));
    res.json(vehicles);
});

// GET a single vehicle
router.get('/:id', async (req, res) => {
    const vehicle = await db('vehicles').where({ id: req.params.id }).first().then(parseVehicle);
    if (vehicle) {
        res.json(vehicle);
    } else {
        res.status(404).json({ message: 'Vehicle not found' });
    }
});

// POST to create or update a vehicle for a customer
router.post('/customers/:customerId/vehicles', async (req, res) => {
    const vehicleData: Omit<Vehicle, 'id' | 'customerId'> | Vehicle = req.body;
    const { customerId } = req.params;

    try {
        if ('id' in vehicleData && vehicleData.id) {
            // Update
            await db('vehicles').where({ id: vehicleData.id }).update({ ...vehicleData, photos: JSON.stringify(vehicleData.photos || []) });
            const updatedVehicle = await db('vehicles').where({ id: vehicleData.id }).first().then(parseVehicle);
            res.json(updatedVehicle);
        } else {
            // Create
            const newVehicle: Vehicle = {
                ...(vehicleData as Omit<Vehicle, 'id' | 'customerId'>),
                id: `VEH-${Date.now()}`,
                customerId: customerId,
                photos: [],
            };
            await db('vehicles').insert({ ...newVehicle, photos: JSON.stringify(newVehicle.photos) });
            res.status(201).json(newVehicle);
        }
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving vehicle' });
    }
});

// POST to add photos to a vehicle
router.post('/:vehicleId/photos', async (req, res) => {
    const { vehicleId } = req.params;
    const { photos } = req.body as { photos: Photo[] };
    
    const vehicle = await db('vehicles').where({ id: vehicleId }).first().then(parseVehicle) as Vehicle;
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    vehicle.photos = [...(vehicle.photos || []), ...photos];
    await db('vehicles').where({ id: vehicleId }).update({ photos: JSON.stringify(vehicle.photos) });
    res.json(vehicle);
});

// DELETE a photo from a vehicle
router.delete('/:vehicleId/photos/:photoId', async (req, res) => {
    const { vehicleId, photoId } = req.params;

    const vehicle = await db('vehicles').where({ id: vehicleId }).first().then(parseVehicle) as Vehicle;
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    vehicle.photos = (vehicle.photos || []).filter(p => p.id !== photoId);
    await db('vehicles').where({ id: vehicleId }).update({ photos: JSON.stringify(vehicle.photos) });
    res.json(vehicle);
});


export default router;
