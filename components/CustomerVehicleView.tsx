
import React, { useState, useMemo } from 'react';
import type { Customer, Vehicle, HydratedQuote, QuoteStatus, Photo, CommunicationLog, MaintenanceSchedule, VehicleMaintenance } from '../types';
import { UserIcon, CarIcon, PlusIcon, IdentificationIcon, KeyIcon, ArchiveBoxIcon, ClockIcon, CheckBadgeIcon, CalendarDaysIcon, BanknotesIcon, CameraIcon, PencilSquareIcon, SparklesIcon, TagIcon, WrenchScrewdriverIcon, EnvelopeIcon, MagnifyingGlassIcon } from '../Icon';
import { useLocalization } from '../services/localization';

interface CustomerVehicleViewProps {
  customers: Customer[];
  vehicles: Vehicle[];
  quotes: HydratedQuote[];
  communicationLogs: CommunicationLog[];
  maintenanceSchedules: MaintenanceSchedule[];
  vehicleMaintenance: VehicleMaintenance[];
  onAddVehicleClick: (customerId: string) => void;
  onSelectQuote: (quoteId: string) => void;
  onAddVehiclePhotos: (vehicleId: string, photos: Photo[]) => void;
  onViewPhoto: (vehicleId: string, photo: Photo) => void;
  onEditCustomer: (customer: Customer) => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onAddVehicleMaint: (maint: Omit<VehicleMaintenance, 'id'>) => void;
  onSendMessage: (customer: Customer) => void;
}

const StatusIcon: React.FC<{status: QuoteStatus}> = ({ status }) => {
    const { t } = useLocalization();
    const statusMap: Record<QuoteStatus, React.ReactNode> = {
        'Saved': <ArchiveBoxIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />,
        'Approved': <ClockIcon className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />,
        'Work In Progress': <ClockIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
        'Awaiting Parts': <ClockIcon className="h-5 w-5 text-orange-500 dark:text-orange-400" />,
        'Ready for Pickup': <CarIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />,
        'Completed': <CheckBadgeIcon className="h-5 w-5 text-green-500 dark:text-green-400" />,
        'Paid': <BanknotesIcon className="h-5 w-5 text-purple-500 dark:text-purple-400" />,
    };
    return <>{statusMap[status]}</>;
}

const resizeImage = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

const AddPhotoButton: React.FC<{ onAddPhotos: (photos: Photo[]) => void }> = ({ onAddPhotos }) => {
    const { t } = useLocalization();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newPhotos: Photo[] = [];
        for (const file of Array.from(files)) {
            try {
                const dataUrl = await resizeImage(file, 800);
                newPhotos.push({ id: `PHOTO-${Date.now()}-${Math.random()}`, dataUrl });
            } catch (error) {
                console.error("Error processing image:", error);
            }
        }
        if (newPhotos.length > 0) {
            onAddPhotos(newPhotos);
        }
    };

    return (
        <>
            <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-3 py-1.5 border border-dashed border-brand-gray-400 dark:border-brand-gray-500 shadow-sm text-sm leading-5 font-medium rounded-md text-brand-gray-600 dark:text-brand-gray-300 bg-transparent hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors"
            >
                <CameraIcon className="h-4 w-4 mr-2" />
                {t('addPhotoButton')}
            </button>
        </>
    );
};


