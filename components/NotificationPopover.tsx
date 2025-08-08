import React, { useEffect, useRef } from 'react';
import type { Notification } from '../types';
import { useLocalization } from '../services/localization';
import { BellIcon, CalendarDaysIcon, BanknotesIcon } from '../Icon';

interface NotificationPopoverProps {
    notifications: Notification[];
    onSelectNotification: (notification: Notification) => void;
    onClose: () => void;
    anchorEl: HTMLElement | null;
}

const NotificationIcon: React.FC<{type: Notification['type']}> = ({type}) => {
    switch (type) {
        case 'APPOINTMENT_REMINDER':
            return <CalendarDaysIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
        case 'PAYMENT_REMINDER':
            return <BanknotesIcon className="h-5 w-5 text-green-500 dark:text-green-400" />;
        default:
            return <BellIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ notifications, onSelectNotification, onClose, anchorEl }) => {
    const { t } = useLocalization();
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && !anchorEl?.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose, anchorEl]);

    return (
        <div 
            ref={popoverRef}
            className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right bg-white dark:bg-brand-gray-800 rounded-lg shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-heading"
        >
            <div className="p-4 border-b border-brand-gray-200 dark:border-brand-gray-700">
                <h2 id="notification-heading" className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-100">{t('notificationsTitle')}</h2>
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                    <ul className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                        {notifications.map(notification => (
                            <li key={notification.id}>
                                <button
                                    onClick={() => onSelectNotification(notification)}
                                    className="w-full text-left p-4 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 mt-1">
                                            <NotificationIcon type={notification.type} />
                                        </div>
                                        <div className="ml-3 w-full min-w-0">
                                            <p className="text-sm text-brand-gray-600 dark:text-brand-gray-300">
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-8 text-center">
                        <BellIcon className="h-12 w-12 text-brand-gray-300 dark:text-brand-gray-600 mx-auto" />
                        <p className="mt-4 text-sm font-medium text-brand-gray-500 dark:text-brand-gray-400">
                            {t('noNotifications')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
