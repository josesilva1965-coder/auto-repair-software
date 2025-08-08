
import React, { useState, useMemo } from 'react';
import type { Customer } from '../types';
import { useLocalization } from '../services/localization';
import { MegaphoneIcon, UserIcon, XMarkIcon } from './Icon';

interface CommunicationsViewProps {
  customers: Customer[];
  onSendMessage: (customerIds: string[], subject: string, message: string) => void;
}

const MultiSelectTags: React.FC<{ allTags: string[], selectedTags: string[], onChange: (tags: string[]) => void }> = ({ allTags, selectedTags, onChange }) => {
    const { t } = useLocalization();
    const [isOpen, setIsOpen] = useState(false);

    const toggleTag = (tag: string) => {
        const newTags = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag];
        onChange(newTags);
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">{t('filterByTagsLabel')}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-full bg-white dark:bg-brand-gray-700 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
            >
                <span className="flex items-center">
                    <span className="block truncate">
                        {selectedTags.length === 0 ? t('filterByTagsPlaceholder') : selectedTags.join(', ')}
                    </span>
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                     <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 7.03 7.78a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.53a.75.75 0 011.06 0L10 15.19l2.97-2.97a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
                </span>
            </button>

            {isOpen && (
                <div className="absolute mt-1 w-full rounded-md bg-white dark:bg-brand-gray-700 shadow-lg z-10">
                    <ul className="max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {allTags.map(tag => (
                            <li key={tag} onClick={() => toggleTag(tag)} className="text-gray-900 dark:text-gray-200 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600">
                                <div className="flex items-center">
                                    <span className={`font-normal block truncate ${selectedTags.includes(tag) ? 'font-semibold' : ''}`}>{tag}</span>
                                    {selectedTags.includes(tag) && (
                                        <span className="text-brand-blue dark:text-blue-400 absolute inset-y-0 right-0 flex items-center pr-4">
                                             <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


export const CommunicationsView: React.FC<CommunicationsViewProps> = ({ customers, onSendMessage }) => {
    const { t } = useLocalization();
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const allTags = useMemo(() => {
        const tagsSet = new Set<string>();
        customers.forEach(c => c.tags?.forEach(tag => tagsSet.add(tag)));
        return Array.from(tagsSet).sort();
    }, [customers]);

    const filteredCustomers = useMemo(() => {
        if (selectedTags.length === 0) {
            return customers;
        }
        return customers.filter(c => selectedTags.every(tag => c.tags?.includes(tag)));
    }, [customers, selectedTags]);

    const handleSend = () => {
        if (!subject.trim() || !message.trim() || filteredCustomers.length === 0) return;
        const customerIds = filteredCustomers.map(c => c.id);
        onSendMessage(customerIds, subject, message);
        setSubject('');
        setMessage('');
    };

    return (
        <div className="animate-fade-in flex flex-col h-full">
            <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-6">{t('communicationsTitle')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <MultiSelectTags allTags={allTags} selectedTags={selectedTags} onChange={setSelectedTags} />
                    
                    <div className="p-4 bg-brand-gray-50 dark:bg-brand-gray-900/40 rounded-lg">
                        <h3 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">
                            {selectedTags.length === 0 ? t('noTagsSelected') : t('customersSelected', { count: filteredCustomers.length })}
                        </h3>
                        <div className="mt-2 text-sm text-brand-gray-600 dark:text-brand-gray-400 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                           {filteredCustomers.map(c => (
                             <p key={c.id} className="truncate">{c.name}</p>
                           ))}
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                     <div>
                        <label htmlFor="comm-subject" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('messageSubjectLabel')}</label>
                        <input
                            id="comm-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm placeholder-brand-gray-400 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                            placeholder={t('messageSubjectPlaceholder')}
                        />
                    </div>
                    <div>
                        <label htmlFor="comm-message" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('messageBodyLabel')}</label>
                        <textarea
                            id="comm-message" value={message} onChange={e => setMessage(e.target.value)}
                            rows={8}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm placeholder-brand-gray-400 dark:placeholder-brand-gray-500 focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                            placeholder={t('messageBodyPlaceholder')}
                        />
                    </div>
                    <div>
                        <button
                            onClick={handleSend}
                            disabled={!subject.trim() || !message.trim() || filteredCustomers.length === 0}
                            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-brand-gray-400 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            <MegaphoneIcon className="h-5 w-5 mr-2" />
                            {t('sendMessageButton')}
                        </button>
                        <p className="mt-2 text-xs text-center text-brand-gray-500 dark:text-brand-gray-400">{t('sendMessageDesc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};