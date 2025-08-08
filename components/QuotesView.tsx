
import React, { useState, useMemo } from 'react';
import type { HydratedQuote, Customer, Vehicle } from '../types';
import { useLocalization } from '../services/localization';
import { QuoteForm } from './QuoteForm';
import { MagnifyingGlassIcon, ArchiveBoxIcon, ClockIcon, CarIcon, BanknotesIcon, CheckBadgeIcon } from '../Icon';
import { QuoteStatus } from '../types';

interface QuotesViewProps {
  quotes: HydratedQuote[];
  customers: Customer[];
  vehicles: Vehicle[];
  isLoading: boolean;
  onSelectQuote: (id: string) => void;
  onSubmit: (formData: { customerId: string, vehicleId: string }, serviceRequest: string) => void;
  onNewCustomerClick: () => void;
  onNewVehicleClick: (customerId: string) => void;
}

const StatusIndicator: React.FC<{status: QuoteStatus}> = ({ status }) => {
    const statusMap: Record<QuoteStatus, { icon: React.ReactNode; bg: string; text: string; }> = {
        'Saved': { icon: <ArchiveBoxIcon className="h-4 w-4"/>, bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200' },
        'Approved': { icon: <ClockIcon className="h-4 w-4"/>, bg: 'bg-cyan-100 dark:bg-cyan-900/50', text: 'text-cyan-800 dark:text-cyan-200' },
        'Work In Progress': { icon: <ClockIcon className="h-4 w-4"/>, bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-200' },
        'Awaiting Parts': { icon: <ClockIcon className="h-4 w-4"/>, bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-800 dark:text-orange-200' },
        'Ready for Pickup': { icon: <CarIcon className="h-4 w-4"/>, bg: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-800 dark:text-indigo-200' },
        'Completed': { icon: <CheckBadgeIcon className="h-4 w-4"/>, bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200' },
        'Paid': { icon: <BanknotesIcon className="h-4 w-4"/>, bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-200' },
    };
    const config = statusMap[status];
    return <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}>{config.icon}{status}</span>;
}

export const QuotesView: React.FC<QuotesViewProps> = ({ quotes, customers, vehicles, isLoading, onSelectQuote, onSubmit, onNewCustomerClick, onNewVehicleClick }) => {
    const { t, formatCurrency, formatDate } = useLocalization();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredQuotes = useMemo(() => {
        if (!searchTerm) return quotes;
        const lowercasedFilter = searchTerm.toLowerCase();
        return quotes.filter(quote =>
            quote.id.toLowerCase().includes(lowercasedFilter) ||
            quote.customerName.toLowerCase().includes(lowercasedFilter) ||
            quote.vehicle.toLowerCase().includes(lowercasedFilter) ||
            quote.status.toLowerCase().includes(lowercasedFilter)
        );
    }, [quotes, searchTerm]);

    return (
        <div className="animate-fade-in flex flex-col h-full space-y-6">
            <QuoteForm
                onSubmit={onSubmit}
                isLoading={isLoading}
                customers={customers}
                vehicles={vehicles}
                onNewCustomerClick={onNewCustomerClick}
                onNewVehicleClick={onNewVehicleClick}
            />

            <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 flex-grow flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{t('quotesListTitle')}</h3>
                    <div className="relative">
                         <MagnifyingGlassIcon className="h-5 w-5 text-brand-gray-400 dark:text-brand-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                         <input
                            type="text"
                            placeholder={t('searchQuotesPlaceholder')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm text-sm focus:ring-brand-blue focus:border-brand-blue"
                         />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar -mr-6 pr-6">
                    <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                        <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50 sticky top-0">
                            <tr>
                                <th className="p-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">{t('quoteIdLabel')}</th>
                                <th className="p-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">{t('customerLabel')}</th>
                                <th className="p-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">{t('vehicleLabel')}</th>
                                <th className="p-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">{t('jobStatus')}</th>
                                <th className="p-3 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">{t('totalCostLabel')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                            {filteredQuotes.map(quote => (
                                <tr key={quote.id} onClick={() => onSelectQuote(quote.id)} className="hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50 cursor-pointer">
                                    <td className="p-3 whitespace-nowrap text-sm font-semibold text-brand-blue dark:text-blue-400">{quote.id}</td>
                                    <td className="p-3 whitespace-nowrap text-sm font-medium text-brand-gray-900 dark:text-brand-gray-100">{quote.customerName}</td>
                                    <td className="p-3 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">{quote.vehicle}</td>
                                    <td className="p-3 whitespace-nowrap"><StatusIndicator status={quote.status} /></td>
                                    <td className="p-3 whitespace-nowrap text-sm font-semibold text-right text-brand-gray-800 dark:text-brand-gray-200">{formatCurrency(quote.totalCost)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredQuotes.length === 0 && (
                        <p className="text-center py-8 text-sm text-brand-gray-500 dark:text-brand-gray-400">{t('noQuotesFound')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
