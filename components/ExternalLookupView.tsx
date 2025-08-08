
import React, { useState } from 'react';
import type { ShopSettings } from '../types';
import { useLocalization } from '../services/localization';
import { MagnifyingGlassIcon, Cog6ToothIcon } from '../Icon';

interface ExternalLookupViewProps {
    shopSettings: ShopSettings | null;
}

export const ExternalLookupView: React.FC<ExternalLookupViewProps> = ({ shopSettings }) => {
    const { t } = useLocalization();
    const [registration, setRegistration] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);

    const handleLookup = async () => {
        if (!shopSettings?.vehicleApiUrl) {
            setError(t('apiNotConfiguredError'));
            return;
        }
        if (!registration.trim()) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const url = `${shopSettings.vehicleApiUrl}?reg=${encodeURIComponent(registration)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (Object.keys(data).length === 0) {
                 setResult(t('noResultsFound'));
            } else {
                 setResult(JSON.stringify(data, null, 2));
            }

        } catch (e) {
            console.error(e);
            setError(t('lookupError'));
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in flex flex-col h-full">
            <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-2">{t('externalLookupTitle')}</h2>
            <p className="text-brand-gray-600 dark:text-brand-gray-400 mb-6">{t('externalLookupDesc')}</p>

            <div className="max-w-xl mx-auto w-full">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={registration}
                        onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                        placeholder={t('licensePlatePlaceholder')}
                        className="flex-grow block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:ring-brand-blue focus:border-brand-blue"
                    />
                    <button
                        onClick={handleLookup}
                        disabled={isLoading || !registration.trim()}
                        className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue-dark disabled:bg-brand-gray-400"
                    >
                        {isLoading ? (
                            <Cog6ToothIcon className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                                {t('lookupButton')}
                            </>
                        )}
                    </button>
                </div>
                
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-2">{t('lookupResultsTitle')}</h3>
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
                            {error}
                        </div>
                    )}
                    {result && (
                         <div className="bg-brand-gray-800 rounded-lg overflow-hidden">
                             <pre className="p-4 text-xs text-white overflow-auto custom-scrollbar font-mono">
                                 <code>
                                     {result}
                                 </code>
                             </pre>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};