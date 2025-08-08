

import React, { useState, useEffect } from 'react';
import { UserPlusIcon, XMarkIcon, PencilSquareIcon } from '../Icon';
import type { Customer } from '../types';
import { useLocalization } from '../services/localization';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: Customer | Omit<Customer, 'id'>) => void;
  customerToEdit: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave, customerToEdit }) => {
  const { t } = useLocalization();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tags, setTags] = useState('');

  const isEditing = customerToEdit !== null;

  useEffect(() => {
    if (isOpen && customerToEdit) {
        setName(customerToEdit.name);
        setEmail(customerToEdit.email);
        setPhone(customerToEdit.phone);
        setTags((customerToEdit.tags || []).join(', '));
    } else if (isOpen) {
        setName('');
        setEmail('');
        setPhone('');
        setTags('');
    }
  }, [isOpen, customerToEdit]);

  const handleSave = () => {
    if (name.trim() && email.trim() && phone.trim()) {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      const customerData = {
        name,
        email,
        phone,
        tags: tagArray,
      };
      
      if (isEditing) {
        onSave({ ...customerToEdit, ...customerData });
      } else {
        onSave(customerData);
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md m-4 transform transition-all animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {isEditing 
                ? <PencilSquareIcon className="h-8 w-8 text-brand-blue dark:text-blue-400" /> 
                : <UserPlusIcon className="h-8 w-8 text-brand-blue dark:text-blue-400" />
            }
            <h2 className="ml-3 text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">
                {isEditing ? t('editCustomerModalTitle') : t('addCustomerModalTitle')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-200 hover:text-brand-gray-600 dark:text-brand-gray-400 dark:hover:bg-brand-gray-700 dark:hover:text-brand-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="customer-name" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('fullNameLabel')}</label>
            <input
              id="customer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm placeholder-brand-gray-600 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
              placeholder={t('fullNamePlaceholder')}
              required
            />
          </div>
          <div>
            <label htmlFor="customer-email" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('emailLabel')}</label>
            <input
              id="customer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm placeholder-brand-gray-600 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
              placeholder={t('emailPlaceholder')}
              required
            />
          </div>
          <div>
            <label htmlFor="customer-phone" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('phoneLabel')}</label>
            <input
              id="customer-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm placeholder-brand-gray-600 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
              placeholder={t('phonePlaceholder')}
              required
            />
          </div>
          <div>
            <label htmlFor="customer-tags" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('tagsLabel')}</label>
            <input
              id="customer-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm placeholder-brand-gray-600 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
              placeholder={t('tagsPlaceholder')}
            />
            <p className="mt-1 text-xs text-brand-gray-500 dark:text-brand-gray-400">{t('tagsDesc')}</p>
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
                onClick={handleSave}
                disabled={!name.trim() || !email.trim() || !phone.trim()}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-brand-gray-400 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed transition-colors"
            >
                {t('saveCustomerButton')}
            </button>
        </div>
      </div>
    </div>
  );
};