import React, { useMemo } from 'react';
import type { HydratedQuote, HydratedAppointment, QuoteStatus } from '../types';
import { useLocalization } from '../services/localization';
import { StatCard } from './StatCard';
import { LineChart } from './LineChart';
import { PieChart } from './PieChart';
import { CurrencyDollarIcon, CalendarDaysIcon, CheckBadgeIcon, ArchiveBoxIcon, ClockIcon, CarIcon, BanknotesIcon } from '../Icon';

interface DashboardViewProps {
  quotes: HydratedQuote[];
  appointments: HydratedAppointment[];
  onSelectQuote: (id: string) => void;
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

export const DashboardView: React.FC<DashboardViewProps> = ({ quotes, appointments, onSelectQuote }) => {
    const { t, formatCurrency } = useLocalization();

    const stats = useMemo(() => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const dailyMetrics: { income: number[], bookings: number[], completed: number[] } = {
            income: Array(7).fill(0),
            bookings: Array(7).fill(0),
            completed: Array(7).fill(0),
        };

        let currentWeekIncome = 0;
        let prevWeekIncome = 0;
        let currentWeekBookings = 0;
        let prevWeekBookings = 0;
        let currentWeekCompleted = 0;
        let prevWeekCompleted = 0;

        quotes.forEach(q => {
            q.payments?.forEach(p => {
                const paymentDate = new Date(p.date);
                if (paymentDate >= sevenDaysAgo) {
                    currentWeekIncome += p.amount;
                    const dayIndex = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 3600 * 24));
                    if (dayIndex < 7) dailyMetrics.income[6 - dayIndex] += p.amount;
                } else if (paymentDate >= fourteenDaysAgo) {
                    prevWeekIncome += p.amount;
                }
            });

            if (q.completionDate) {
                const completionDate = new Date(q.completionDate);
                 if (completionDate >= sevenDaysAgo) {
                    currentWeekCompleted++;
                    const dayIndex = Math.floor((now.getTime() - completionDate.getTime()) / (1000 * 3600 * 24));
                    if (dayIndex < 7) dailyMetrics.completed[6 - dayIndex]++;
                } else if (completionDate >= fourteenDaysAgo) {
                    prevWeekCompleted++;
                }
            }
        });

        appointments.forEach(a => {
            const apptDate = new Date(a.dateTime);
             if (apptDate >= sevenDaysAgo) {
                currentWeekBookings++;
                const dayIndex = Math.floor((now.getTime() - apptDate.getTime()) / (1000 * 3600 * 24));
                if (dayIndex < 7) dailyMetrics.bookings[6 - dayIndex]++;
            } else if (apptDate >= fourteenDaysAgo) {
                prevWeekBookings++;
            }
        });

