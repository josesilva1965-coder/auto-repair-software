import React, { useState, useCallback } from 'react';
import type { HydratedQuote, Customer, Vehicle } from '../types';
import { useLocalization } from '../services/localization';
import { CodeBracketIcon } from '../Icon';

interface ApiViewProps {
  quotes: HydratedQuote[];
  customers: Customer[];
  vehicles: Vehicle[];
}

const endpoints = [
    { path: '/api/jobs', description: 'Get all jobs (quotes).', type: 'all', resource: 'quotes' },
    { path: '/api/jobs/:id', description: 'Get a single job by its ID.', type: 'single', resource: 'quotes' },
    { path: '/api/customers', description: 'Get all customers.', type: 'all', resource: 'customers' },
    { path: '/api/customers/:id', description: 'Get a single customer by ID.', type: 'single', resource: 'customers' },
    { path: '/api/vehicles', description: 'Get all vehicles.', type: 'all', resource: 'vehicles' },
];

export const ApiView: React.FC<ApiViewProps> = ({ quotes, customers, vehicles }) => {
    const { t } = useLocalization();
    const [jsonOutput, setJsonOutput] = useState<string>('// Select an endpoint to view data');
    const [selectedId, setSelectedId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleFetch = useCallback((resource: string, id?: string) => {
        setError(null);
        let data: any = null;
        try {
            if (id) {
                switch (resource) {
                    case 'quotes':
                        data = quotes.find(q => q.id === id);
                        break;
                    case 'customers':
                        data = customers.find(c => c.id === id);
                        break;
                    case 'vehicles':
                        data = vehicles.find(v => v.id === id);
                        break;
                }
                if (!data) {
                   throw new Error(t('apiErrorNotFound', { resource: resource.slice(0, -1), id }));
                }
            } else {
                 switch (resource) {
                    case 'quotes':
                        data = quotes;
                        break;
                    case 'customers':
                        data = customers;
                        break;
                    case 'vehicles':
                        data = vehicles;
                        break;
                }
            }
            setJsonOutput(JSON.stringify(data, null, 2));
        } catch (e: any) {
            setError(e.message);
            setJsonOutput(`// Error: ${e.message}`);
        }
    }, [quotes, customers, vehicles, t]);

    return (
        <div className="animate-fade-in flex flex-col h-full">
            <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-2">{t('apiViewTitle')}</h2>
            <p className="text-brand-gray-600 dark:text-brand-gray-400 mb-6">{t('apiViewDesc')}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
                {/* Endpoint List */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    {endpoints.map(endpoint => (
                        <div key={endpoint.path} className="bg-white dark:bg-brand-gray-800 p-4 rounded-lg border border-brand-gray-200 dark:border-brand-gray-700">
                           <p className="font-mono text-sm font-semibold text-brand-blue dark:text-blue-400">{endpoint.path}</p>
                           <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1 mb-3">{endpoint.description}</p>
                            {endpoint.type === 'all' ? (
                                <button
                                    onClick={() => handleFetch(endpoint.resource)}
                                    className="w-full text-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue-dark"
                                >
                                    {t('apiFetchButton')}
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder={t('apiIdPlaceholder', { resource: endpoint.resource.slice(0, -1) })}
                                        onChange={(e) => setSelectedId(e.target.value)}
                                        className="flex-grow block w-full px-2 py-1 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm text-xs focus:ring-brand-blue focus:border-brand-blue"
                                    />
                                    <button
                                        onClick={() => handleFetch(endpoint.resource, selectedId)}
                                        className="px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue-dark"
                                    >
                                        {t('apiFetchButton')}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* JSON Viewer */}
                <div className="lg:col-span-2 bg-brand-gray-800 rounded-lg overflow-hidden flex flex-col">
                    <div className="bg-brand-gray-900 px-4 py-2 text-xs text-brand-gray-400 font-semibold">{t('apiResponseViewerTitle')}</div>
                    <pre className="p-4 text-xs text-white overflow-auto flex-grow custom-scrollbar font-mono">
                        <code>
                            {jsonOutput}
                        </code>
                    </pre>
                </div>
            </div>
        </div>
    );
};
