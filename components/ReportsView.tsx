

import React, { useState, useMemo } from 'react';
import { StatCard } from './StatCard';
import { BarChart } from '../BarChart';
import { PieChart } from './PieChart';
import { CurrencyDollarIcon, DocumentPlusIcon, CheckBadgeIcon, ArrowTrendingUpIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '../Icon';
import { useLocalization } from '../services/localization';
import type { HydratedQuote } from '../types';

interface ReportsViewProps {
  quotes: HydratedQuote[];
  onBackup: () => void;
  onRestore: () => void;
}

type DateRangePreset = 'all' | 'thisMonth' | 'last30' | 'thisYear' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({ quotes, onBackup, onRestore }) => {
  const { t, formatCurrency } = useLocalization();

  const [preset, setPreset] = useState<DateRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const filteredQuotes = useMemo(() => {
    let startDate: Date | null = null;
    let endDate: Date | null = new Date();
    
    const now = new Date();
    switch (preset) {
        case 'thisMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            break;
        case 'last30':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'thisYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'custom':
            startDate = customStartDate ? new Date(customStartDate) : null;
            endDate = customEndDate ? new Date(customEndDate) : null;
            // To include the whole end day
            if (endDate) endDate.setHours(23, 59, 59, 999);
            break;
        case 'all':
        default:
             return quotes;
    }

    return quotes.filter(q => {
        // We will filter based on when a quote was created (its ID) or when it was paid.
        // For revenue, we filter by payment date. For jobs, by quote creation.
        // For simplicity here, we'll use payment date if available, otherwise creation date from ID.
        const relevantDate = new Date(q.payments?.[0]?.date || (parseInt(q.id.split('-')[1])));
        
        if (startDate && relevantDate < startDate) return false;
        if (endDate && relevantDate > endDate) return false;
        return true;
    });
  }, [quotes, preset, customStartDate, customEndDate]);
  
  const stats = useMemo(() => {
    const totalRevenue = filteredQuotes.reduce((total, quote) => {
        const quoteTotal = quote.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        return total + quoteTotal;
    }, 0);
    const totalQuotes = filteredQuotes.length;
    const jobsCompleted = filteredQuotes.filter(q => q.status === 'Completed' || q.status === 'Paid').length;
    const approvedQuotesCount = filteredQuotes.filter(q => q.status !== 'Saved').length;
    const conversionRate = totalQuotes > 0 ? (approvedQuotesCount / totalQuotes) * 100 : 0;
    const completedOrPaidQuotes = filteredQuotes.filter(q => q.status === 'Completed' || q.status === 'Paid');
    const averageInvoiceValue = completedOrPaidQuotes.length > 0
        ? completedOrPaidQuotes.reduce((sum, q) => sum + q.totalCost, 0) / completedOrPaidQuotes.length
        : 0;
    return { totalRevenue, totalQuotes, jobsCompleted, conversionRate, averageInvoiceValue };
  }, [filteredQuotes]);

  const monthlyRevenueData = useMemo(() => {
    const year = new Date().getFullYear();
    const data = Array.from({ length: 12 }, (_, i) => ({
      name: t(`month${i + 1}`),
      value: 0
    }));

    quotes.forEach(quote => {
        quote.payments?.forEach(payment => {
            const paymentDate = new Date(payment.date);
            if (paymentDate.getFullYear() === year) {
                const monthIndex = paymentDate.getMonth();
                data[monthIndex].value += payment.amount;
            }
        });
    });
    return data;
  }, [quotes, t]);
  
  const jobStatusData = useMemo(() => {
    const statusCounts = filteredQuotes.reduce((acc, quote) => {
        acc[quote.status] = (acc[quote.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return [
        { name: t('statusSaved'), value: statusCounts['Saved'] || 0, color: '#6b7280' },
        { name: t('statusInProgress'), value: statusCounts['Approved'] || 0, color: '#3b82f6' },
        { name: t('statusCompleted'), value: statusCounts['Completed'] || 0, color: '#16a34a' },
        { name: t('statusPaid'), value: statusCounts['Paid'] || 0, color: '#9333ea' },
    ].filter(d => d.value > 0);
  }, [filteredQuotes, t]);
  
  const FilterButton: React.FC<{ value: DateRangePreset; children: React.ReactNode }> = ({ value, children }) => (
    <button
      onClick={() => setPreset(value)}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${preset === value
          ? 'bg-brand-blue text-white shadow'
          : 'bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600'
        }`}
    >{children}</button>
  );

  return (
    <div className="animate-fade-in space-y-12">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{t('reportsTitle')}</h2>
            <div className="flex flex-wrap items-center gap-2">
                <FilterButton value="all">{t('filterAll')}</FilterButton>
                <FilterButton value="thisMonth">{t('filterThisMonth')}</FilterButton>
                <FilterButton value="last30">{t('filterLast30Days')}</FilterButton>
                <FilterButton value="thisYear">{t('filterThisYear')}</FilterButton>
                <FilterButton value="custom">{t('filterCustomRange')}</FilterButton>
            </div>
        </div>
        
        {preset === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-brand-gray-50 dark:bg-brand-gray-900/40 rounded-lg animate-fade-in">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('filterFrom')}</label>
                    <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('filterTo')}</label>
                    <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md" />
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title={t('totalRevenueStat')} value={formatCurrency(stats.totalRevenue)} icon={<CurrencyDollarIcon className="h-8 w-8 text-green-500" />} change="" changeType="neutral" chartData={[]} />
          <StatCard title={t('quotesCreatedStat')} value={stats.totalQuotes.toString()} icon={<DocumentPlusIcon className="h-8 w-8 text-blue-500" />} change="" changeType="neutral" chartData={[]} />
          <StatCard title={t('jobsCompletedStat')} value={stats.jobsCompleted.toString()} icon={<CheckBadgeIcon className="h-8 w-8 text-purple-500" />} change="" changeType="neutral" chartData={[]} />
          <StatCard title={t('conversionRateStat')} value={`${stats.conversionRate.toFixed(1)}%`} icon={<ArrowTrendingUpIcon className="h-8 w-8 text-teal-500" />} change="" changeType="neutral" chartData={[]} />
          <StatCard title={t('avgInvoiceValueStat')} value={formatCurrency(stats.averageInvoiceValue)} icon={<CurrencyDollarIcon className="h-8 w-8 text-indigo-500" />} change="" changeType="neutral" chartData={[]} />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-6">{t('performanceChartsTitle')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
                <h3 className="text-lg font-semibold mb-4">{t('monthlyRevenueChartTitle', {year: new Date().getFullYear()})}</h3>
                <BarChart data={monthlyRevenueData} />
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
                 <h3 className="text-lg font-semibold mb-4">{t('jobStatusChartTitle')}</h3>
                 <PieChart data={jobStatusData} />
            </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-6">{t('dataManagementTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                        <ArrowDownTrayIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-brand-gray-100">{t('backupButton')}</h3>
                        <p className="mt-1 text-sm text-brand-gray-600 dark:text-brand-gray-400">{t('backupDesc')}</p>
                        <button 
                          onClick={onBackup}
                          className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-brand-gray-800 transition-colors"
                        >
                            {t('backupButton')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
                 <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                        <ArrowUpTrayIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-brand-gray-100">{t('restoreButton')}</h3>
                        <p className="mt-1 text-sm text-brand-gray-600 dark:text-brand-gray-400">{t('restoreDesc')}</p>
                         <button 
                          onClick={onRestore}
                          className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 transition-colors"
                        >
                            {t('restoreButton')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};