        const calculateChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        return {
            netIncome: { value: currentWeekIncome, change: calculateChange(currentWeekIncome, prevWeekIncome), daily: dailyMetrics.income },
            totalBookings: { value: currentWeekBookings, change: calculateChange(currentWeekBookings, prevWeekBookings), daily: dailyMetrics.bookings },
            resolvedIssues: { value: currentWeekCompleted, change: calculateChange(currentWeekCompleted, prevWeekCompleted), daily: dailyMetrics.completed },
        };
    }, [quotes, appointments]);

    const monthlySalesData = useMemo(() => {
        const data = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return { name: d.toLocaleString('default', { month: 'short' }), value: 0 };
        }).reverse();

        quotes.forEach(quote => {
            quote.payments?.forEach(p => {
                const paymentDate = new Date(p.date);
                const monthDiff = (new Date().getFullYear() - paymentDate.getFullYear()) * 12 + (new Date().getMonth() - paymentDate.getMonth());
                if (monthDiff >= 0 && monthDiff < 7) {
                    const monthIndex = 6 - monthDiff;
                    data[monthIndex].value += p.amount;
                }
            });
        });
        return data;
    }, [quotes]);
    
    const jobStatusData = useMemo(() => {
        const statusCounts = quotes.reduce((acc, quote) => {
            acc[quote.status] = (acc[quote.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return [
            { name: t('statusWorkInProgress'), value: statusCounts['Work In Progress'] || 0, color: '#3b82f6' },
            { name: t('statusReadyForPickup'), value: statusCounts['Ready for Pickup'] || 0, color: '#6366f1' },
            { name: t('statusCompleted'), value: statusCounts['Completed'] || 0, color: '#16a34a' },
            { name: t('statusPaid'), value: statusCounts['Paid'] || 0, color: '#9333ea' },
        ].filter(d => d.value > 0);
    }, [quotes, t]);
    
    const recentQuotes = useMemo(() => {
        return quotes.slice(0, 5);
    }, [quotes]);

    const formatChange = (change: number) => {
        if (change === 0 || !isFinite(change)) return `0% ${t('fromLastWeek')}`;
        return `${change > 0 ? '+' : ''}${change.toFixed(1)}% ${t('fromLastWeek')}`;
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title={t('netIncomeStat')} 
                    value={formatCurrency(stats.netIncome.value)}
                    icon={<div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full"><CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400"/></div>}
                    change={formatChange(stats.netIncome.change)}
                    changeType={stats.netIncome.change > 0 ? 'increase' : 'decrease'}
                    chartData={stats.netIncome.daily}
                />
                 <StatCard 
                    title={t('totalBookingsStat')} 
                    value={stats.totalBookings.value.toString()}
                    icon={<div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full"><CalendarDaysIcon className="h-6 w-6 text-blue-600 dark:text-blue-400"/></div>}
                    change={formatChange(stats.totalBookings.change)}
                    changeType={stats.totalBookings.change > 0 ? 'increase' : 'decrease'}
                    chartData={stats.totalBookings.daily}
                />
                 <StatCard 
                    title={t('resolvedIssuesStat')} 
                    value={stats.resolvedIssues.value.toString()}
                    icon={<div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full"><CheckBadgeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400"/></div>}
                    change={formatChange(stats.resolvedIssues.change)}
                    changeType={stats.resolvedIssues.change > 0 ? 'increase' : 'decrease'}
                    chartData={stats.resolvedIssues.daily}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-sm border border-brand-gray-200 dark:border-brand-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-brand-gray-800 dark:text-brand-gray-100">{t('overallSalesChartTitle')}</h3>
                    <LineChart data={monthlySalesData} />
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-sm border border-brand-gray-200 dark:border-brand-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-brand-gray-800 dark:text-brand-gray-100">{t('jobStatusChartTitle')}</h3>
                    <PieChart data={jobStatusData} />
                </div>
            </div>

            <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-sm border border-brand-gray-200 dark:border-brand-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-brand-gray-800 dark:text-brand-gray-100">{t('recentJobsTitle')}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className='border-b border-brand-gray-200 dark:border-brand-gray-700'>
                            <tr>
                                <th className="p-3 text-xs font-semibold text-brand-gray-500 dark:text-brand-gray-400 uppercase tracking-wider">{t('customer')}</th>
                                <th className="p-3 text-xs font-semibold text-brand-gray-500 dark:text-brand-gray-400 uppercase tracking-wider">{t('jobStatus')}</th>
                                <th className="p-3 text-xs font-semibold text-brand-gray-500 dark:text-brand-gray-400 uppercase tracking-wider text-right">{t('price')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentQuotes.map(quote => (
                                <tr key={quote.id} onClick={() => onSelectQuote(quote.id)} className='hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50 cursor-pointer'>
                                    <td className="p-3">
                                        <p className='font-medium text-sm text-brand-gray-900 dark:text-brand-gray-100'>{quote.customerName}</p>
                                        <p className='text-xs text-brand-gray-500 dark:text-brand-gray-400'>{quote.vehicle}</p>
                                    </td>
                                    <td className="p-3"><StatusIndicator status={quote.status} /></td>
                                    <td className="p-3 text-right font-semibold text-sm text-brand-gray-700 dark:text-brand-gray-300">{formatCurrency(quote.totalCost)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
