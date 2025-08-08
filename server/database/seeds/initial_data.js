// Using client-side mock data as the source of truth for seeding
import { 
  mockCustomers, mockVehicles, mockInventoryParts, mockQuotes, 
  mockAppointments, mockTechnicians, mockShopSettings, mockCommunicationLogs, 
  mockMaintenanceSchedules, mockVehicleMaintenance 
} from '../../../client/src/services/mockData.js';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export const seed = async (knex) => {
  // Deletes ALL existing entries in reverse order of creation due to foreign keys
  await knex('vehicleMaintenance').del();
  await knex('maintenanceSchedules').del();
  await knex('communicationLogs').del();
  await knex('appointments').del();
  await knex('quotes').del();
  await knex('inventoryParts').del();
  await knex('technicians').del();
  await knex('vehicles').del();
  await knex('customers').del();
  await knex('shopSettings').del();

  // Helper to stringify JSON fields
  const stringifyJson = (data, fields) => {
    return data.map(item => {
      const newItem = { ...item };
      fields.forEach(field => {
        if (newItem[field] && typeof newItem[field] !== 'string') {
          newItem[field] = JSON.stringify(newItem[field]);
        }
      });
      return newItem;
    });
  };

  await knex('customers').insert(stringifyJson(mockCustomers, ['tags']));
  await knex('vehicles').insert(stringifyJson(mockVehicles, ['photos']));
  await knex('inventoryParts').insert(stringifyJson(mockInventoryParts, ['compatibleBrands']));
  await knex('technicians').insert(stringifyJson(mockTechnicians, ['availability']));
  await knex('quotes').insert(stringifyJson(mockQuotes, ['services', 'payments']));
  await knex('appointments').insert(mockAppointments);
  await knex('communicationLogs').insert(stringifyJson(mockCommunicationLogs, ['customerIds']));
  await knex('maintenanceSchedules').insert(mockMaintenanceSchedules);
  await knex('vehicleMaintenance').insert(mockVehicleMaintenance);

  const settingsWithJson = {
    ...mockShopSettings,
    operatingHours: JSON.stringify(mockShopSettings.operatingHours),
    daysOpen: JSON.stringify(mockShopSettings.daysOpen),
  };
  await knex('shopSettings').insert(settingsWithJson);
};
