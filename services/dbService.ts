import type { Customer, Vehicle, Quote, Appointment, InventoryPart, Technician, ShopSettings, CommunicationLog, MaintenanceSchedule, VehicleMaintenance } from './types';
import { mockCustomers, mockVehicles, mockInventoryParts, mockQuotes, mockAppointments, mockTechnicians, mockShopSettings, mockCommunicationLogs, mockMaintenanceSchedules, mockVehicleMaintenance } from './mockData';


const DB_NAME = 'AutoRepairShopDB';
const DB_VERSION = 3; // Incremented version for schema change with new indexes
const ALL_STORES = ['customers', 'vehicles', 'quotes', 'appointments', 'inventoryParts', 'technicians', 'shopSettings', 'communicationLogs', 'maintenanceSchedules', 'vehicleMaintenance'];

let db: IDBDatabase;
let seedingPromise: Promise<void> | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      const tx = (event.target as IDBOpenDBRequest).transaction!;
      
      // Create stores if they don't exist
      ALL_STORES.forEach(storeName => {
        if (!dbInstance.objectStoreNames.contains(storeName)) {
            dbInstance.createObjectStore(storeName, { keyPath: 'id' });
        }
      });

      // Add indexes to specific stores to improve query performance
      const vehicleStore = tx.objectStore('vehicles');
      if (!vehicleStore.indexNames.contains('customerId')) {
          vehicleStore.createIndex('customerId', 'customerId', { unique: false });
      }

      const maintStore = tx.objectStore('vehicleMaintenance');
      if (!maintStore.indexNames.contains('vehicleId')) {
          maintStore.createIndex('vehicleId', 'vehicleId', { unique: false });
      }
    };
  });
};

const getStore = (storeName: string, mode: IDBTransactionMode) => {
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
};

const getAll = <T>(storeName: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readonly');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const get = <T>(storeName: string, key: string): Promise<T | undefined> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readonly');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const put = <T>(storeName: string, item: T): Promise<T> => {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readwrite');
    const request = store.put(item);
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
};

const putMultiple = <T>(storeName: string, items: T[]): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        items.forEach(item => store.put(item));
        transaction.oncomplete = () => resolve(items);
        transaction.onerror = () => reject(transaction.error);
    });
};

const deleteItem = (storeName: string, key: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readwrite');
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const seedDatabaseIfEmpty = (): Promise<void> => {
    if (seedingPromise) {
      return seedingPromise;
    }

    seedingPromise = new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readonly');
        const customerStore = transaction.objectStore('customers');
        const countRequest = customerStore.count();
        
        countRequest.onsuccess = () => {
            if (countRequest.result === 0) {
                console.log("Database is empty, seeding with mock data...");
                const seedTransaction = db.transaction(ALL_STORES, 'readwrite');
                
                seedTransaction.onerror = () => {
                    console.error("Error seeding database:", seedTransaction.error);
                    seedingPromise = null; // Allow retry on error
                    reject(seedTransaction.error);
                };
                
                seedTransaction.oncomplete = () => {
                    console.log("Database seeded successfully.");
                    resolve();
                };

                const stores = {
                    customers: seedTransaction.objectStore('customers'),
                    vehicles: seedTransaction.objectStore('vehicles'),
                    inventoryParts: seedTransaction.objectStore('inventoryParts'),
                    quotes: seedTransaction.objectStore('quotes'),
                    appointments: seedTransaction.objectStore('appointments'),
                    technicians: seedTransaction.objectStore('technicians'),
                    shopSettings: seedTransaction.objectStore('shopSettings'),
                    communicationLogs: seedTransaction.objectStore('communicationLogs'),
                    maintenanceSchedules: seedTransaction.objectStore('maintenanceSchedules'),
                    vehicleMaintenance: seedTransaction.objectStore('vehicleMaintenance'),
                };

                mockCustomers.forEach(c => stores.customers.add(c));
                mockVehicles.forEach(v => stores.vehicles.add(v));
                mockInventoryParts.forEach(p => stores.inventoryParts.add(p));
                mockQuotes.forEach(q => stores.quotes.add(q));
                mockAppointments.forEach(a => stores.appointments.add(a));
                mockTechnicians.forEach(t => stores.technicians.add(t));
                mockCommunicationLogs.forEach(l => stores.communicationLogs.add(l));
                mockMaintenanceSchedules.forEach(s => stores.maintenanceSchedules.add(s));
                mockVehicleMaintenance.forEach(vm => stores.vehicleMaintenance.add(vm));
                stores.shopSettings.add(mockShopSettings);

            } else {
                console.log("Database already contains data, skipping seed.");
                resolve();
            }
        };

        countRequest.onerror = () => {
            console.error("Error checking customer count:", countRequest.error);
            seedingPromise = null; // Allow retry on error
            reject(countRequest.error);
        }
    });

    return seedingPromise;
};

