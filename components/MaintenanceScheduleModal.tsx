import React, { useState } from 'react';
import { WrenchScrewdriverIcon, XMarkIcon } from '../Icon';
import type { MaintenanceSchedule } from '../types';
import { useLocalization } from '../services/localization';

interface MaintenanceScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleData: Omit<MaintenanceSchedule, 'id'>) => void;
}

export const MaintenanceScheduleModal: React.FC<MaintenanceScheduleModalProps> = ({ isOpen, onClose, onSave }) => {
  const { t } = useLocalization();
  const [name, setName] = useState('');
  const [intervalMiles, setIntervalMiles] = useState<number | ''>('');
  const [intervalMonths, setIntervalMonths] = useState<number | ''>('');

  const clearForm = () => {
    setName('');
    setIntervalMiles('');
    setIntervalMonths('');
  };

  const handleSave = () => {
    if (name.trim()) {
      onSave({ 
        name, 
        intervalMiles: intervalMiles ? Number(intervalMiles) : undefined,
        intervalMonths: intervalMonths ? Number(intervalMonths) : undefined,
      });
      clearForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md m-4 transform transition-all animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <WrenchScrewdriverIcon className="h-8 w-8 text-brand-blue dark:text-blue-400" />
            <h2 className="ml-3 text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{t('maintScheduleModalTitle')}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-200 hover:text-brand-gray-600 dark:text-brand-gray-400 dark:hover:bg-brand-gray-700 dark:hover:text-brand-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="maint-name" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('maintScheduleNameLabel')}</label>
            <input id="maint-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue placeholder-brand-gray-600 dark:placeholder-brand-gray-500" placeholder={t('maintScheduleNamePlaceholder')} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="maint-miles" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('intervalMilesLabel')}</label>
                <input id="maint-miles" type="number" min="0" value={intervalMiles} onChange={(e) => setIntervalMiles(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
            </div>
            <div>
                <label htmlFor="maint-months" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('intervalMonthsLabel')}</label>
                <input id="maint-months" type="number" min="0" value={intervalMonths} onChange={(e) => setIntervalMonths(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 transition-colors">{t('cancelButton')}</button>
            <button type="button" onClick={handleSave} disabled={!name.trim()} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark disabled:bg-brand-gray-400 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed transition-colors">{t('saveScheduleButton')}</button>
        </div>
      </div>
    </div>
  );
};