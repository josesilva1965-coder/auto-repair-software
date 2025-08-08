import { Router } from 'express';
import quotesRouter from './quotes.js';
import customersRouter from './customers.js';
import vehiclesRouter from './vehicles.js';
import inventoryRouter from './inventory.js';
import techniciansRouter from './technicians.js';
import appointmentsRouter from './appointments.js';
import settingsRouter from './settings.js';
import dataRouter from './data.js';
import logsRouter from './logs.js';
import maintenanceRouter from './maintenance.js';
import vehicleMaintRouter from './vehicleMaint.js';

const router = Router();

router.use('/quotes', quotesRouter);
router.use('/customers', customersRouter);
router.use('/vehicles', vehiclesRouter);
router.use('/inventory', inventoryRouter);
router.use('/technicians', techniciansRouter);
router.use('/appointments', appointmentsRouter);
router.use('/settings', settingsRouter);
router.use('/data', dataRouter);
router.use('/logs', logsRouter);
router.use('/maintenance-schedules', maintenanceRouter);
router.use('/vehicle-maintenance', vehicleMaintRouter);

export default router;
