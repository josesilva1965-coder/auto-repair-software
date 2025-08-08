import React, { useState, useMemo } from 'react';
import type { HydratedQuote, QuoteStatus } from '../types';
import { ArchiveBoxIcon, ClockIcon, CheckBadgeIcon, CalendarDaysIcon, BanknotesIcon, CubeIcon, CarIcon, ClipboardDocumentCheckIcon, UserGroupIcon, WrenchScrewdriverIcon } from '../Icon';
import { useLocalization } from '../services/localization';

interface JobsViewProps {
  quotes: HydratedQuote[];
  onSelectQuote: (id: string) => void;
  onUpdateQuoteStatus: (id: string, status: QuoteStatus) => void;
}

const JobCard: React.FC<{ quote: HydratedQuote, onSelect: () => void }> = ({ quote, onSelect }) => {
    const { t, formatCurrency, formatShortDateTime } = useLocalization();
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("quoteId", quote.id);
    };

    const completionDate = useMemo(() => {
        if (quote.appointmentDate && quote.estimatedDurationHours) {
            const startDate = new Date(quote.appointmentDate);
            startDate.setHours(startDate.getHours() + quote.estimatedDurationHours);
            return startDate;
        }
        return null;
    }, [quote.appointmentDate, quote.estimatedDurationHours]);

    const dueDateColor = useMemo(() => {
        if (!completionDate) return 'text-brand-gray-500 dark:text-brand-gray-400';
        const now = new Date();
        const timeDiff = completionDate.getTime() - now.getTime();
        if (timeDiff < 0) return 'text-red-500 dark:text-red-400 font-semibold';
        if (timeDiff < 24 * 60 * 60 * 1000) return 'text-orange-500 dark:text-orange-400';
        return 'text-brand-gray-500 dark:text-brand-gray-400';
    }, [completionDate]);


    return (
        <div 
            draggable 
            onDragStart={handleDragStart}
            onClick={onSelect}
            className="p-3 border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-brand-gray-900/50 hover:border-brand-blue dark:hover:border-blue-500 transition-all cursor-pointer group bg-white dark:bg-brand-gray-800"
        >
            <p className="font-bold text-sm text-brand-gray-800 dark:text-brand-gray-100 truncate">{quote.vehicle}</p>
            <p className="text-xs text-brand-gray-600 dark:text-brand-gray-400 truncate">{quote.customerName}</p>
            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-500 mt-1 truncate">{quote.services[0].name}</p>
            
            {completionDate && (
                <div className={`mt-2 flex items-center text-xs ${dueDateColor}`}>
                    <CalendarDaysIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    <span className='truncate'>{t('jobDueLabel')} {formatShortDateTime(completionDate.toISOString())}</span>
                </div>
            )}

            <div className="flex justify-between items-center mt-2">
                <p className="text-sm font-semibold text-brand-blue dark:text-blue-400">{formatCurrency(quote.totalCost)}</p>
                {quote.technicianName && (
                    <div title={quote.technicianName} className="flex items-center text-xs p-1 rounded-full bg-brand-gray-100 dark:bg-brand-gray-700">
                        <UserGroupIcon className="h-4 w-4 text-purple-600 dark:text-purple-400"/>
                    </div>
                )}
            </div>
        </div>
    );
};

const JobColumn: React.FC<{ status: QuoteStatus, quotes: HydratedQuote[], onSelectQuote: (id: string) => void, onDrop: (quoteId: string, newStatus: QuoteStatus) => void }> = ({ status, quotes, onSelectQuote, onDrop }) => {
    const { t } = useLocalization();
    const [isOver, setIsOver] = useState(false);

    const statusConfig: Record<QuoteStatus, { text: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; bg: string; iconColor: string; }> = {
        'Saved': { text: t('statusSaved'), icon: ArchiveBoxIcon, bg: 'bg-gray-50 dark:bg-gray-900/30', iconColor: 'text-gray-500' },
        'Approved': { text: t('statusApproved'), icon: ClipboardDocumentCheckIcon, bg: 'bg-cyan-50 dark:bg-cyan-900/30', iconColor: 'text-cyan-500' },
        'Work In Progress': { text: t('statusWorkInProgress'), icon: ClockIcon, bg: 'bg-blue-50 dark:bg-blue-900/30', iconColor: 'text-blue-500 dark:text-blue-400' },
        'Awaiting Parts': { text: t('statusAwaitingParts'), icon: CubeIcon, bg: 'bg-orange-50 dark:bg-orange-900/30', iconColor: 'text-orange-500 dark:text-orange-400' },
        'Ready for Pickup': { text: t('statusReadyForPickup'), icon: CarIcon, bg: 'bg-indigo-50 dark:bg-indigo-900/30', iconColor: 'text-indigo-500 dark:text-indigo-400' },
        'Completed': { text: t('statusCompleted'), icon: CheckBadgeIcon, bg: 'bg-green-50 dark:bg-green-900/30', iconColor: 'text-green-500' },
        'Paid': { text: t('statusPaid'), icon: BanknotesIcon, bg: 'bg-purple-50 dark:bg-purple-900/30', iconColor: 'text-purple-500' },
    };
    const config = statusConfig[status];
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        setIsOver(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const quoteId = e.dataTransfer.getData("quoteId");
        onDrop(quoteId, status);
        setIsOver(false);
    };

    const Icon = config.icon;

    return (
        <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 min-w-[220px] rounded-lg p-3 transition-colors ${config.bg} ${isOver ? 'bg-brand-blue/20 dark:bg-blue-500/20' : ''}`}
        >
            <div className="flex items-center mb-4">
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
                <h3 className="ml-2 font-semibold text-sm uppercase tracking-wider">{config.text}</h3>
                <span className="ml-auto text-xs font-bold bg-white/60 dark:bg-black/20 rounded-full h-5 w-5 flex items-center justify-center">{quotes.length}</span>
            </div>
            <div className="space-y-3 h-full overflow-y-auto">
                {quotes.map(q => <JobCard key={q.id} quote={q} onSelect={() => onSelectQuote(q.id)} />)}
            </div>
        </div>
    );
};


export const JobsView: React.FC<JobsViewProps> = ({ quotes, onSelectQuote, onUpdateQuoteStatus }) => {
  const { t } = useLocalization();
  const jobStatuses: QuoteStatus[] = ['Work In Progress', 'Awaiting Parts', 'Ready for Pickup'];

  const filteredQuotes = (status: QuoteStatus) => quotes.filter(q => q.status === status);

  if (quotes.length === 0) {
     return (
      <div className="text-center text-brand-gray-500 dark:text-brand-gray-400 h-full flex flex-col justify-center items-center animate-fade-in">
        <WrenchScrewdriverIcon className="h-16 w-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-brand-gray-700 dark:text-brand-gray-200">{t('jobsViewEmptyTitle')}</h2>
        <p className="mt-2 max-w-md">{t('jobsViewEmptyDesc')}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-full">
      <div className="flex space-x-4 h-full overflow-x-auto pb-4">
        {jobStatuses.map(status => (
            <JobColumn 
                key={status}
                status={status}
                quotes={filteredQuotes(status)}
                onSelectQuote={onSelectQuote}
                onDrop={onUpdateQuoteStatus}
            />
        ))}
      </div>
    </div>
  );
};