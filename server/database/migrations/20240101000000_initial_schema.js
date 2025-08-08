/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
  await knex.schema.createTable('customers', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable();
    table.string('phone');
    table.json('tags');
    table.integer('loyaltyPoints').defaultTo(0);
  });

  await knex.schema.createTable('vehicles', (table) => {
    table.string('id').primary();
    table.string('customerId').references('id').inTable('customers').onDelete('CASCADE');
    table.string('make').notNullable();
    table.string('model').notNullable();
    table.string('year').notNullable();
    table.string('vin').unique();
    table.string('licensePlate');
    table.json('photos');
  });

  await knex.schema.createTable('technicians', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('specialty');
    table.json('availability').notNullable();
  });

  await knex.schema.createTable('inventoryParts', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('sku').unique();
    table.integer('stock').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.string('brand');
    table.json('compatibleBrands');
  });
  
  await knex.schema.createTable('quotes', (table) => {
    table.string('id').primary();
    table.string('customerId').references('id').inTable('customers');
    table.string('vehicleId').references('id').inTable('vehicles');
    table.string('status').notNullable();
    table.string('appointmentId');
    table.string('technicianId').references('id').inTable('technicians');
    table.json('payments');
    table.decimal('discountAmount', 10, 2);
    table.string('discountReason');
    table.json('services').notNullable();
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('taxAmount', 10, 2).notNullable();
    table.decimal('totalCost', 10, 2).notNullable();
    table.decimal('estimatedDurationHours', 5, 2).notNullable();
    table.text('notes');
    table.string('completionDate');
    table.integer('mileageAtCompletion');
  });
  
  await knex.schema.createTable('appointments', (table) => {
    table.string('id').primary();
    table.string('quoteId').references('id').inTable('quotes').onDelete('CASCADE');
    table.string('customerId').references('id').inTable('customers');
    table.string('vehicleId').references('id').inTable('vehicles');
    table.string('dateTime').notNullable();
  });

  await knex.schema.createTable('shopSettings', (table) => {
    table.string('id').primary();
    table.string('shopName');
    table.string('address');
    table.string('phone');
    table.string('email');
    table.string('website');
    table.text('logoDataUrl');
    table.decimal('taxRate', 5, 4);
    table.decimal('laborRate', 10, 2);
    table.json('operatingHours');
    table.json('daysOpen');
    table.integer('numberOfBays');
    table.string('vehicleApiUrl');
  });

  await knex.schema.createTable('communicationLogs', (table) => {
    table.string('id').primary();
    table.json('customerIds').notNullable();
    table.string('subject').notNullable();
    table.text('message').notNullable();
    table.string('date').notNullable();
  });

  await knex.schema.createTable('maintenanceSchedules', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.integer('intervalMiles');
    table.integer('intervalMonths');
  });

  await knex.schema.createTable('vehicleMaintenance', (table) => {
    table.string('id').primary();
    table.string('vehicleId').references('id').inTable('vehicles').onDelete('CASCADE');
    table.string('scheduleId').references('id').inTable('maintenanceSchedules').onDelete('CASCADE');
    table.string('lastPerformedDate').notNullable();
    table.integer('lastPerformedMileage').notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
  await knex.schema.dropTableIfExists('vehicleMaintenance');
  await knex.schema.dropTableIfExists('maintenanceSchedules');
  await knex.schema.dropTableIfExists('communicationLogs');
  await knex.schema.dropTableIfExists('shopSettings');
  await knex.schema.dropTableIfExists('appointments');
  await knex.schema.dropTableIfExists('quotes');
  await knex.schema.dropTableIfExists('inventoryParts');
  await knex.schema.dropTableIfExists('technicians');
  await knex.schema.dropTableIfExists('vehicles');
  await knex.schema.dropTableIfExists('customers');
};