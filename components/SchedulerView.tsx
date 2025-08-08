
import React, { useState, useMemo } from 'react';
import type { HydratedAppointment, HydratedQuote, ShopSettings, Technician } from '../types';
import { CalendarDaysIcon, UserIcon, CarIcon, UserGroupIcon, EnvelopeIcon, DocumentPlusIcon } from '../Icon';
import { useLocalization } from '../services/localization';

interface SchedulerViewProps {
  appointments: HydratedAppointment[];
  quotes: HydratedQuote[];
  technicians: Technician[];
  shopSettings: ShopSettings | null;
  onSelectAppointment: (appointment: HydratedAppointment) => void;
  onRemind: (appointment: HydratedAppointment) => void;
  onScheduleDroppedJob: (quoteId: string, date: string) => void;
  onUpdateAppointmentDate: (appointmentId: string, newDateISO: string) => void;
  onUpdateAppointmentTechnician: (quoteId: string, technicianId: string) => void;
}

const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

const UnscheduledJobCard: React.FC<{ quote: HydratedQuote }> = ({ quote }) => {
    const { t, formatCurrency } = useLocalization();
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("quoteId", quote.id);
    };

    return (
        <div 
            draggable 
            onDragStart={handleDragStart}
            className="p-3 border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg shadow-sm hover:shadow-md dark:hover:shadow-brand-gray-900/50 hover:border-brand-blue dark:hover:border-blue-500 transition-all cursor-grab bg-white dark:bg-brand-gray-800"
        >
            <p className="font-bold text-sm text-brand-gray-800 dark:text-brand-gray-100 truncate" title={quote.vehicle}>{quote.vehicle}</p>
            <p className="text-xs text-brand-gray-600 dark:text-brand-gray-400 truncate">{quote.customerName}</p>
            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-500 mt-1 truncate" title={quote.services[0].name}>{quote.services[0].name}</p>
            <div className="flex justify-between items-center mt-2">
                <p className="text-sm font-semibold text-brand-blue dark:text-blue-400">{formatCurrency(quote.totalCost)}</p>
                {quote.technicianName && (
                    <div title={t('technicianInfoCardTitle') + ': ' + quote.technicianName} className="flex items-center text-xs p-1 rounded-full bg-brand-gray-100 dark:bg-brand-gray-700">
                        <UserGroupIcon className="h-4 w-4 text-purple-600 dark:text-purple-400"/>
                    </div>
                )}
            </div>
        </div>
    );
};

const AppointmentCard: React.FC<{ appointment: HydratedAppointment, onSelectAppointment: (app: HydratedAppointment) => void, onRemind: (app: HydratedAppointment) => void }> = ({ appointment, onSelectAppointment, onRemind }) => {
    const { t, formatTime } = useLocalization();

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("appointmentId", appointment.id);
        e.dataTransfer.setData("quoteId", appointment.quoteId);
    };
    
    return (
        <div 
            draggable
            onDragStart={handleDragStart}
            className="bg-brand-blue/10 dark:bg-blue-500/20 text-brand-blue-800 dark:text-blue-200 p-2 rounded-lg relative transition-colors animate-fade-in-up cursor-grab"
            style={{animationDelay: '50ms'}}
        >
            <div onClick={() => onSelectAppointment(appointment)} className="cursor-pointer pr-7">
                <p className="font-bold text-xs">{formatTime(appointment.dateTime)}</p>
                <p className="text-sm truncate mt-1">{appointment.serviceName}</p>
                <div className='flex items-center text-xs mt-2 opacity-80 truncate'>
                    <UserIcon className='h-3 w-3 mr-1.5 flex-shrink-0'/>
                    <span className='truncate'>{appointment.customerName}</span>
                </div>
                <div className='flex items-center text-xs mt-1 opacity-80 truncate'>
                    <CarIcon className='h-3 w-3 mr-1.5 flex-shrink-0'/>
                    <span className='truncate'>{appointment.vehicle}</span>
                </div>
                {appointment.technicianName && (
                    <div className='flex items-center text-xs mt-1 opacity-80 truncate text-purple-800 dark:text-purple-300'>
                        <UserGroupIcon className='h-3 w-3 mr-1.5 flex-shrink-0'/>
                        <span className='truncate'>{appointment.technicianName}</span>
                    </div>
                )}
            </div>
            <button 
                onClick={() => onRemind(appointment)} 
                title={t('sendReminderButton')}
                className="absolute top-1 right-1 p-1.5 rounded-full text-brand-blue-500 hover:bg-brand-blue/20 transition-all"
            >
                <EnvelopeIcon className="h-4 w-4" />
            </button>
        </div>
    );
};


