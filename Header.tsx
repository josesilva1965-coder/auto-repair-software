

import React, { useState, useEffect, useRef } from 'react';
import { WrenchScrewdriverIcon, SunIcon, MoonIcon, BellIcon } from './Icon';
import type { UISettings, Language, Notification, CommunicationModalData, Customer, HydratedQuote, HydratedAppointment } from './types';
import { useLocalization, supportedLanguages } from './services/localization';
import { NotificationPopover } from './components/NotificationPopover';


interface HeaderProps {
    settings: UISettings;
    onToggleTheme: () => void;
    shopName?: string;
    logoDataUrl?: string;
    notifications: Notification[];
    onOpenCommunicationModal: (data: CommunicationModalData) => void;
    customers: Customer[];
    hydratedQuotes: HydratedQuote[];
    hydratedAppointments: HydratedAppointment[];
}

export const Header: React.FC<HeaderProps> = ({ settings, onToggleTheme, shopName, logoDataUrl, notifications, onOpenCommunicationModal, customers, hydratedQuotes, hydratedAppointments }) => {
  const { t, language, setLanguage } = useLocalization();
  const [isLangDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);


  const handleSelectNotification = (notification: Notification) => {
        const { customerId, vehicleName } = notification;
        const customer = customers.find(c => c.id === customerId);
        
        if (!customer) {
            setNotificationOpen(false);
            return;
        }

        if (notification.type === 'APPOINTMENT_REMINDER' && notification.appointmentId) {
            const subjectTemplate = t('template_appointmentReminder_subject');
            const messageTemplate = t('template_appointmentReminder_message');
            const appointment = hydratedAppointments.find(a => a.id === notification.appointmentId);
            
            if (subjectTemplate && !subjectTemplate.startsWith('template_') && appointment) {
                onOpenCommunicationModal({
                    customers: [customer],
                    subject: subjectTemplate.replace(/\[Vehicle\]/g, vehicleName || ''),
                    message: messageTemplate,
                    appointment: appointment,
                    communicationType: 'appointmentReminder'
                });
            }
        } else if (notification.type === 'PAYMENT_REMINDER' && notification.quoteId) {
            const subjectTemplate = t('template_paymentReminder_subject');
            const messageTemplate = t('template_paymentReminder_message');
            const quote = hydratedQuotes.find(q => q.id === notification.quoteId);

            if (subjectTemplate && !subjectTemplate.startsWith('template_') && quote) {
                onOpenCommunicationModal({
                    customers: [customer],
                    subject: subjectTemplate.replace(/\[Vehicle\]/g, vehicleName || ''),
                    message: messageTemplate,
                    quote: quote,
                    communicationType: 'paymentReminder'
                });
            }
        }
        setNotificationOpen(false);
  };

  return (
    <header className="bg-brand-gray-100 dark:bg-brand-gray-900 border-b border-brand-gray-200 dark:border-brand-gray-700/50 transition-colors duration-300 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {logoDataUrl ? (
            <img src={logoDataUrl} alt="Shop Logo" className="h-[100px] w-[100px] object-contain" />
          ) : (
            <div className="bg-brand-lime text-black rounded-lg h-[100px] w-[100px] flex items-center justify-center">
                <WrenchScrewdriverIcon className="h-14 w-14" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100 tracking-tight">
            {shopName || t('headerTitle')}
          </h1>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
            <div className="relative">
                <button
                    onClick={() => setLangDropdownOpen(prev => !prev)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 transition-colors"
                >
                    <span>{language.split('-')[0].toUpperCase()}</span>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </button>
                {isLangDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 origin-top-right bg-white dark:bg-brand-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in"
                         onMouseLeave={() => setLangDropdownOpen(false)}>
                        <div className="py-1">
                            {supportedLanguages.map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => { setLanguage(lang); setLangDropdownOpen(false); }}
                                    className={`${language === lang ? 'font-bold text-brand-blue dark:text-blue-400' : 'text-brand-gray-700 dark:text-brand-gray-300'} block w-full text-left px-4 py-2 text-sm hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600`}
                                >
                                    {t(`language_${lang}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="relative">
                <button
                    ref={notificationButtonRef}
                    onClick={() => setNotificationOpen(prev => !prev)}
                    className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 transition-colors"
                    aria-label={t('notificationsTitle')}
                >
                    <BellIcon className="h-6 w-6" />
                    {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                           {notifications.length > 9 ? '9+' : notifications.length}
                        </span>
                    )}
                </button>
                {isNotificationOpen && (
                    <NotificationPopover
                        notifications={notifications}
                        onSelectNotification={handleSelectNotification}
                        onClose={() => setNotificationOpen(false)}
                        anchorEl={notificationButtonRef.current}
                    />
                )}
            </div>

             <button
                onClick={onToggleTheme}
                className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 transition-colors"
                aria-label={t('toggleTheme')}
            >
                {settings.theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
            </button>
        </div>
      </div>
    </header>
  );
};