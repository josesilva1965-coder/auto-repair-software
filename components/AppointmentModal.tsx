import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CalendarDaysIcon, XMarkIcon, UserIcon, CarIcon } from '../Icon';
import type { HydratedQuote, ShopSettings, Appointment } from '../types';
import { useLocalization } from '../services/localization';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quoteId: string, dateTime: string) => void;
  quote: (HydratedQuote & { initialDate?: string }) | null;
  shopSettings: ShopSettings | null;
  appointments: Appointment[];
  quotes: HydratedQuote[];
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CalendarDropdown: React.FC<{
    selectedDate: string;
    onDateSelect: (date: Date) => void;
    onClose: () => void;
    shopSettings: ShopSettings;
}> = ({ selectedDate, onDateSelect, onClose, shopSettings }) => {
    const { t, language } = useLocalization();
    const [viewDate, setViewDate] = useState(new Date(selectedDate + 'T12:00:00'));
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const leadingBlanks = Array.from({ length: startDayOfWeek });

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedDateObj = new Date(selectedDate + 'T12:00:00');

    return (
        <div ref={calendarRef} className="absolute z-10 mt-2 w-72 bg-white dark:bg-brand-gray-800 rounded-lg shadow-2xl border border-brand-gray-200 dark:border-brand-gray-700 p-3 animate-fade-in">
            <div className="flex justify-between items-center mb-3">
                <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">&lt;</button>
                <span className="font-semibold text-sm">{viewDate.toLocaleString(language, { month: 'long', year: 'numeric' })}</span>
                <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {WEEKDAYS.map(day => <div key={day} className="font-bold text-brand-gray-500">{t(`day${day}` as any)}</div>)}
                {leadingBlanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                {days.map(dayNumber => {
                    const currentDate = new Date(year, month, dayNumber);
                    const dayOfWeek = currentDate.toLocaleString('en-GB', { weekday: 'long' });
                    const isShopOpen = shopSettings.daysOpen.includes(dayOfWeek);
                    const isPast = currentDate < todayStart;
                    const isSelected = currentDate.toDateString() === selectedDateObj.toDateString();
                    const isToday = currentDate.toDateString() === today.toDateString();

                    let classes = "w-8 h-8 flex items-center justify-center rounded-full transition-colors text-sm ";
                    if (isShopOpen && !isPast) {
                        if (isSelected) {
                            classes += "bg-brand-blue text-white font-bold ";
                        } else {
                            classes += "cursor-pointer hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 ";
                            if (isToday) {
                                classes += "border-2 border-brand-blue ";
                            }
                        }
                    } else {
                        classes += "text-brand-gray-400 dark:text-brand-gray-500 cursor-not-allowed line-through ";
                    }

                    return (
                        <button type="button" key={dayNumber} disabled={!isShopOpen || isPast} className={classes} onClick={() => onDateSelect(currentDate)}>
                            {dayNumber}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};


export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSave, quote, shopSettings, appointments, quotes }) => {
  const { t, formatDate } = useLocalization();
  const [date, setDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (isOpen && quote && shopSettings) {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        let proposedDate = quote.initialDate ? new Date(quote.initialDate) : new Date();
        const proposedDateStart = new Date(proposedDate.getFullYear(), proposedDate.getMonth(), proposedDate.getDate());

        // Prevent booking in the past. If a past date is proposed (e.g. via drag-drop), reset to today.
        if (proposedDateStart < todayStart) {
            proposedDate = new Date(); // Reset to today's date and time
        }

        const now = new Date();
        // For new appointments, if it's late in the day, default to tomorrow
        if (!quote.initialDate && proposedDate.toDateString() === now.toDateString() && now.getHours() >= 17) {
            proposedDate.setDate(proposedDate.getDate() + 1);
        }
        
        // Find the next available working day from the proposed date
        let finalDate = new Date(proposedDate);
        let i = 0; // safety break
        while (!shopSettings.daysOpen.includes(finalDate.toLocaleString('en-GB', { weekday: 'long' })) && i < 30) {
            finalDate.setDate(finalDate.getDate() + 1);
            i++;
        }

        setDate(finalDate.toISOString().split('T')[0]);
        setSelectedTime('');
    }
  }, [isOpen, quote, shopSettings]);
  
  const handleDateSelect = (selectedDate: Date) => {
    setDate(selectedDate.toISOString().split('T')[0]);
    setSelectedTime('');
    setIsCalendarOpen(false);
  };

  const availableSlots = useMemo(() => {
    if (!date || !shopSettings || !quote) return { slots: [], shopClosed: true };

    const selectedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = selectedDate.toLocaleString('en-GB', { weekday: 'long' });
    if (!shopSettings.daysOpen.includes(dayOfWeek)) {
      return { slots: [], shopClosed: true };
    }
    
    const { start, end } = shopSettings.operatingHours;
    const shopStartMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const shopEndMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);

    const dayAppointments = appointments
      .filter(app => new Date(app.dateTime).toDateString() === selectedDate.toDateString())
      .map(app => {
        const appQuote = quotes.find(q => q.id === app.quoteId);
        if (!appQuote) return null;
        const startDateTime = new Date(app.dateTime);
        const startMinutes = startDateTime.getHours() * 60 + startDateTime.getMinutes();
        const durationMinutes = appQuote.estimatedDurationHours * 60;
        return { startMinutes, endMinutes: startMinutes + durationMinutes };
      })
      .filter((app): app is NonNullable<typeof app> => !!app);

    const newJobDurationMinutes = quote.estimatedDurationHours * 60;
    const slots = [];
    for (let slotStartMinutes = shopStartMinutes; slotStartMinutes + newJobDurationMinutes <= shopEndMinutes; slotStartMinutes += 15) {
      const slotEndMinutes = slotStartMinutes + newJobDurationMinutes;
      const concurrentJobs = dayAppointments.filter(app => slotStartMinutes < app.endMinutes && slotEndMinutes > app.startMinutes);

      if (concurrentJobs.length < shopSettings.numberOfBays) {
        slots.push({
          time: `${String(Math.floor(slotStartMinutes / 60)).padStart(2, '0')}:${String(slotStartMinutes % 60).padStart(2, '0')}`,
        });
      }
    }
    return { slots, shopClosed: false };
  }, [date, quote, shopSettings, appointments, quotes]);

  const { morningSlots, afternoonSlots } = useMemo(() => {
    if (!availableSlots.slots) return { morningSlots: [], afternoonSlots: [] };
    const morning: {time: string}[] = [];
    const afternoon: {time: string}[] = [];
    availableSlots.slots.forEach(slot => {
        const hour = parseInt(slot.time.split(':')[0]);
        if (hour < 12) {
            morning.push(slot);
        } else {
            afternoon.push(slot);
        }
    });
    return { morningSlots: morning, afternoonSlots: afternoon };
  }, [availableSlots]);


  const handleSave = () => {
    if (quote && date && selectedTime) {
      const dateTime = new Date(`${date}T${selectedTime}`).toISOString();
      onSave(quote.id, dateTime);
      onClose();
    }
  };

  if (!isOpen || !quote || !shopSettings) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl m-4 transform transition-all animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CalendarDaysIcon className="h-8 w-8 text-brand-blue dark:text-blue-400" />
            <h2 className="ml-3 text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{t('appointmentModalTitle')}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-200 hover:text-brand-gray-600 dark:text-brand-gray-400 dark:hover:bg-brand-gray-700 dark:hover:text-brand-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 bg-brand-gray-50 dark:bg-brand-gray-700/50 p-4 rounded-lg">
            <div className='flex items-center'> <UserIcon className='h-5 w-5 text-brand-gray-500 dark:text-brand-gray-400 mr-3'/> <p><span className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{quote.customerName}</span></p> </div>
            <div className='flex items-center'> <CarIcon className='h-5 w-5 text-brand-gray-500 dark:text-brand-gray-400 mr-3'/> <p><span className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{quote.vehicle}</span></p> </div>
            <p className="pl-8 text-sm text-brand-gray-600 dark:text-brand-gray-300">{t('serviceLabel')}: {quote.services[0]?.name || t('generalService')}</p>
        </div>
        
        <div className="mt-6">
            <label htmlFor="appointment-date-button" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('dateLabel')}</label>
            <div className="relative mt-1 w-full md:w-1/2">
                <button
                    id="appointment-date-button"
                    type="button"
                    onClick={() => setIsCalendarOpen(prev => !prev)}
                    className="w-full flex justify-between items-center px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
                >
                    <span>{date ? formatDate(date) : "Select a date"}</span>
                    <CalendarDaysIcon className="h-5 w-5 text-brand-gray-400" />
                </button>
                {isCalendarOpen && (
                    <CalendarDropdown 
                        selectedDate={date} 
                        onDateSelect={handleDateSelect} 
                        onClose={() => setIsCalendarOpen(false)}
                        shopSettings={shopSettings}
                    />
                )}
            </div>
        </div>

        <div className="mt-6">
          <h3 className="text-md font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('availableSlotsTitle')}</h3>
          {availableSlots.shopClosed ? (
              <div className="h-48 flex items-center justify-center bg-brand-gray-50 dark:bg-brand-gray-700/30 rounded-lg text-brand-gray-500 dark:text-brand-gray-400">{t('shopClosed')}</div>
          ) : availableSlots.slots.length > 0 ? (
            <div className="mt-4 space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {morningSlots.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm text-brand-gray-600 dark:text-brand-gray-400 mb-2">{t('morningSlotsLabel')}</h4>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                            {morningSlots.map(slot => (
                            <button
                                key={slot.time}
                                onClick={() => setSelectedTime(slot.time)}
                                className={`py-2 px-1 text-sm rounded-md transition-colors border ${
                                selectedTime === slot.time
                                    ? 'bg-brand-blue text-white border-brand-blue shadow'
                                    : 'bg-white dark:bg-brand-gray-700 border-brand-gray-300 dark:border-brand-gray-600 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600'
                                }`}
                            >
                                {slot.time}
                            </button>
                            ))}
                        </div>
                    </div>
                )}
                {afternoonSlots.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm text-brand-gray-600 dark:text-brand-gray-400 mb-2">{t('afternoonSlotsLabel')}</h4>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                            {afternoonSlots.map(slot => (
                            <button
                                key={slot.time}
                                onClick={() => setSelectedTime(slot.time)}
                                className={`py-2 px-1 text-sm rounded-md transition-colors border ${
                                selectedTime === slot.time
                                    ? 'bg-brand-blue text-white border-brand-blue shadow'
                                    : 'bg-white dark:bg-brand-gray-700 border-brand-gray-300 dark:border-brand-gray-600 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600'
                                }`}
                            >
                                {slot.time}
                            </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-brand-gray-50 dark:bg-brand-gray-700/30 rounded-lg text-brand-gray-500 dark:text-brand-gray-400">{t('noSlotsAvailable')}</div>
          )}
        </div>

        <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 transition-colors"> {t('cancelButton')} </button>
            <button type="button" onClick={handleSave} disabled={!date || !selectedTime} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-brand-gray-400 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed transition-colors"> {t('saveAppointmentButton')} </button>
        </div>
      </div>
    </div>
  );
};