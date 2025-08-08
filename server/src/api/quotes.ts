import { Router } from 'express';
import { db } from '../index.js';
import { generateQuote } from '../services/geminiService.js';
import { Quote, DraftQuote, Customer, Vehicle, ShopSettings } from '../types.js';

const router = Router();

// Helper to parse JSON fields from DB
const parseQuote = (row: any) => {
    if (!row) return null;
    return {
        ...row,
        services: JSON.parse(row.services || '[]'),
        payments: JSON.parse(row.payments || '[]'),
    };
};

// GET all quotes
router.get('/', async (req, res) => {
    const quotes = await db('quotes').select('*').then(rows => rows.map(parseQuote));
    res.json(quotes);
});

// GET a single quote
router.get('/:id', async (req, res) => {
    const quote = await db('quotes').where({ id: req.params.id }).first().then(parseQuote);
    if (quote) {
        res.json(quote);
    } else {
        res.status(404).json({ message: 'Quote not found' });
    }
});

// POST to generate a new quote (AI call)
router.post('/generate', async (req, res) => {
    const { customerId, vehicleId, serviceRequest } = req.body;
    try {
        const customer = await db('customers').where({ id: customerId }).first() as Customer;
        const vehicle = await db('vehicles').where({ id: vehicleId }).first() as Vehicle;
        const settingsRow = await db('shopSettings').where({ id: 'default' }).first();
        if (!settingsRow) {
             return res.status(404).json({ message: "Shop settings not configured" });
        }
        const settings = { ...settingsRow, daysOpen: JSON.parse(settingsRow.daysOpen), operatingHours: JSON.parse(settingsRow.operatingHours) } as ShopSettings;

        if (!customer || !vehicle) {
            return res.status(404).json({ message: "Customer or vehicle not found" });
        }
        
        const vehicleInfo = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        const draftQuote = await generateQuote(vehicleInfo, serviceRequest, customer.name, 'en-GB', settings);
        res.json(draftQuote);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// POST to create a new quote from a draft
router.post('/', async (req, res) => {
    const draftQuote: DraftQuote = req.body;
    const newQuote: Quote = {
        ...draftQuote,
        id: `QT-${Date.now()}`,
        status: 'Saved',
        payments: [],
        services: draftQuote.services || [],
        notes: draftQuote.notes || '',
    };
    await db('quotes').insert({ ...newQuote, services: JSON.stringify(newQuote.services), payments: JSON.stringify(newQuote.payments) });
    res.status(201).json(newQuote);
});


// PUT to update a quote
router.put('/:id', async (req, res) => {
    const updatedQuote: Quote = req.body;
    await db('quotes').where({ id: req.params.id }).update({ ...updatedQuote, services: JSON.stringify(updatedQuote.services), payments: JSON.stringify(updatedQuote.payments || []) });
    res.json(updatedQuote);
});

// PUT to update quote status
router.put('/:id/status', async (req, res) => {
    const { status, mileage } = req.body;
    const quote = await db('quotes').where({ id: req.params.id }).first().then(parseQuote) as Quote;
    
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    quote.status = status;
    if (status === 'Completed') {
        quote.completionDate = new Date().toISOString();
        if (mileage) quote.mileageAtCompletion = mileage;
    }

    // Stock deduction logic
    if (status === 'Approved') {
        for (const service of quote.services) {
            for (const part of service.parts) {
                if (part.inventoryPartId) {
                    await db('inventoryParts').where({ id: part.inventoryPartId }).decrement('stock', part.quantity);
                }
            }
        }
    }

    await db('quotes').where({ id: req.params.id }).update({ ...quote, services: JSON.stringify(quote.services), payments: JSON.stringify(quote.payments) });
    res.json(quote);
});

// PUT to update notes
router.put('/:id/notes', async (req, res) => {
    const { notes } = req.body;
    await db('quotes').where({ id: req.params.id }).update({ notes });
    const updatedQuote = await db('quotes').where({ id: req.params.id }).first().then(parseQuote);
    res.json(updatedQuote);
});

// POST to add a payment
router.post('/:id/payments', async (req, res) => {
    const paymentData = req.body;
    const quote = await db('quotes').where({ id: req.params.id }).first().then(parseQuote) as Quote;

    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const newPayment = { ...paymentData, id: `PAY-${Date.now()}` };
    quote.payments = [...(quote.payments || []), newPayment];
    
    const totalPaid = quote.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCost = quote.totalCost - (quote.discountAmount || 0);

    if (totalPaid >= totalCost) {
        quote.status = 'Paid';
    }

    await db('quotes').where({ id: req.params.id }).update({ ...quote, services: JSON.stringify(quote.services), payments: JSON.stringify(quote.payments) });
    res.json(quote);
});


// PUT to assign a technician
router.put('/:id/assign', async (req, res) => {
    const { technicianId } = req.body;
    const techIdToSet = technicianId === 'unassigned' ? null : technicianId;
    await db('quotes').where({ id: req.params.id }).update({ technicianId: techIdToSet });
    const updatedQuote = await db('quotes').where({ id: req.params.id }).first().then(parseQuote);
    res.json(updatedQuote);
});

// DELETE a quote
router.delete('/:id', async (req, res) => {
    await db('quotes').where({ id: req.params.id }).del();
    await db('appointments').where({ quoteId: req.params.id }).del();
    res.json({ success: true });
});

export default router;