
import React, { useState, useEffect } from 'react';
import { DocumentPlusIcon, CogIcon, UserPlusIcon, UsersIcon, CarIcon, PlusIcon } from '../Icon';
import type { Customer, Vehicle } from '../types';
import { useLocalization } from '../services/localization';
import { SearchableDropdown } from './SearchableDropdown';

interface QuoteFormProps {
  onSubmit: (formData: { customerId: string, vehicleId: string }, serviceRequest: string) => void;
  isLoading: boolean;
  customers: Customer[];
  vehicles: Vehicle[];
  onNewCustomerClick: () => void;
  onNewVehicleClick: (customerId: string) => void;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({ onSubmit, isLoading, customers, vehicles, onNewCustomerClick, onNewVehicleClick }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [service, setService] = useState('Standard oil change and tire rotation');
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const { t } = useLocalization();

  useEffect(() => {
    // This effect ensures a customer is always selected if possible
    if (customers.length > 0 && !customers.find(c => c.id === selectedCustomerId)) {
      setSelectedCustomerId(customers[0]?.id || '');
    }
  }, [customers, selectedCustomerId]);
  
  useEffect(() => {
    if (selectedCustomerId) {
      const filteredVehicles = vehicles.filter(v => v.customerId === selectedCustomerId);
      setCustomerVehicles(filteredVehicles);
      // Auto-select the first vehicle or clear if none exist
      setSelectedVehicleId(filteredVehicles[0]?.id || '');
    } else {
      setCustomerVehicles([]);
      setSelectedVehicleId('');
    }
  }, [selectedCustomerId, vehicles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomerId && selectedVehicleId && service) {
      onSubmit({ customerId: selectedCustomerId, vehicleId: selectedVehicleId }, service);
    }
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
      <div className="flex items-center mb-6">
        <DocumentPlusIcon className="h-8 w-8 text-brand-blue dark:text-blue-400" />
        <h2 className="ml-3 text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{t('newQuoteTitle')}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="customer" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">{t('customerLabel')}</label>
            <div className="flex items-center space-x-2">
                <SearchableDropdown
                    icon={<UsersIcon className="h-5 w-5 text-brand-gray-400 dark:text-brand-gray-500" />}
                    items={customers}
                    selectedId={selectedCustomerId}
                    onSelect={(id) => setSelectedCustomerId(id)}
                    placeholder={t('customerSearchPlaceholder')}
                    displayProperty="name"
                />
                <button
                    type="button"
                    onClick={onNewCustomerClick}
                    className="p-2 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm text-brand-gray-700 dark:text-brand-gray-300 bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 transition-colors"
                    aria-label={t('addNewCustomerLabel')}
                >
                    <UserPlusIcon className="h-5 w-5" />
                </button>
            </div>
        </div>

        {selectedCustomerId && (
          <div className="animate-fade-in">
              <label htmlFor="vehicle" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">{t('vehicleLabel')}</label>
              <div className="flex items-center space-x-2">
                  <div className="relative flex-grow">
                      <CarIcon className="h-5 w-5 text-brand-gray-400 dark:text-brand-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                          id="vehicle"
                          value={selectedVehicleId}
                          onChange={(e) => setSelectedVehicleId(e.target.value)}
                          className="pl-10 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm appearance-none"
                          required
                          disabled={customerVehicles.length === 0}
                      >
                          {customerVehicles.length > 0 ? (
                            customerVehicles.map(v => <option key={v.id} value={v.id}>{`${v.year} ${v.make} ${v.model}`}</option>)
                          ) : (
                            <option value="">{t('noVehiclesForCustomer')}</option>
                          )}
                      </select>
                  </div>
                  <button
                      type="button"
                      onClick={() => onNewVehicleClick(selectedCustomerId)}
                      className="p-2 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm text-brand-gray-700 dark:text-brand-gray-300 bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 transition-colors"
                      aria-label={t('addNewVehicleLabel')}
                  >
                      <PlusIcon className="h-5 w-5" />
                  </button>
              </div>
          </div>
        )}

        <div>
          <label htmlFor="service" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('serviceRequestLabel')}</label>
          <textarea
            id="service"
            value={service}
            onChange={(e) => setService(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm placeholder-brand-gray-600 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
            placeholder={t('serviceRequestPlaceholder')}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !selectedCustomerId || !selectedVehicleId}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-brand-gray-400 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <CogIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              {t('generatingButton')}
            </>
          ) : (
            t('generateQuoteButton')
          )}
        </button>
      </form>
    </div>
  );
};
