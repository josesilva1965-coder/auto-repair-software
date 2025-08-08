import type { Customer, Vehicle, Quote, Appointment, InventoryPart, Technician, ShopSettings, CommunicationLog, MaintenanceSchedule, VehicleMaintenance, Photo, DraftQuote, QuoteStatus, Payment } from '../types.js';

const API_BASE_URL = '/api';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'An unknown error occurred');
    }
    return response.json();
};

const apiRequest = (endpoint: string, options: RequestInit = {}) => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    }).then(handleResponse);
};

export const dbService = {
    // --- READ ---
    getAllCustomers: (): Promise<Customer[]> => apiRequest('/customers'),
    getCustomer: (id: string): Promise<Customer> => apiRequest(`/customers/${id}`),
    getAllVehicles: (): Promise<Vehicle[]> => apiRequest('/vehicles'),
    getVehicle: (id: string): Promise<Vehicle> => apiRequest(`/vehicles/${id}`),
    getAllQuotes: (): Promise<Quote[]> => apiRequest('/quotes'),
    getQuote: (id: string): Promise<Quote> => apiRequest(`/quotes/${id}`),
    getAllAppointments: (): Promise<Appointment[]> => apiRequest('/appointments'),
    getAllInventoryParts: (): Promise<InventoryPart[]> => apiRequest('/inventory'),
    getAllTechnicians: (): Promise<Technician[]> => apiRequest('/technicians'),
    getShopSettings: (): Promise<ShopSettings> => apiRequest('/settings'),
    getAllCommunicationLogs: (): Promise<CommunicationLog[]> => apiRequest('/logs'),
    getAllMaintenanceSchedules: (): Promise<MaintenanceSchedule[]> => apiRequest('/maintenance-schedules'),
    getAllVehicleMaintenance: (): Promise<VehicleMaintenance[]> => apiRequest('/vehicle-maintenance'),

    // --- WRITE ---
    putCustomer: (customer: Omit<Customer, 'id'> | Customer): Promise<Customer> => apiRequest('/customers', { method: 'POST', body: JSON.stringify(customer) }),
    putVehicle: (vehicle: Omit<Vehicle, 'id' | 'customerId'> | Vehicle, customerId: string): Promise<Vehicle> => apiRequest(`/vehicles/customers/${customerId}/vehicles`, { method: 'POST', body: JSON.stringify(vehicle) }),
    putInventoryPart: (part: Omit<InventoryPart, 'id'> | InventoryPart): Promise<InventoryPart> => apiRequest('/inventory', { method: 'POST', body: JSON.stringify(part) }),
    putTechnician: (technician: Omit<Technician, 'id' | 'availability'>): Promise<Technician> => apiRequest('/technicians', { method: 'POST', body: JSON.stringify(technician) }),
    putMultipleTechnicians: (technicians: Technician[]): Promise<Technician[]> => apiRequest('/technicians/batch', { method: 'PUT', body: JSON.stringify({ technicians }) }),
    putQuote: (quote: Quote): Promise<Quote> => apiRequest(`/quotes/${quote.id}`, { method: 'PUT', body: JSON.stringify(quote) }),
    putShopSettings: (settings: ShopSettings): Promise<ShopSettings> => apiRequest('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
    putMaintenanceSchedule: (schedule: Omit<MaintenanceSchedule, 'id'>): Promise<MaintenanceSchedule> => apiRequest('/maintenance-schedules', { method: 'POST', body: JSON.stringify(schedule) }),
    
    // --- COMPLEX OPERATIONS ---
    generateQuote: (customerId: string, vehicleId: string, serviceRequest: string): Promise<DraftQuote> => apiRequest('/quotes/generate', { method: 'POST', body: JSON.stringify({ customerId, vehicleId, serviceRequest }) }),
    createQuote: (draftQuote: DraftQuote): Promise<Quote> => apiRequest('/quotes', { method: 'POST', body: JSON.stringify(draftQuote) }),
    updateQuoteStatus: (quoteId: string, status: QuoteStatus, mileage?: number): Promise<Quote> => apiRequest(`/quotes/${quoteId}/status`, { method: 'PUT', body: JSON.stringify({ status, mileage }) }),
    updateQuoteNotes: (quoteId: string, notes: string): Promise<Quote> => apiRequest(`/quotes/${quoteId}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) }),
    deleteQuote: (quoteId: string): Promise<{ success: boolean }> => apiRequest(`/quotes/${quoteId}`, { method: 'DELETE' }),
    createAppointment: (quoteId: string, dateTime: string): Promise<{ appointment: Appointment, quote: Quote }> => apiRequest('/appointments', { method: 'POST', body: JSON.stringify({ quoteId, dateTime }) }),
    updateAppointmentDate: (appointmentId: string, newDateISO: string): Promise<Appointment> => apiRequest(`/appointments/${appointmentId}/date`, { method: 'PUT', body: JSON.stringify({ newDateISO }) }),
    createPayment: (quoteId: string, paymentData: Omit<Payment, 'id'>): Promise<Quote> => apiRequest(`/quotes/${quoteId}/payments`, { method: 'POST', body: JSON.stringify(paymentData) }),
    assignTechnician: (quoteId: string, technicianId: string): Promise<Quote> => apiRequest(`/quotes/${quoteId}/assign`, { method: 'PUT', body: JSON.stringify({ technicianId }) }),
    addVehiclePhotos: (vehicleId: string, photos: Photo[]): Promise<Vehicle> => apiRequest(`/vehicles/${vehicleId}/photos`, { method: 'POST', body: JSON.stringify({ photos }) }),
    deleteVehiclePhoto: (vehicleId: string, photoId: string): Promise<Vehicle> => apiRequest(`/vehicles/${vehicleId}/photos/${photoId}`, { method: 'DELETE' }),
    applyDiscount: (quoteId: string, pointsToRedeem: number): Promise<{ quote: Quote, customer: Customer }> => apiRequest(`/quotes/${quoteId}/discount`, { method: 'POST', body: JSON.stringify({ pointsToRedeem }) }),
    createCommunicationLog: (customerIds: string[], subject: string, message: string): Promise<CommunicationLog> => apiRequest('/logs', { method: 'POST', body: JSON.stringify({ customerIds, subject, message }) }),

    exportAllData: (): Promise<Record<string, any[]>> => apiRequest('/data/export'),
    clearAndImportData: (data: Record<string, any[]>): Promise<void> => {
        return apiRequest('/data/import', { method: 'POST', body: JSON.stringify(data) });
    },
};