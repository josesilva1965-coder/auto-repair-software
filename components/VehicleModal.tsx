import React, { useState, useEffect } from 'react';
import { CarIcon, XMarkIcon, MagnifyingGlassIcon, CogIcon, UsersIcon, PencilSquareIcon } from '../Icon';
import type { Vehicle, VinInfo, Customer } from '../types';
import { useLocalization } from '../services/localization';
import { getVehicleInfoFromVin, getVehicleInfoFromRegistration, getModelsForMakeYear } from '../services/geminiService';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicleData: Vehicle | Omit<Vehicle, 'id' | 'customerId'>, customerId: string) => void;
  customers: Customer[];
  initialCustomerId: string | null;
  vehicleToEdit: Vehicle | null;
}

const carMakes = [
    "Abarth", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", "Cadillac", "Chevrolet", "Chrysler", 
    "Citroën", "Dacia", "Dodge", "DS", "Ferrari", "Fiat", "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", 
    "Isuzu", "Iveco", "Jaguar", "Jeep", "Kia", "Lamborghini", "Lancia", "Land Rover", "Lexus", "Lotus", "Maserati", 
    "Mazda", "McLaren", "Mercedes-Benz", "MG", "Mini", "Mitsubishi", "Nissan", "Opel", "Peugeot", "Polestar", 
    "Porsche", "Ram", "Renault", "Rolls-Royce", "Saab", "Seat", "Škoda", "Smart", "SsangYong", "Subaru", "Suzuki", 
    "Tesla", "Toyota", "Vauxhall", "Volkswagen", "Volvo"
].sort();


