

export interface Part {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inventoryPartId?: string;
}

export interface ServiceItem {
  name: string;
  parts: Part[];
  laborHours: number;
  laborCost: number;
  serviceTotal: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags?: string[];
  loyaltyPoints?: number;
}

export interface Photo {
  id: string;
  dataUrl: string; // base64 data URL
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  licensePlate: string;
  photos?: Photo[];
}

export interface Technician {
    id: string;
    name: string;
    specialty?: string;
    availability: {
        [day: string]: boolean;
    };
}

export type QuoteStatus = 'Saved' | 'Approved' | 'Work In Progress' | 'Awaiting Parts' | 'Ready for Pickup' | 'Completed' | 'Paid';

export interface Payment {
    id: string;
    amount: number;
    method: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Other';
    date: string; // ISO 8601 format
}

export interface InventoryPart {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  brand?: string;
  compatibleBrands?: string[];
}

export interface CommunicationLog {
  id: string;
  customerIds: string[];
  subject: string;
  message: string;
  date: string; // ISO 8601 format
}

export interface MaintenanceSchedule {
    id: string;
    name: string;
    intervalMiles?: number;
    intervalMonths?: number;
}

export interface VehicleMaintenance {
    id: string;
    vehicleId: string;
    scheduleId: string;
    lastPerformedDate: string; // ISO 8601 format
    lastPerformedMileage: number;
}

export interface Quote {
  id: string;
  customerId: string;
  vehicleId: string;
  status: QuoteStatus;
  appointmentId?: string;
  technicianId?: string;
  payments?: Payment[];
  discountAmount?: number;
  discountReason?: string;
  services: ServiceItem[];
  subtotal: number;
  taxAmount: number;
  totalCost: number;
  estimatedDurationHours: number;
  notes: string;
  completionDate?: string; // ISO 8601 format
  mileageAtCompletion?: number;
}

export interface Appointment {
    id: string;
    quoteId: string;
    customerId: string;
    vehicleId: string;
    dateTime: string; // ISO 8601 format
}

// A temporary type for a quote that hasn't been saved yet
export type DraftQuote = Omit<Quote, 'id' | 'status' | 'appointmentId' | 'payments' | 'technicianId' | 'discountAmount' | 'discountReason' | 'completionDate' | 'mileageAtCompletion'>;

// Used for display components that need resolved names/details
export interface HydratedQuote extends Quote {
    customerName: string;
    vehicle: string;
    appointmentDate?: string;
    technicianName?: string;
}

export interface HydratedAppointment extends Appointment {
    customerName: string;
    vehicle: string;
    serviceName: string;
    technicianName?: string;
}

export type Theme = 'light' | 'dark';

export type Language = 'en-GB' | 'es-ES' | 'fr-FR' | 'pt-PT';

export interface UISettings {
    theme: Theme;
    language: Language;
}

export interface ShopSettings {
    id: 'default'; // Use a fixed ID for the single settings object
    shopName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logoDataUrl: string; // Changed from logoUrl
    taxRate: number; // e.g., 0.20 for 20%
    laborRate: number; // e.g., 100 for £100/hr
    operatingHours: { start: string; end: string };
    daysOpen: string[]; // e.g., ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    numberOfBays: number;
    vehicleApiUrl?: string;
}

export interface VinInfo {
  make: string;
  model: string;
  year: string;
}

export interface ModelListResponse {
  models: string[];
}

export interface Invoice extends HydratedQuote {
    customer: Customer;
    vehicleDetails: Vehicle;
}

export type JobCardData = Invoice;

export interface Notification {
  id: string;
  type: 'APPOINTMENT_REMINDER' | 'PAYMENT_REMINDER';
  message: string;
  customerId: string;
  customerName: string;
  vehicleId?: string;
  vehicleName?: string;
  quoteId?: string;
  appointmentId?: string;
  dueDate?: string;
}

export type CommunicationType = 'generic' | 'quoteApproval' | 'invoice' | 'receipt' | 'appointmentReminder' | 'pickupReady' | 'paymentReminder';

export interface CommunicationModalData {
    customers: Customer[];
    subject: string;
    message: string;
    quote?: HydratedQuote;
    appointment?: HydratedAppointment;
    communicationType: CommunicationType;
}