export const CustomerVehicleView: React.FC<CustomerVehicleViewProps> = ({ customers, vehicles, quotes, communicationLogs, maintenanceSchedules, vehicleMaintenance, onAddVehicleClick, onSelectQuote, onAddVehiclePhotos, onViewPhoto, onEditCustomer, onEditVehicle, onAddVehicleMaint, onSendMessage }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeVehicleTab, setActiveVehicleTab] = useState<Record<string, 'history' | 'maintenance' | 'photos'>>({});
  const { t, formatDate } = useLocalization();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) {
      return customers;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return customers.filter(customer => {
      if (
        customer.name.toLowerCase().includes(lowercasedFilter) ||
        customer.email.toLowerCase().includes(lowercasedFilter) ||
        customer.phone.toLowerCase().includes(lowercasedFilter)
      ) {
        return true;
      }
      
      const customerVehicles = vehicles.filter(v => v.customerId === customer.id);
      return customerVehicles.some(vehicle =>
        vehicle.make.toLowerCase().includes(lowercasedFilter) ||
        vehicle.model.toLowerCase().includes(lowercasedFilter) ||
        vehicle.year.toLowerCase().includes(lowercasedFilter) ||
        vehicle.licensePlate.toLowerCase().includes(lowercasedFilter) ||
        vehicle.vin.toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [customers, vehicles, searchTerm]);

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomerId(prevId => (prevId === customerId ? null : customerId));
  };
  
  const getNextDueDate = (lastDate: string, intervalMonths: number) => {
    const nextDueDate = new Date(lastDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + intervalMonths);
    return nextDueDate;
  };

  if (customers.length === 0) {
    return (
      <div className="text-center text-brand-gray-500 dark:text-brand-gray-400 h-full flex flex-col justify-center items-center animate-fade-in">
        <UserIcon className="h-16 w-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-brand-gray-700 dark:text-brand-gray-200">{t('customerViewEmptyTitle')}</h2>
        <p className="mt-2 max-w-md">{t('customerViewEmptyDesc')}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
        <div className="mb-6">
            <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-brand-gray-400 dark:text-brand-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="search"
                    placeholder={t('customerListSearchPlaceholder')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 w-full max-w-md px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm text-sm focus:ring-brand-blue focus:border-brand-blue"
                />
            </div>
        </div>
        {filteredCustomers.length > 0 ? (
            <div className="space-y-4">
            {filteredCustomers.map(customer => {
            const customerVehicles = vehicles.filter(v => v.customerId === customer.id);
            const customerLogs = communicationLogs.filter(log => log.customerIds.includes(customer.id));
            const isSelected = selectedCustomerId === customer.id;

            return (
                <div key={customer.id} className="bg-white dark:bg-brand-gray-800 border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md dark:hover:shadow-brand-gray-900/50">
                <div
                    className="p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleCustomer(customer.id)}
                >
                    <div className="flex items-center min-w-0">
                    <div className="p-2 bg-brand-gray-100 dark:bg-brand-gray-700 rounded-full mr-4">
                        <UserIcon className="h-6 w-6 text-brand-blue dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-brand-gray-800 dark:text-brand-gray-100 truncate">{customer.name}</p>
                        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 truncate">{customer.email} &bull; {customer.phone}</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {(customer.tags || []).map(tag => (
                                <span key={tag} className="inline-flex items-center gap-x-1.5 rounded-full bg-teal-100 dark:bg-teal-900/50 px-2 py-1 text-xs font-medium text-teal-800 dark:text-teal-300">
                                    <TagIcon className="h-3 w-3" />
                                    {tag}
                                </span>
                            ))}
                            <div className="inline-flex items-center gap-x-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-1 text-xs font-medium text-amber-800 dark:text-amber-300">
                                <SparklesIcon className="h-3 w-3" />
                                {customer.loyaltyPoints || 0} {t('pointsLabel')}
                            </div>
                        </div>
                    </div>
                    </div>
                    <div className="flex items-center flex-shrink-0 ml-4 space-x-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onSendMessage(customer); }}
                            className="p-2 rounded-full text-brand-gray-500 bg-brand-gray-100 hover:bg-brand-gray-200 dark:text-brand-gray-400 dark:bg-brand-gray-700 dark:hover:bg-brand-gray-600 transition-colors"
                            title={t('sendMessageButton')}
                            aria-label={t('sendMessageButton')}
                        >
                            <EnvelopeIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEditCustomer(customer); }}
                            className="p-2 rounded-full text-brand-gray-500 bg-brand-gray-100 hover:bg-brand-gray-200 dark:text-brand-gray-400 dark:bg-brand-gray-700 dark:hover:bg-brand-gray-600 transition-colors"
                            title={t('editCustomerLabel')}
                            aria-label={t('editCustomerLabel')}
                        >
                            <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <span className="text-sm bg-brand-blue text-white dark:bg-blue-500/50 dark:text-blue-200 font-semibold rounded-full px-3 py-1">{t('vehiclesCountLabel', { count: customerVehicles.length })}</span>
                        <svg className={`h-5 w-5 text-brand-gray-500 dark:text-brand-gray-400 transform transition-transform ${isSelected ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                {isSelected && (
                    <div className="bg-brand-gray-50 dark:bg-black/20 border-t border-brand-gray-200 dark:border-brand-gray-700 p-4 animate-fade-in-up space-y-4">
                    {customerVehicles.length > 0 ? (
                        customerVehicles.map(vehicle => {
                        const vehicleHistory = quotes.filter(q => q.vehicleId === vehicle.id && q.status === 'Completed' || q.status === 'Paid').sort((a,b) => (a.completionDate && b.completionDate && a.completionDate < b.completionDate ? 1 : -1));
                        const vehicleMaintRecords = vehicleMaintenance.filter(vm => vm.vehicleId === vehicle.id);
                        const tab = activeVehicleTab[vehicle.id] || 'history';
                        return (
                                <div key={vehicle.id} className="p-3 bg-white dark:bg-brand-gray-700/50 rounded-md border border-brand-gray-200 dark:border-brand-gray-600">
                                    <div className='flex items-center justify-between'>
                                        <div className="flex items-center">
                                            <CarIcon className="h-5 w-5 text-brand-gray-600 dark:text-brand-gray-400 mr-3 flex-shrink-0"/>
                                            <div>
                                                <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                                                <div className="flex items-center space-x-4 text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">
                                                    {vehicle.vin && <span className='flex items-center'><KeyIcon className='h-3 w-3 mr-1'/> {vehicle.vin}</span>}
                                                    {vehicle.licensePlate && <span className='flex items-center'><IdentificationIcon className='h-3 w-3 mr-1'/> {vehicle.licensePlate}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditVehicle(vehicle); }}
                                            className="p-1.5 rounded-full text-brand-gray-500 hover:bg-brand-gray-200 dark:text-brand-gray-400 dark:hover:bg-brand-gray-600 transition-colors"
                                            title={t('editButtonLabel')}
                                            aria-label={t('editButtonLabel')}
                                        >
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="mt-3 pl-8">
                                        <div className="border-b border-brand-gray-200 dark:border-brand-gray-600 mb-2">
                                            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                                                <button onClick={() => setActiveVehicleTab(prev => ({...prev, [vehicle.id]: 'history'}))} className={`tab-button ${tab === 'history' ? 'tab-active' : 'tab-inactive'}`}>{t('serviceHistoryTitle')}</button>
                                                <button onClick={() => setActiveVehicleTab(prev => ({...prev, [vehicle.id]: 'maintenance'}))} className={`tab-button ${tab === 'maintenance' ? 'tab-active' : 'tab-inactive'}`}>{t('maintenanceTab')}</button>
                                                <button onClick={() => setActiveVehicleTab(prev => ({...prev, [vehicle.id]: 'photos'}))} className={`tab-button ${tab === 'photos' ? 'tab-active' : 'tab-inactive'}`}>{t('vehiclePhotosTitle')}</button>
                                            </nav>
                                        </div>
                                        {tab === 'history' && (
                                        <div>
                                            {vehicleHistory.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {vehicleHistory.map(q => (
                                                        <li key={q.id} onClick={() => onSelectQuote(q.id)} className="flex items-center justify-between p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600/50 cursor-pointer transition-colors">
                                                            <div className="flex items-center">
                                                                <StatusIcon status={q.status}/>
                                                                <span className="ml-3 text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{q.services[0]?.name || t('generalService')}</span>
                                                            </div>
                                                            <div className="text-xs text-brand-gray-500 dark:text-brand-gray-400 flex items-center">
                                                            <span>{q.completionDate ? formatDate(q.completionDate) : ''} at {q.mileageAtCompletion} mi</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : ( <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-2">{t('noServiceHistory')}</p> )}
                                        </div>
                                        )}
                                        {tab === 'maintenance' && (
                                            <div>
                                                {maintenanceSchedules.map(schedule => {
                                                    const record = vehicleMaintRecords.find(vm => vm.scheduleId === schedule.id);
                                                    const nextDueDate = record && schedule.intervalMonths ? getNextDueDate(record.lastPerformedDate, schedule.intervalMonths) : null;
                                                    const isOverdue = nextDueDate && nextDueDate < new Date();
                                                    return (
                                                        <div key={schedule.id} className="text-sm p-2 rounded-md mb-1 flex justify-between items-center">
                                                            <div>
                                                                <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{schedule.name}</p>
                                                                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{t('lastPerformedLabel')}: {record ? `${formatDate(record.lastPerformedDate)} at ${record.lastPerformedMileage} mi` : t('neverPerformedLabel')}</p>
                                                            </div>
                                                            <div>
                                                                <p className={`font-semibold text-xs ${isOverdue ? 'text-red-500' : 'text-green-600'}`}>
                                                                    {t('nextDueLabel')}: {nextDueDate ? formatDate(nextDueDate.toISOString()) : 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {maintenanceSchedules.length === 0 && <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{t('noMaintSchedulesSetup')}</p>}
                                            </div>
                                        )}
                                        {tab === 'photos' && (
                                        <div>
                                                {(vehicle.photos && vehicle.photos.length > 0) ? (
                                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                                        {(vehicle.photos || []).map(photo => (
                                                            <div key={photo.id} onClick={() => onViewPhoto(vehicle.id, photo)} className="aspect-square bg-brand-gray-200 dark:bg-brand-gray-600 rounded-md overflow-hidden cursor-pointer group relative">
                                                                <img src={photo.dataUrl} alt="Vehicle" className="w-full h-full object-cover"/>
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : ( <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-2">{t('noVehiclePhotos')}</p> )}
                                                <div className="mt-3"> <AddPhotoButton onAddPhotos={(newPhotos) => onAddVehiclePhotos(vehicle.id, newPhotos)} /> </div>
                                        </div>
                                        )}
                                    </div>
                                </div>
                        );
                        })
                    ) : (
                        <p className="text-sm text-center text-brand-gray-500 dark:text-brand-gray-400 py-4">{t('noVehiclesForCustomer')}</p>
                    )}
                    <div className="mt-4 text-center">
                        <button
                        onClick={() => onAddVehicleClick(customer.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-brand-gray-300 dark:border-brand-gray-600 shadow-sm text-sm leading-5 font-medium rounded-md text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-50 dark:hover:bg-brand-gray-600 transition-colors"
                        >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        {t('addVehicleButton')}
                        </button>
                    </div>
                    
                    <div className="mt-4 border-t border-brand-gray-200 dark:border-brand-gray-600 pt-4">
                            <h5 className="text-xs font-semibold text-brand-gray-500 dark:text-brand-gray-400 uppercase tracking-wider">{t('communicationHistoryTitle')}</h5>
                            {customerLogs.length > 0 ? (
                            <ul className="mt-2 space-y-2">
                                    {customerLogs.map(log => (
                                        <li key={log.id} className="p-3 bg-white dark:bg-brand-gray-700/50 rounded-md">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200">{log.subject}</p>
                                                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{formatDate(log.date)}</p>
                                            </div>
                                            <p className="text-sm text-brand-gray-600 dark:text-brand-gray-300 mt-1 whitespace-pre-wrap">{log.message}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-2">{t('noCommunicationHistory')}</p>
                            )}
                    </div>

                    </div>
                )}
                </div>
            );
            })}
            </div>
        ) : (
            <div className="text-center text-brand-gray-500 dark:text-brand-gray-400 py-16">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">{t('noCustomersFoundTitle')}</h3>
                <p className="text-sm">{t('noCustomersFoundDesc')}</p>
            </div>
        )}
      <style>{`
            .tab-button { @apply whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs; }
            .tab-active { @apply border-brand-blue text-brand-blue dark:border-blue-400 dark:text-blue-400; }
            .tab-inactive { @apply border-transparent text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 dark:text-brand-gray-400 dark:hover:text-brand-gray-200 dark:hover:border-brand-gray-500; }
        `}</style>
    </div>
  );
};