export const VehicleModal: React.FC<VehicleModalProps> = ({ isOpen, onClose, onSave, customers, initialCustomerId, vehicleToEdit }) => {
  const { t } = useLocalization();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  
  const [isVinLoading, setIsVinLoading] = useState(false);
  const [vinError, setVinError] = useState<string | null>(null);
  const [isRegLoading, setIsRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const [models, setModels] = useState<string[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(false);

  const isEditing = !!vehicleToEdit;

  const clearForm = () => {
    setMake('');
    setModel('');
    setYear('');
    setVin('');
    setLicensePlate('');
    setVinError(null);
    setIsVinLoading(false);
    setRegError(null);
    setIsRegLoading(false);
    setSelectedCustomerId('');
    setModels([]);
    setIsModelsLoading(false);
  };
  
  useEffect(() => {
    if (isOpen) {
        if (vehicleToEdit) {
            setSelectedCustomerId(vehicleToEdit.customerId);
            setMake(vehicleToEdit.make);
            setModel(vehicleToEdit.model);
            setYear(vehicleToEdit.year);
            setVin(vehicleToEdit.vin);
            setLicensePlate(vehicleToEdit.licensePlate);
        } else {
            clearForm();
            setSelectedCustomerId(initialCustomerId || (customers.length > 0 ? customers[0].id : ''));
        }
    }
  }, [isOpen, vehicleToEdit, initialCustomerId, customers]);


  useEffect(() => {
    if (make && year && /^\d{4}$/.test(year)) {
        const fetchModels = async () => {
            setIsModelsLoading(true);
            setModels([]);
            try {
                const response = await getModelsForMakeYear(make, year);
                setModels(response.models);
            } catch (error) {
                console.error("Failed to fetch models:", error);
                setModels([]); // Fallback to text input
            } finally {
                setIsModelsLoading(false);
            }
        };
        fetchModels();
    } else {
        setModels([]); // Clear models if make/year is incomplete
    }
  }, [make, year]);

  const handleVinLookup = async () => {
    if (vin.length !== 17) {
      setVinError(t('vinInvalidLengthError'));
      return;
    }
    setIsVinLoading(true);
    setVinError(null);
    try {
      const vehicleInfo = await getVehicleInfoFromVin(vin);
      if (vehicleInfo && vehicleInfo.make) {
        setMake(vehicleInfo.make);
        setModel(vehicleInfo.model);
        setYear(vehicleInfo.year);
      } else {
        throw new Error("Invalid response from VIN service");
      }
    } catch (error) {
      console.error("VIN lookup failed:", error);
      setVinError(t('vinLookupFailedError'));
    } finally {
      setIsVinLoading(false);
    }
  };

  const handleRegLookup = async () => {
    if (!licensePlate.trim()) return;

    setIsRegLoading(true);
    setRegError(null);
    try {
        const vehicleInfo = await getVehicleInfoFromRegistration(licensePlate);
        if (vehicleInfo && vehicleInfo.make) {
            setMake(vehicleInfo.make);
            setModel(vehicleInfo.model);
            setYear(vehicleInfo.year);
        } else {
            throw new Error("Invalid response from registration service");
        }
    } catch (error) {
        console.error("Registration lookup failed:", error);
        setRegError(t('regLookupFailedError'));
    } finally {
        setIsRegLoading(false);
    }
  };

  const handleSave = () => {
    if (make.trim() && model.trim() && year.trim() && selectedCustomerId) {
      const vehicleDataBase = { make, model, year, vin, licensePlate };
      if (isEditing) {
        const updatedVehicle = { ...vehicleToEdit, ...vehicleDataBase };
        onSave(updatedVehicle, selectedCustomerId);
      } else {
        onSave(vehicleDataBase, selectedCustomerId);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md m-4 transform transition-all animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
             {isEditing 
                ? <PencilSquareIcon className="h-8 w-8 text-brand-blue dark:text-blue-400" /> 
                : <CarIcon className="h-8 w-8 text-brand-blue dark:text-blue-400" />
            }
            <h2 className="ml-3 text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">
                {isEditing ? t('editVehicleModalTitle') : t('addVehicleModalTitle')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-200 hover:text-brand-gray-600 dark:text-brand-gray-400 dark:hover:bg-brand-gray-700 dark:hover:text-brand-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
           <div>
              <label htmlFor="vehicle-customer" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('customerLabel')}</label>
              <div className="relative mt-1">
                  <UsersIcon className="h-5 w-5 text-brand-gray-400 dark:text-brand-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                      id="vehicle-customer"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="pl-10 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm appearance-none disabled:bg-brand-gray-100 dark:disabled:bg-brand-gray-700/50"
                      required
                      disabled={isEditing}
                  >
                      <option value="" disabled>{t('customerPlaceholder')}</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
              </div>
           </div>
           <div>
            <label htmlFor="vehicle-vin" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('vinLabel')}</label>
            <div className="mt-1 flex space-x-2">
                <input 
                  id="vehicle-vin"
                  type="text" 
                  value={vin} 
                  onChange={(e) => {
                    setVin(e.target.value.toUpperCase());
                    if (vinError) setVinError(null);
                  }} 
                  className="block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue placeholder-brand-gray-600 dark:placeholder-brand-gray-500" 
                  placeholder={t('vinPlaceholder')}
                  maxLength={17}
                />
                <button 
                  type="button" 
                  onClick={handleVinLookup}
                  disabled={vin.length !== 17 || isVinLoading}
                  className="px-3 py-2 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={t('lookupVinButton')}
                >
                  {isVinLoading ? <CogIcon className="h-5 w-5 animate-spin"/> : <MagnifyingGlassIcon className="h-5 w-5"/>}
                </button>
            </div>
            {vinError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{vinError}</p>}
          </div>
            <div>
                <label htmlFor="vehicle-year" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('yearLabel')}</label>
                <input id="vehicle-year" type="text" value={year} onChange={(e) => setYear(e.target.value)} disabled={isVinLoading || isRegLoading} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue disabled:bg-brand-gray-100 dark:disabled:bg-brand-gray-600 placeholder-brand-gray-600 dark:placeholder-brand-gray-500" placeholder={t('yearPlaceholder')} required maxLength={4}/>
            </div>
            <div>
                <label htmlFor="vehicle-make" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('makeLabel')}</label>
                <select id="vehicle-make" value={make} onChange={(e) => { setMake(e.target.value); setModel(''); }} disabled={isVinLoading || isRegLoading} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue disabled:bg-brand-gray-100 dark:disabled:bg-brand-gray-600" required>
                    <option value="">{t('makePlaceholder')}</option>
                    {carMakes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="vehicle-model" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('modelLabel')}</label>
                {isModelsLoading ? (
                    <input id="vehicle-model" type="text" value={t('loadingModels')} disabled className="mt-1 block w-full px-3 py-2 bg-brand-gray-100 dark:bg-brand-gray-600 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm" />
                ) : models.length > 0 ? (
                    <select id="vehicle-model" value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" required>
                        <option value="">{t('modelPlaceholder')}</option>
                        {models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                ) : (
                    <input id="vehicle-model" type="text" value={model} onChange={(e) => setModel(e.target.value)} disabled={isVinLoading || isRegLoading} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue disabled:bg-brand-gray-100 dark:disabled:bg-brand-gray-600 placeholder-brand-gray-600 dark:placeholder-brand-gray-500" placeholder={t('modelPlaceholder')} required />
                )}
            </div>
           <div>
            <label htmlFor="vehicle-license" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('licensePlateLabel')}</label>
            <div className="mt-1 flex space-x-2">
                <input 
                  id="vehicle-license" 
                  type="text" 
                  value={licensePlate} 
                  onChange={(e) => {
                    setLicensePlate(e.target.value.toUpperCase());
                    if (regError) setRegError(null);
                  }} 
                  className="block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue placeholder-brand-gray-600 dark:placeholder-brand-gray-500" 
                  placeholder={t('licensePlatePlaceholder')} 
                />
                <button 
                  type="button" 
                  onClick={handleRegLookup}
                  disabled={!licensePlate.trim() || isRegLoading}
                  className="px-3 py-2 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={t('lookupRegButton')}
                >
                  {isRegLoading ? <CogIcon className="h-5 w-5 animate-spin"/> : <MagnifyingGlassIcon className="h-5 w-5"/>}
                </button>
            </div>
            {regError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{regError}</p>}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 transition-colors">
                {t('cancelButton')}
            </button>
            <button type="button" onClick={handleSave} disabled={!make.trim() || !model.trim() || !year.trim() || isVinLoading || isRegLoading || isModelsLoading || !selectedCustomerId} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark disabled:bg-brand-gray-400 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed transition-colors">
                {t('saveVehicleButton')}
            </button>
        </div>
      </div>
    </div>
  );
};