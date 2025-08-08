

import React, { useState, useEffect, useRef } from 'react';
import { Cog6ToothIcon, CheckCircleIcon, PhotoIcon, CloudArrowUpIcon, XMarkIcon, PlusIcon, WrenchScrewdriverIcon } from '../Icon';
import type { ShopSettings, MaintenanceSchedule } from '../types';
import { useLocalization } from '../services/localization';

interface SettingsViewProps {
  initialSettings: ShopSettings;
  onSave: (newSettings: ShopSettings) => Promise<void>;
  maintenanceSchedules: MaintenanceSchedule[];
  onAddMaintSchedule: () => void;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const SettingsView: React.FC<SettingsViewProps> = ({ initialSettings, onSave, maintenanceSchedules, onAddMaintSchedule }) => {
  const { t } = useLocalization();
  const [settings, setSettings] = useState(initialSettings);
  const [taxRateString, setTaxRateString] = useState((initialSettings.taxRate * 100).toString());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(initialSettings);
    setTaxRateString((initialSettings.taxRate * 100).toString());
  }, [initialSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
        ...prev,
        operatingHours: {
            ...prev.operatingHours,
            [name]: value
        }
    }));
  };
  
  const handleDaysChange = (day: string) => {
    setSettings(prev => {
        const newDaysOpen = prev.daysOpen.includes(day)
            ? prev.daysOpen.filter(d => d !== day)
            : [...prev.daysOpen, day];
        return { ...prev, daysOpen: newDaysOpen };
    });
  };
  
  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaxRateString(e.target.value);
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logoDataUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeLogo = () => {
    setSettings(prev => ({ ...prev, logoDataUrl: ''}));
    if (logoInputRef.current) {
        logoInputRef.current.value = '';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    
    const parsedTaxRate = parseFloat(taxRateString) / 100;
    const settingsToSave = {
        ...settings,
        taxRate: isNaN(parsedTaxRate) ? 0 : parsedTaxRate,
        laborRate: Number(settings.laborRate)
    };

    await onSave(settingsToSave);

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3 seconds
  };
  
  const inputStyle = "mt-1 block w-full bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white placeholder-brand-gray-600 dark:placeholder-brand-gray-400 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm px-3 py-2";

  return (
    <div className="animate-fade-in flex flex-col h-full">
        <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-6">{t('settingsTitle')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
            {/* Shop Information */}
            <div className="bg-white dark:bg-brand-gray-800/50 border border-brand-gray-200 dark:border-brand-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-brand-gray-100 mb-4">{t('shopInfoSectionTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="md:col-span-2">
                        <label htmlFor="shopName" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('shopNameLabel')}</label>
                        <input type="text" name="shopName" id="shopName" value={settings.shopName} onChange={handleChange} className={inputStyle} />
                    </div>
                     <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('shopAddressLabel')}</label>
                        <input type="text" name="address" id="address" value={settings.address} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('shopPhoneLabel')}</label>
                        <input type="text" name="phone" id="phone" value={settings.phone} onChange={handleChange} className={inputStyle} />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('shopEmailLabel')}</label>
                        <input type="email" name="email" id="email" value={settings.email} onChange={handleChange} className={inputStyle} />
                    </div>
                     <div className="md:col-span-2">
                        <label htmlFor="website" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('shopWebsiteLabel')}</label>
                        <input type="text" name="website" id="website" value={settings.website} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('shopLogoLabel')}</label>
                        <div className="mt-2 flex items-center gap-4">
                            {settings.logoDataUrl ? (
                                <div className='relative'>
                                    <img src={settings.logoDataUrl} alt="Logo Preview" className="h-20 w-auto bg-brand-gray-100 dark:bg-brand-gray-700 p-1 rounded-md border border-brand-gray-300 dark:border-brand-gray-600" />
                                    <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600">
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="h-20 w-20 flex items-center justify-center rounded-md border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-600">
                                    <PhotoIcon className="h-8 w-8 text-brand-gray-400" />
                                </div>
                            )}
                            <div>
                                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/png, image/jpeg" className="hidden"/>
                                <button type="button" onClick={() => logoInputRef.current?.click()} className="inline-flex items-center px-4 py-2 border border-brand-gray-300 dark:border-brand-gray-600 text-sm font-medium rounded-md shadow-sm text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-50 dark:hover:bg-brand-gray-600">
                                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                                    {t('uploadLogoButton')}
                                </button>
                                <p className="mt-1 text-xs text-brand-gray-500 dark:text-brand-gray-400">{t('uploadLogoDesc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Operational Settings */}
            <div className="bg-white dark:bg-brand-gray-800/50 border border-brand-gray-200 dark:border-brand-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-brand-gray-100 mb-4">{t('operationalSettingsSectionTitle')}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('daysOpenLabel')}</label>
                        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                            {WEEKDAYS.map(day => (
                                <button
                                    type="button"
                                    key={day}
                                    onClick={() => handleDaysChange(day)}
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${settings.daysOpen.includes(day) ? 'bg-brand-blue text-white shadow' : 'bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 border border-brand-gray-300 dark:border-brand-gray-600'}`}
                                >
                                    {t(`day${day}` as any)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('operatingHoursLabel')}</label>
                           <div className="mt-1 flex items-center gap-2">
                               <input type="time" name="start" value={settings.operatingHours.start} onChange={handleHoursChange} className={inputStyle}/>
                               <span>-</span>
                               <input type="time" name="end" value={settings.operatingHours.end} onChange={handleHoursChange} className={inputStyle}/>
                           </div>
                        </div>
                        <div>
                           <label htmlFor="numberOfBays" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('numberOfBaysLabel')}</label>
                           <input type="number" name="numberOfBays" id="numberOfBays" value={settings.numberOfBays} onChange={handleChange} min="1" className={inputStyle} />
                           <p className="mt-1 text-xs text-brand-gray-500 dark:text-brand-gray-400">{t('baysDesc')}</p>
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-brand-gray-200 dark:border-brand-gray-700">
                        <label htmlFor="vehicleApiUrl" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('vehicleApiUrlLabel')}</label>
                        <input
                            type="url"
                            name="vehicleApiUrl"
                            id="vehicleApiUrl"
                            value={settings.vehicleApiUrl || ''}
                            onChange={handleChange}
                            className={inputStyle}
                            placeholder="e.g. https://api.example.com/vehicle"
                        />
                         <p className="mt-1 text-xs text-brand-gray-500 dark:text-brand-gray-400">{t('vehicleApiUrlDesc')}</p>
                    </div>
                </div>
            </div>

            {/* Financial Settings */}
            <div className="bg-white dark:bg-brand-gray-800/50 border border-brand-gray-200 dark:border-brand-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-brand-gray-100 mb-4">{t('financialSettingsSectionTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label htmlFor="taxRate" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('taxRateLabel')}</label>
                        <div className="relative mt-1">
                            <input
                                type="text"
                                name="taxRate"
                                id="taxRate"
                                value={taxRateString}
                                onChange={handleTaxChange}
                                className={`w-full pr-12 ${inputStyle}`}
                                placeholder='20'
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-brand-gray-500 sm:text-sm">%</span>
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-brand-gray-500 dark:text-brand-gray-400">{t('taxRateDesc')}</p>
                    </div>
                    <div>
                        <label htmlFor="laborRate" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('laborRateLabel')}</label>
                        <input
                            type="number"
                            name="laborRate"
                            id="laborRate"
                            value={settings.laborRate}
                            onChange={handleChange}
                            className={inputStyle}
                            placeholder='100'
                            min="0"
                        />
                        <p className="mt-1 text-xs text-brand-gray-500 dark:text-brand-gray-400">{t('laborRateDesc')}</p>
                    </div>
                </div>
            </div>

             {/* Maintenance Schedules */}
            <div className="bg-white dark:bg-brand-gray-800/50 border border-brand-gray-200 dark:border-brand-gray-700 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-brand-gray-100">{t('maintSchedulesTitle')}</h3>
                  <button type="button" onClick={onAddMaintSchedule} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue-dark">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      {t('addMaintScheduleButton')}
                  </button>
                </div>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mb-4">{t('maintSchedulesDesc')}</p>
                <div className="space-y-2">
                    {maintenanceSchedules.map(schedule => (
                        <div key={schedule.id} className="p-3 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-md flex justify-between items-center">
                            <div className="flex items-center">
                                <WrenchScrewdriverIcon className="h-5 w-5 text-brand-gray-500 mr-3"/>
                                <div>
                                    <p className="font-semibold">{schedule.name}</p>
                                    <p className="text-xs text-brand-gray-500">
                                        {schedule.intervalMiles && `${schedule.intervalMiles} mi`}
                                        {schedule.intervalMiles && schedule.intervalMonths && ' / '}
                                        {schedule.intervalMonths && `${schedule.intervalMonths} mo`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {maintenanceSchedules.length === 0 && <p className="text-center text-sm text-brand-gray-500 py-4">{t('noMaintSchedules')}</p>}
                </div>
            </div>

            <div className="flex justify-end items-center gap-4">
                {saveSuccess && (
                     <div className="flex items-center text-green-600 dark:text-green-400 animate-fade-in" role="alert">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">{t('saveSettingsSuccess')}</span>
                    </div>
                )}
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex justify-center items-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-brand-gray-400 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? <Cog6ToothIcon className="animate-spin h-5 w-5" /> : t('saveSettingsButton')}
                </button>
            </div>
        </form>
    </div>
  );
};