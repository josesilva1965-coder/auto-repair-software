import { Router } from 'express';
import { db } from '../index.js';
import { Appointment, Quote } from '../types.js';

const router = Router();

// GET all appointments
router.get('/', async (req, res) => {
    const appointments = await db('appointments').select('*');
    res.json(appointments);
});

// POST to create a new appointment
router.post('/', async (req, res) => {
    const { quoteId, dateTime } = req.body;
    const quote = await db('quotes').where({ id: quoteId }).first() as Quote;
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const newAppointment: Appointment = {
        id: `APP-${Date.now()}`,
        quoteId,
        customerId: quote.customerId,
        vehicleId: quote.vehicleId,
        dateTime,
    };
    await db('appointments').insert(newAppointment);

    quote.appointmentId = newAppointment.id;
    await db('quotes').where({ id: quoteId }).update({ appointmentId: newAppointment.id });
    
    res.status(201).json({ appointment: newAppointment, quote });
});

// PUT to update an appointment's date
router.put('/:id/date', async (req, res) => {
    const { newDateISO } = req.body;
    const appointment = await db('appointments').where({ id: req.params.id }).first() as Appointment;
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Preserve time, change date
    const oldDateTime = new Date(appointment.dateTime);
    const newDate = new Date(newDateISO);
    const updatedDateTime = new Date(
        newDate.getFullYear(), newDate.getMonth(), newDate.getDate(),
        oldDateTime.getHours(), oldDateTime.getMinutes()
    ).toISOString();

    await db('appointments').where({ id: req.params.id }).update({ dateTime: updatedDateTime });
    res.json({ ...appointment, dateTime: updatedDateTime });
});

export default router;
