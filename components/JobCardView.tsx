
import React from 'react';
import type { JobCardData, InventoryPart } from '../types';
import { PrinterIcon, XMarkIcon, UserIcon, CarIcon, CalendarDaysIcon, UserGroupIcon, NoteIcon, KeyIcon, IdentificationIcon, WrenchScrewdriverIcon } from '../Icon';
import { useLocalization } from '../services/localization';

interface JobCardViewProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard: JobCardData | null;
  inventoryParts: InventoryPart[];
}

export const JobCardView: React.FC<JobCardViewProps> = ({ isOpen, onClose, jobCard, inventoryParts }) => {
  const { t, formatAppointmentDate, formatDate } = useLocalization();

  if (!isOpen || !jobCard) {
    return null;
  }

  const allParts = jobCard.services.flatMap(service =>
    service.parts.map(part => {
      const inventoryItem = inventoryParts.find(p => p.id === part.inventoryPartId);
      return { ...part, sku: inventoryItem?.sku || 'N/A' };
    })
  );

  return (
    <div className="fixed inset-0 bg-brand-gray-100 dark:bg-brand-gray-900 z-50 overflow-y-auto animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-brand-gray-200 dark:bg-brand-gray-800 p-4 sticky top-0 z-10 flex justify-center items-center print:hidden">
        <div className="flex-1"></div>
        <div className="flex-1 flex justify-center space-x-4">
          <button
            onClick={() => window.print()}
            className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-lg shadow-md hover:bg-brand-blue-dark transition-colors"
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            {t('printButton')}
          </button>
          <button
            onClick={onClose}
            className="flex items-center px-4 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 rounded-lg shadow-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 mr-2" />
            {t('closeButton')}
          </button>
        </div>
        <div className="flex-1"></div>
      </div>
      <div className="p-4 md:p-8 flex justify-center">
        <div id="printable-area" className="w-full max-w-4xl bg-white shadow-2xl p-8 print:shadow-none print:p-0 print:m-0 print:text-black">
          {/* Header */}
          <header className="flex justify-between items-start pb-6 border-b-2 border-brand-gray-800">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-800">{t('jobCardTitle')}</h1>
              <p className="text-md text-brand-gray-600 mt-2">{t('jobCardNumberLabel')} <span className="font-semibold text-brand-gray-800">#{jobCard.id}</span></p>
            </div>
            <div className="text-right">
                <p className="text-md text-brand-gray-600">{t('dateLabel')}: <span className="font-semibold text-brand-gray-800">{formatDate(new Date().toISOString())}</span></p>
            </div>
          </header>

          {/* Details Section */}
          <section className="grid grid-cols-2 gap-6 my-6">
            <div className="space-y-4">
                <InfoItem icon={<UserIcon className="h-5 w-5"/>} label={t('customerLabel')} value={jobCard.customer.name} />
                <InfoItem icon={<CarIcon className="h-5 w-5"/>} label={t('vehicleLabel')} value={`${jobCard.vehicleDetails.year} ${jobCard.vehicleDetails.make} ${jobCard.vehicleDetails.model}`} />
                <InfoItem icon={<KeyIcon className="h-5 w-5"/>} label={t('vinLabel')} value={jobCard.vehicleDetails.vin} />
            </div>
            <div className="space-y-4">
                <InfoItem icon={<CalendarDaysIcon className="h-5 w-5"/>} label={t('appointmentInfoCardTitle')} value={jobCard.appointmentDate ? formatAppointmentDate(jobCard.appointmentDate) : t('unassignedLane')} />
                <InfoItem icon={<UserGroupIcon className="h-5 w-5"/>} label={t('technicianInfoCardTitle')} value={jobCard.technicianName || t('unassignedTechnician')} />
                <InfoItem icon={<IdentificationIcon className="h-5 w-5"/>} label={t('licensePlateLabel')} value={jobCard.vehicleDetails.licensePlate} />
            </div>
             <div className="col-span-2">
                <InfoItem icon={<NoteIcon className="h-5 w-5"/>} label={t('notesInfoCardTitle')} value={jobCard.notes} />
             </div>
          </section>
          
           {/* Services List */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-brand-gray-800 border-b border-brand-gray-300 pb-2 mb-4">{t('serviceHistoryTitle')}</h2>
            <div className="space-y-4">
                {jobCard.services.map((service, index) => (
                    <div key={index} className="p-4 border border-brand-gray-200 rounded-lg">
                        <div className="flex items-center text-lg font-semibold text-brand-gray-800">
                           <WrenchScrewdriverIcon className="h-5 w-5 mr-3 text-brand-blue" />
                           {service.name}
                        </div>
                    </div>
                ))}
            </div>
          </section>


          {/* Parts Picking List */}
          <section>
            <h2 className="text-xl font-bold text-brand-gray-800 border-b border-brand-gray-300 pb-2 mb-4">{t('partsPickingListTitle')}</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-gray-100">
                  <th className="p-2 font-semibold text-sm w-1/2">{t('partNameHeader')}</th>
                  <th className="p-2 font-semibold text-sm">{t('skuHeader')}</th>
                  <th className="p-2 font-semibold text-sm text-center">{t('quantityHeader')}</th>
                  <th className="p-2 font-semibold text-sm w-24 text-center">Picked</th>
                </tr>
              </thead>
              <tbody>
                {allParts.map((part, index) => (
                  <tr key={index} className="border-b border-brand-gray-200">
                    <td className="p-2">{part.name}</td>
                    <td className="p-2 text-brand-gray-600">{part.sku}</td>
                    <td className="p-2 text-center font-semibold">{part.quantity}</td>
                    <td className="p-2 text-center">
                        <div className="w-6 h-6 border-2 border-brand-gray-400 rounded-md inline-block"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 text-brand-gray-500 mt-1">{icon}</div>
        <div className="ml-3">
            <p className="text-xs font-semibold uppercase text-brand-gray-500">{label}</p>
            <p className="text-md font-medium text-brand-gray-800">{value}</p>
        </div>
    </div>
);