const exportAllData = async (): Promise<Record<string, any[]>> => {
    const allData: Record<string, any[]> = {};
    for (const storeName of ALL_STORES) {
        allData[storeName] = await getAll(storeName);
    }
    return allData;
};

const clearAndImportData = (data: Record<string, any[]>): Promise<void> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(ALL_STORES, 'readwrite');
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        for (const storeName of ALL_STORES) {
            const store = transaction.objectStore(storeName);
            store.clear();
            if (data[storeName]) {
                data[storeName].forEach(item => store.add(item));
            }
        }
    });
};


export const dbService = {
  initDB,
  seedDatabaseIfEmpty,
  exportAllData,
  clearAndImportData,

  getAllCustomers: () => getAll<Customer>('customers'),
  putCustomer: (customer: Customer) => put('customers', customer),
  
  getAllVehicles: () => getAll<Vehicle>('vehicles'),
  putVehicle: (vehicle: Vehicle) => put('vehicles', vehicle),
  getVehiclesForCustomer: (customerId: string): Promise<Vehicle[]> => {
    return new Promise((resolve, reject) => {
        const store = getStore('vehicles', 'readonly');
        const index = store.index('customerId');
        const request = index.getAll(customerId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
  },
  
  getAllQuotes: () => getAll<Quote>('quotes'),
  putQuote: (quote: Quote) => put('quotes', quote),
  deleteQuote: (id: string) => deleteItem('quotes', id),
  
  getAllAppointments: () => getAll<Appointment>('appointments'),
  putAppointment: (appointment: Appointment) => put('appointments', appointment),
  deleteAppointment: (id: string) => deleteItem('appointments', id),

  getAllInventoryParts: () => getAll<InventoryPart>('inventoryParts'),
  putInventoryPart: (part: InventoryPart) => put('inventoryParts', part),

  getAllTechnicians: () => getAll<Technician>('technicians'),
  putTechnician: (technician: Technician) => put('technicians', technician),
  putMultipleTechnicians: (technicians: Technician[]) => putMultiple('technicians', technicians),
  
  getAllCommunicationLogs: () => getAll<CommunicationLog>('communicationLogs'),
  putCommunicationLog: (log: CommunicationLog) => put('communicationLogs', log),
  
  getShopSettings: async (): Promise<ShopSettings> => {
    const settings = await get<Partial<ShopSettings>>('shopSettings', 'default');
    // Merge saved settings with defaults to ensure new properties exist and id is correct
    return { ...mockShopSettings, ...settings, id: 'default' };
  },
  putShopSettings: (settings: ShopSettings) => put('shopSettings', settings),

  getAllMaintenanceSchedules: () => getAll<MaintenanceSchedule>('maintenanceSchedules'),
  putMaintenanceSchedule: (schedule: MaintenanceSchedule) => put('maintenanceSchedules', schedule),
  deleteMaintenanceSchedule: (id: string) => deleteItem('maintenanceSchedules', id),

  getAllVehicleMaintenance: () => getAll<VehicleMaintenance>('vehicleMaintenance'),
  getVehicleMaintenanceForVehicle: (vehicleId: string): Promise<VehicleMaintenance[]> => {
    return new Promise((resolve, reject) => {
      const store = getStore('vehicleMaintenance', 'readonly');
      const index = store.index('vehicleId');
      const request = index.getAll(vehicleId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  putVehicleMaintenance: (vm: VehicleMaintenance) => put('vehicleMaintenance', vm),
  deleteVehicleMaintenance: (id: string) => deleteItem('vehicleMaintenance', id),
};
