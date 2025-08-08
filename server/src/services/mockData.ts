import type { Customer, Vehicle, Quote, Appointment, InventoryPart, Technician, ShopSettings, CommunicationLog, MaintenanceSchedule, VehicleMaintenance } from '../types.js';

// Dates will be set relative to the current date for a better demo experience
const today = new Date();
const oneDay = 24 * 60 * 60 * 1000;
const oneMonth = 30 * oneDay;

export const mockCustomers: Customer[] = [
    { id: 'CUST-1', name: 'John Smith', email: 'john.smith@example.com', phone: '01234 567890', tags: ['Fleet', 'Regular'], loyaltyPoints: 150 },
    { id: 'CUST-2', name: 'Jane Doe', email: 'jane.doe@example.com', phone: '09876 543210', tags: ['New Customer'], loyaltyPoints: 20 },
    { id: 'CUST-3', name: 'Peter Jones', email: 'peter.jones@example.com', phone: '01112 223344', tags: ['Regular'], loyaltyPoints: 500 },
];

export const mockVehicles: Vehicle[] = [
    { id: 'VEH-1', customerId: 'CUST-1', make: 'Ford', model: 'Transit', year: '2020', vin: 'VIN1234567890ABCDE', licensePlate: 'AB20 CDE', photos: [] },
    { id: 'VEH-2', customerId: 'CUST-2', make: 'Volkswagen', model: 'Golf', year: '2018', vin: 'VIN67890ABCDE12345', licensePlate: 'CD18 EFG', photos: [] },
    { id: 'VEH-3', customerId: 'CUST-1', make: 'Vauxhall', model: 'Vivaro', year: '2021', vin: 'VINABCDE1234567890', licensePlate: 'EF21 GHI', photos: [] },
    { id: 'VEH-4', customerId: 'CUST-3', make: 'BMW', model: '3 Series', year: '2022', vin: 'VINFGHIJ1234567890', licensePlate: 'GH22 IJK', photos: [] },
];

export const mockInventoryParts: InventoryPart[] = [
    { id: 'PART-1', name: 'Engine Oil 5L 5W-30', sku: 'OIL-5W30-5L', stock: 50, price: 45.00, brand: 'Castrol', compatibleBrands: ['Ford', 'Volkswagen', 'BMW', 'Vauxhall'] },
    { id: 'PART-2', name: 'Oil Filter', sku: 'OF-001', stock: 120, price: 12.50, brand: 'Bosch', compatibleBrands: ['Ford', 'Volkswagen'] },
    { id: 'PART-3', name: 'Brake Pads (Front)', sku: 'BP-F-002', stock: 3, price: 55.00, brand: 'Brembo', compatibleBrands: ['BMW', 'Volkswagen'] },
    { id: 'PART-4', name: 'Wiper Blade', sku: 'WB-003', stock: 75, price: 15.00, brand: 'Bosch', compatibleBrands: ['Ford', 'Volkswagen', 'BMW', 'Vauxhall'] },
    { id: 'PART-5', name: 'Air Filter', sku: 'AF-004', stock: 60, price: 22.00, brand: 'Mann-Filter', compatibleBrands: ['Ford', 'Volkswagen', 'BMW'] },
    { id: 'PART-6', name: 'Spark Plug (x4)', sku: 'SP-005', stock: 45, price: 35.00, brand: 'NGK', compatibleBrands: ['Ford', 'Volkswagen'] },
    { id: 'PART-7', name: 'Car Battery 12V', sku: 'BAT-006', stock: 15, price: 110.00, brand: 'Yuasa', compatibleBrands: ['Ford', 'Volkswagen', 'BMW', 'Vauxhall'] },
    { id: 'PART-8', name: 'Tyre 205/55 R16', sku: 'TY-2055516', stock: 24, price: 85.00, brand: 'Michelin', compatibleBrands: ['Volkswagen', 'BMW'] },
    { id: 'PART-9', name: 'Brake Disc (Front)', sku: 'BD-F-007', stock: 18, price: 75.00, brand: 'Brembo', compatibleBrands: ['BMW', 'Volkswagen'] },
    { id: 'PART-10', name: 'Antifreeze Coolant 5L', sku: 'AC-5L', stock: 40, price: 25.00, brand: 'Prestone', compatibleBrands: ['Ford', 'Volkswagen', 'BMW', 'Vauxhall'] },
    { id: 'PART-11', name: 'Headlight Bulb H7', sku: 'HB-H7', stock: 100, price: 8.00, brand: 'Osram', compatibleBrands: ['Ford', 'Volkswagen', 'BMW', 'Vauxhall'] },
    { id: 'PART-12', name: 'Pollen Filter', sku: 'PF-008', stock: 55, price: 18.00, brand: 'Bosch', compatibleBrands: ['Ford', 'Volkswagen', 'BMW'] }
];

const pastQuoteDate1 = new Date(today.getTime() - oneMonth);
const pastQuoteDate2 = new Date(today.getTime() - 10 * oneDay);
const pastQuoteDate3 = new Date(today.getTime() - 2 * oneDay);

const pastApptDate1 = new Date(pastQuoteDate1.getTime() + oneDay);
const futureApptDate3 = new Date(today.getTime() + oneDay);
futureApptDate3.setHours(10, 0, 0, 0);