export const SchedulerView: React.FC<SchedulerViewProps> = ({ appointments, quotes, technicians, shopSettings, onSelectAppointment, onRemind, onScheduleDroppedJob, onUpdateAppointmentDate, onUpdateAppointmentTechnician }) => {
  const { t, formatWeekDate, formatShortWeekday } = useLocalization();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [dragOverCoords, setDragOverCoords] = useState<{techId: string, day: string} | null>(null);
  const [viewMode, setViewMode] = useState<'bay' | 'technician'>('technician');

  const startOfWeek = getStartOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const changeWeek = (amount: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + amount * 7);
        return newDate;
    });
  }

  const isToday = (date: Date) => {
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
  }

  const weekAppointments = useMemo(() => appointments.filter(app => {
      const appDate = new Date(app.dateTime);
      const endOfWeek = new Date(weekDays[6]);
      endOfWeek.setHours(23, 59, 59, 999);
      return appDate >= weekDays[0] && appDate <= endOfWeek;
  }), [appointments, weekDays]);
  
  const unscheduledQuotes = useMemo(() => {
    return quotes.filter(q => q.status === 'Approved' && !q.appointmentId);
  }, [quotes]);
  
  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, HydratedAppointment[]>();
    weekAppointments.forEach(app => {
        const dayStr = new Date(app.dateTime).toDateString();
        if (!map.has(dayStr)) {
            map.set(dayStr, []);
        }
        map.get(dayStr)!.push(app);
    });
    return map;
  }, [weekAppointments]);

  const dailyBayUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    weekDays.forEach(day => {
        const dayStr = day.toDateString();
        const dayAppointments = appointmentsByDay.get(dayStr) || [];
        if (dayAppointments.length === 0) { usage[dayStr] = 0; return; }
        let maxConcurrent = 0;
        const timePoints: { time: number; type: 'start' | 'end' }[] = [];
        dayAppointments.forEach(app => {
            const appQuote = quotes.find(q => q.id === app.quoteId);
            if (!appQuote) return;
            const startTime = new Date(app.dateTime).getTime();
            const endTime = startTime + appQuote.estimatedDurationHours * 60 * 60 * 1000;
            timePoints.push({ time: startTime, type: 'start' });
            timePoints.push({ time: endTime, type: 'end' });
        });
        timePoints.sort((a,b) => a.time - b.time);
        let currentConcurrent = 0;
        for (const point of timePoints) {
            if (point.type === 'start') {
                currentConcurrent++;
                maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
            } else {
                currentConcurrent--;
            }
        }
        usage[dayStr] = maxConcurrent;
    });
    return usage;
  }, [appointmentsByDay, weekDays, quotes]);
  
  const appointmentsByTechnicianAndDay = useMemo(() => {
    const map = new Map<string, HydratedAppointment[]>(); // Key: "techId-dayStr"
    weekAppointments.forEach(app => {
        const dayStr = new Date(app.dateTime).toDateString();
        const techId = app.technicianName ? technicians.find(t => t.name === app.technicianName)?.id || 'unassigned' : 'unassigned';
        const key = `${techId}-${dayStr}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(app);
    });
    return map;
  }, [weekAppointments, technicians]);

  const handleDropOnBayView = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const quoteId = e.dataTransfer.getData("quoteId");
    const appointmentId = e.dataTransfer.getData("appointmentId");
    if (quoteId && !appointmentId) { // Only handle unscheduled jobs here
        onScheduleDroppedJob(quoteId, day.toISOString());
    } else if (appointmentId) {
        onUpdateAppointmentDate(appointmentId, day.toISOString());
    }
    setDragOverDay(null);
  };
  
  const handleDropOnTechnicianDayCell = (e: React.DragEvent, day: Date, technicianId: string) => {
    e.preventDefault();
    const appointmentId = e.dataTransfer.getData("appointmentId");
    const quoteId = e.dataTransfer.getData("quoteId");

    // This handler is for moving existing, scheduled appointments.
    // Dropping unscheduled jobs should only happen on the Bay View.
    if (appointmentId && quoteId) {
        onUpdateAppointmentDate(appointmentId, day.toISOString());
        onUpdateAppointmentTechnician(quoteId, technicianId);
    }
    setDragOverCoords(null);
  };

  return (
    <div className="animate-fade-in flex flex-col h-full">
        <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-xl font-bold text-brand-gray-800 dark:text-brand-gray-100">
                {t('schedulerWeekOf', { date: formatWeekDate(startOfWeek) })}
            </h2>
             <div className="flex items-center gap-4">
                <div className="flex items-center p-1 bg-brand-gray-200 dark:bg-brand-gray-700 rounded-lg">
                    <button onClick={() => setViewMode('bay')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewMode === 'bay' ? 'bg-white dark:bg-brand-gray-800 shadow-sm' : 'text-brand-gray-600 dark:text-brand-gray-400'}`}>{t('bayViewToggle')}</button>
                    <button onClick={() => setViewMode('technician')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewMode === 'technician' ? 'bg-white dark:bg-brand-gray-800 shadow-sm' : 'text-brand-gray-600 dark:text-brand-gray-400'}`}>{t('technicianViewToggle')}</button>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => changeWeek(-1)} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors">{t('prevButton')}</button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 text-sm rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors">{t('todayButton')}</button>
                    <button onClick={() => changeWeek(1)} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors">{t('nextButton')}</button>
                </div>
             </div>
        </div>
        
        {viewMode === 'bay' && (
            <div className="flex flex-grow gap-6 overflow-hidden">
                <div className="w-1/3 max-w-xs flex flex-col">
                    <h3 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4 px-1">{t('unscheduledJobsTitle')}</h3>
                    <div className="flex-grow bg-brand-gray-50 dark:bg-brand-gray-900/40 rounded-lg p-3 overflow-y-auto custom-scrollbar">
                        {unscheduledQuotes.length > 0 ? (
                            <div className="space-y-3">
                                {unscheduledQuotes.map(quote => <UnscheduledJobCard key={quote.id} quote={quote} />)}
                            </div>
                        ) : (
                            <div className="text-center text-brand-gray-500 dark:text-brand-gray-400 py-10">
                                <DocumentPlusIcon className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                                <p className="text-sm">{t('schedulerEmptyDesc')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-grow grid grid-cols-1 md:grid-cols-7 gap-px bg-brand-gray-200 dark:bg-brand-gray-700 border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg overflow-hidden">
                    {weekDays.map(day => {
                        const dayStr = day.toISOString();
                        return (
                            <div key={dayStr} 
                                className={`bg-white dark:bg-brand-gray-800 flex flex-col transition-colors ${dragOverDay === dayStr ? 'bg-brand-blue/10 dark:bg-blue-900/30' : ''}`}
                                onDrop={(e) => handleDropOnBayView(e, day)}
                                onDragOver={(e) => {e.preventDefault(); setDragOverDay(dayStr);}}
                                onDragLeave={() => setDragOverDay(null)}>
                               <div className={`p-2 border-b border-brand-gray-200 dark:border-brand-gray-700 text-center ${isToday(day) ? 'bg-brand-blue text-white' : ''}`}>
                                 <div className="flex justify-between items-center">
                                   <p className="text-sm">{formatShortWeekday(day)}</p>
                                   {shopSettings && <span className="text-xs opacity-70">{t('baysUsedLabel', { used: dailyBayUsage[day.toDateString()] || 0, total: shopSettings.numberOfBays })}</span>}
                                 </div>
                                 <p className="font-bold text-lg">{day.getDate()}</p>
                               </div>
                               <div className="p-2 space-y-2 flex-grow min-h-[100px]">
                                    {dragOverDay === dayStr && <div className="text-center text-xs text-brand-blue dark:text-blue-300 p-4 border-2 border-dashed border-brand-blue/50 rounded-lg">{t('dragJobToSchedule')}</div>}
                                    {(appointmentsByDay.get(day.toDateString()) || []).map(app => (
                                        <AppointmentCard key={app.id} appointment={app} onSelectAppointment={onSelectAppointment} onRemind={onRemind}/>
                                    ))}
                               </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
        
        {viewMode === 'technician' && (
             <div className="flex-grow overflow-y-auto custom-scrollbar">
                <div className="grid" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
                    {/* Header Row */}
                    <div className="sticky top-0 bg-brand-gray-100 dark:bg-brand-gray-800 z-10"></div>
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className={`sticky top-0 p-2 text-center border-b border-l border-brand-gray-200 dark:border-brand-gray-700 ${isToday(day) ? 'bg-brand-blue text-white' : 'bg-brand-gray-50 dark:bg-brand-gray-700/50'}`}>
                            <p className="text-sm">{formatShortWeekday(day)}</p>
                            <p className="font-bold text-lg">{day.getDate()}</p>
                        </div>
                    ))}
                    {/* Unassigned Lane */}
                    <div className="row-span-1 sticky top-16 bg-brand-gray-50 dark:bg-brand-gray-700/50 p-2 flex items-center justify-center border-b border-brand-gray-200 dark:border-brand-gray-700">
                        <p className="font-bold text-sm text-center">{t('unassignedLane')}</p>
                    </div>
                    {weekDays.map(day => {
                        const isDraggedOver = dragOverCoords?.techId === 'unassigned' && dragOverCoords?.day === day.toDateString();
                        return (
                             <div key={day.toISOString()} 
                                 className={`p-2 space-y-2 min-h-[120px] border-b border-l border-brand-gray-200 dark:border-brand-gray-700 transition-colors ${isDraggedOver ? 'bg-brand-blue/10 dark:bg-blue-900/30' : ''}`}
                                 onDrop={(e) => handleDropOnTechnicianDayCell(e, day, 'unassigned')}
                                 onDragOver={(e) => { e.preventDefault(); setDragOverCoords({techId: 'unassigned', day: day.toDateString()}); }}
                                 onDragLeave={() => setDragOverCoords(null)}
                            >
                                {(appointmentsByTechnicianAndDay.get(`unassigned-${day.toDateString()}`) || []).map(app => (
                                    <AppointmentCard key={app.id} appointment={app} onSelectAppointment={onSelectAppointment} onRemind={onRemind}/>
                                ))}
                            </div>
                        );
                    })}
                    {/* Technician Lanes */}
                    {technicians.map(tech => (
                        <React.Fragment key={tech.id}>
                            <div className="row-span-1 p-2 flex items-center justify-center border-b border-brand-gray-200 dark:border-brand-gray-700">
                                <p className="font-semibold text-sm text-center">{tech.name}</p>
                            </div>
                            {weekDays.map(day => {
                                 const isDraggedOver = dragOverCoords?.techId === tech.id && dragOverCoords?.day === day.toDateString();
                                 return (
                                    <div key={day.toISOString()} 
                                         className={`p-2 space-y-2 min-h-[120px] border-b border-l border-brand-gray-200 dark:border-brand-gray-700 transition-colors ${isDraggedOver ? 'bg-brand-blue/10 dark:bg-blue-900/30' : ''}`}
                                         onDrop={(e) => handleDropOnTechnicianDayCell(e, day, tech.id)}
                                         onDragOver={(e) => { e.preventDefault(); setDragOverCoords({techId: tech.id, day: day.toDateString()}); }}
                                         onDragLeave={() => setDragOverCoords(null)}>
                                        {(appointmentsByTechnicianAndDay.get(`${tech.id}-${day.toDateString()}`) || []).map(app => (
                                            <AppointmentCard key={app.id} appointment={app} onSelectAppointment={onSelectAppointment} onRemind={onRemind}/>
                                        ))}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
             </div>
        )}
    </div>
  );
};
