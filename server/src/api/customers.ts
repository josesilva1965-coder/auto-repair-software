import { Router } from 'express';
import { db } from '../index.js';
import { Customer } from '../types.js';

const router = Router();

// Helper to parse JSON fields
const parseCustomer = (row: any) => row ? { ...row, tags: JSON.parse(row.tags || '[]') } : null;

// GET all customers
router.get('/', async (req, res) => {
    const customers = await db('customers').select('*').then(rows => rows.map(parseCustomer));
    res.json(customers);
});

// GET a single customer
router.get('/:id', async (req, res) => {
    const customer = await db('customers').where({ id: req.params.id }).first().then(parseCustomer);
    if (customer) {
        res.json(customer);
    } else {
        res.status(404).json({ message: 'Customer not found' });
    }
});

// POST to create or update a customer
router.post('/', async (req, res) => {
    const customerData: Omit<Customer, 'id'> | Customer = req.body;
    
    if ('id' in customerData) {
        // Update existing customer
        await db('customers').where({ id: customerData.id }).update({ ...customerData, tags: JSON.stringify(customerData.tags || []) });
        res.json(customerData);
    } else {
        // Create new customer
        const newCustomer: Customer = {
            ...customerData,
            id: `CUST-${Date.now()}`,
            loyaltyPoints: 0,
        };
        await db('customers').insert({ ...newCustomer, tags: JSON.stringify(newCustomer.tags || []) });
        res.status(201).json(newCustomer);
    }
});

export default router;