export const mockQuotes: Quote[] = [
    {
        id: `QT-${pastQuoteDate1.getTime()}`,
        customerId: 'CUST-1',
        vehicleId: 'VEH-1',
        status: 'Paid',
        appointmentId: `APP-${pastApptDate1.getTime()}`,
        technicianId: 'TECH-1',
        payments: [{ id: 'PAY-1', amount: 357.00, method: 'Credit Card', date: pastApptDate1.toISOString() }],
        services: [
            {
                name: 'Full Service',
                parts: [
                    { name: 'Engine Oil 5L 5W-30', quantity: 1, unitPrice: 45.00, totalPrice: 45.00, inventoryPartId: 'PART-1' },
                    { name: 'Oil Filter', quantity: 1, unitPrice: 12.50, totalPrice: 12.50, inventoryPartId: 'PART-2' },
                ],
                laborHours: 2.5,
                laborCost: 240,
                serviceTotal: 297.50,
            }
        ],
        subtotal: 297.50,
        taxAmount: 59.50,
        totalCost: 357.00,
        estimatedDurationHours: 4,
        notes: 'Advised customer about rear brake pad wear.',
        completionDate: new Date(pastApptDate1.getTime() + oneDay).toISOString(),
        mileageAtCompletion: 30500,
    },
    {
        id: `QT-${pastQuoteDate2.getTime()}`,
        customerId: 'CUST-2',
        vehicleId: 'VEH-2',
        status: 'Approved', // This will be in unscheduled jobs list
        technicianId: 'TECH-2',
        services: [
            {
                name: 'Front Brake Pad Replacement',
                parts: [
                    { name: 'Brake Pads (Front)', quantity: 1, unitPrice: 55.00, totalPrice: 55.00, inventoryPartId: 'PART-3' },
                ],
                laborHours: 1.5,
                laborCost: 150,
                serviceTotal: 205.00,
            }
        ],
        subtotal: 205.00,
        taxAmount: 41.00,
        totalCost: 246.00,
        estimatedDurationHours: 2,
        notes: 'Customer will wait for the service to be completed.',
    },
    {
        id: `QT-${pastQuoteDate3.getTime()}`,
        customerId: 'CUST-3',
        vehicleId: 'VEH-4',
        status: 'Work In Progress', // This will be on the jobs board
        appointmentId: `APP-${futureApptDate3.getTime()}`,
        technicianId: 'TECH-1',
        services: [
            {
                name: 'Annual MOT and Checkup',
                parts: [{ name: 'Pollen Filter', quantity: 1, unitPrice: 18.00, totalPrice: 18.00, inventoryPartId: 'PART-12' }],
                laborHours: 2.0,
                laborCost: 200,
                serviceTotal: 218.00,
            }
        ],
        subtotal: 218.00,
        taxAmount: 43.60,
        totalCost: 261.60,
        estimatedDurationHours: 3,
        notes: 'Customer reports a slight pull to the left when braking. Check alignment.',
    }
];

export const mockAppointments: Appointment[] = [
    { id: `APP-${pastApptDate1.getTime()}`, quoteId: `QT-${pastQuoteDate1.getTime()}`, customerId: 'CUST-1', vehicleId: 'VEH-1', dateTime: pastApptDate1.toISOString() },
    // No appointment for the 'Approved' quote as it's unscheduled
    { id: `APP-${futureApptDate3.getTime()}`, quoteId: `QT-${pastQuoteDate3.getTime()}`, customerId: 'CUST-3', vehicleId: 'VEH-4', dateTime: futureApptDate3.toISOString() },
];

export const mockTechnicians: Technician[] = [
    { id: 'TECH-1', name: 'Mike Miller', specialty: 'Engine & Drivetrain', availability: { 'Monday': true, 'Tuesday': true, 'Wednesday': true, 'Thursday': true, 'Friday': true, 'Saturday': false, 'Sunday': false } },
    { id: 'TECH-2', name: 'Sarah Jones', specialty: 'Brakes & Suspension', availability: { 'Monday': true, 'Tuesday': true, 'Wednesday': true, 'Thursday': false, 'Friday': false, 'Saturday': false, 'Sunday': false } },
];

export const mockCommunicationLogs: CommunicationLog[] = [
    { id: 'LOG-1', customerIds: ['CUST-1'], subject: 'Service Reminder', message: 'Your Ford Transit is due for its annual service.', date: new Date(today.getTime() - (2 * oneMonth)).toISOString() }
];

export const mockMaintenanceSchedules: MaintenanceSchedule[] = [
    { id: 'MS-1', name: 'Annual Service', intervalMiles: 12000, intervalMonths: 12 },
    { id: 'MS-2', name: 'Brake Fluid Change', intervalMonths: 24 },
];

export const mockVehicleMaintenance: VehicleMaintenance[] = [
    { id: 'VM-1', vehicleId: 'VEH-1', scheduleId: 'MS-1', lastPerformedDate: '2023-01-02T16:00:00Z', lastPerformedMileage: 30500 },
];

export const mockShopSettings: ShopSettings = {
    id: 'default',
    shopName: 'Gemini Auto Repair',
    address: '123 Gemini Street, London, SW1A 0AA',
    phone: '020 7946 0000',
    email: 'contact@geminiauto.co.uk',
    website: 'www.geminiauto.co.uk',
    logoDataUrl: '',
    taxRate: 0.20,
    laborRate: 100,
    operatingHours: { start: '08:00', end: '17:30' },
    daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    numberOfBays: 4,
    vehicleApiUrl: '',
};