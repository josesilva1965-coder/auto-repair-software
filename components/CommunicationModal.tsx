
import React, { useState, useEffect, useMemo } from 'react';
import { EnvelopeIcon, XMarkIcon, UserIcon, UsersIcon } from '../Icon';
import type { CommunicationModalData, ShopSettings } from '../types';
import { useLocalization } from '../services/localization';

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (customerIds: string[], subject: string, message: string) => void;
  data: CommunicationModalData | null;
  shopSettings: ShopSettings | null;
}

export const CommunicationModal: React.FC<CommunicationModalProps> = ({ isOpen, onClose, onSend, data, shopSettings }) => {
  const { t } = useLocalization();
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (data) {
      setSubject(data.subject);
      setMessage(data.message);
    } else {
      setSubject('');
      setMessage('');
    }
  }, [data]);
  
  const handleSend = () => {
    if (data && data.customers.length > 0 && subject.trim() && message.trim()) {
      const customerIds = data.customers.map(c => c.id);
      onSend(customerIds, subject, message);
      onClose();
    }
  };

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg m-4 transform transition-all animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <EnvelopeIcon className="h-8 w-8 text-brand-blue dark:text-blue-400" />
            <h2 className="ml-3 text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{t('communicationModalTitle')}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-200 hover:text-brand-gray-600 dark:text-brand-gray-400 dark:hover:bg-brand-gray-700 dark:hover:text-brand-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('recipientsLabel')}</label>
            <div className="mt-1 p-3 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-md flex items-center">
                {data.customers.length > 1 ? (
                    <UsersIcon className="h-5 w-5 text-brand-gray-500 mr-3"/>
                ) : (
                    <UserIcon className="h-5 w-5 text-brand-gray-500 mr-3"/>
                )}
                <span className="text-sm text-brand-gray-800 dark:text-brand-gray-200 truncate">
                    {data.customers.map(c => c.name).join(', ')}
                </span>
            </div>
          </div>
          <div>
            <label htmlFor="comm-subject" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('subjectLabel')}</label>
            <input
                id="comm-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm placeholder-brand-gray-400 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                required
            />
          </div>
          <div>
            <label htmlFor="comm-message" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('messageLabel')}</label>
            <textarea
                id="comm-message" value={message} onChange={e => setMessage(e.target.value)}
                rows={10}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm placeholder-brand-gray-400 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                required
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
            <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 transition-colors"
            >
                {t('cancelButton')}
            </button>
            <button
                type="button"
                onClick={handleSend}
                disabled={!subject.trim() || !message.trim()}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-brand-gray-400 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed transition-colors"
            >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                {t('sendViaEmailButton')}
            </button>
        </div>
        <p className="mt-2 text-xs text-center text-brand-gray-500 dark:text-brand-gray-400">{t('sendViaEmailDesc')}</p>
      </div>
    </div>
  );
};
