import { Router } from 'express';
// Import all your resource routers here
import quotesRouter from './quotes.js';
import customersRouter from './customers.js';
import vehiclesRouter from './vehicles.js';
import inventoryRouter from './inventory.js';
import techniciansRouter from './technicians.js';
import appointmentsRouter from './appointments.js';
import settingsRouter from './settings.js';
import dataRouter from './data.js';
// ... and so on for other resources

const router = Router();

// Use the resource routers
router.use('/quotes', quotesRouter);
router.use('/customers', customersRouter);
router.use('/vehicles', vehiclesRouter);
router.use('/inventory', inventoryRouter);
router.use('/technicians', techniciansRouter);
router.use('/appointments', appointmentsRouter);
router.use('/settings', settingsRouter);
router.use('/data', dataRouter);
// ... and so on

export default router;
