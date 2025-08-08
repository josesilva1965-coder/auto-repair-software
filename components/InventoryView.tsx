
import React, { useState, useMemo } from 'react';
import type { InventoryPart } from '../types';
import { CubeIcon, PlusIcon, PencilSquareIcon } from '../Icon';
import { useLocalization } from '../services/localization';

interface InventoryViewProps {
  inventoryParts: InventoryPart[];
  onAddPart: () => void;
  onEditPart: (part: InventoryPart) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ inventoryParts, onAddPart, onEditPart }) => {
  const { t, formatCurrency } = useLocalization();
  const [openBrands, setOpenBrands] = useState<Record<string, boolean>>({});
  const [brandFilter, setBrandFilter] = useState<string>('');

  const carBrands = useMemo(() => {
    const brands = new Set<string>();
    inventoryParts.forEach(part => {
      part.compatibleBrands?.forEach(brand => brands.add(brand));
    });
    return Array.from(brands).sort();
  }, [inventoryParts]);
  
  const filteredParts = useMemo(() => {
    if (!brandFilter) return inventoryParts;
    return inventoryParts.filter(part => part.compatibleBrands?.includes(brandFilter));
  }, [inventoryParts, brandFilter]);

  const groupedParts = useMemo(() => {
    return filteredParts.reduce((acc, part) => {
      const brand = part.brand || t('unbrandedCategory');
      if (!acc[brand]) {
        acc[brand] = [];
      }
      acc[brand].push(part);
      return acc;
    }, {} as Record<string, InventoryPart[]>);
  }, [filteredParts, t]);

  const toggleBrand = (brand: string) => {
    setOpenBrands(prev => ({ ...prev, [brand]: !prev[brand] }));
  };

  if (inventoryParts.length === 0) {
    return (
      <div className="text-center text-brand-gray-500 dark:text-brand-gray-400 h-full flex flex-col justify-center items-center animate-fade-in">
        <CubeIcon className="h-16 w-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-brand-gray-700 dark:text-brand-gray-200">{t('inventoryViewEmptyTitle')}</h2>
        <p className="mt-2 max-w-md">{t('inventoryViewEmptyDesc')}</p>
        <button onClick={onAddPart} className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('addNewPartButton')}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col h-full">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{t('inventoryTitle')}</h2>
            <div className="flex items-center gap-4">
              <div>
                <label htmlFor="brand-filter" className="sr-only">{t('filterByCarBrandLabel')}</label>
                <select 
                  id="brand-filter"
                  value={brandFilter}
                  onChange={e => setBrandFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-brand-gray-700 border-brand-gray-300 dark:border-brand-gray-600 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md"
                >
                  <option value="">{t('allBrandsFilter')}</option>
                  {carBrands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </div>
              <button onClick={onAddPart} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  {t('addNewPartButton')}
              </button>
            </div>
        </div>
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-4">
            {Object.entries(groupedParts).sort(([brandA], [brandB]) => brandA.localeCompare(brandB)).map(([brand, parts]) => (
              <div key={brand} className="bg-white dark:bg-brand-gray-800 border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg overflow-hidden">
                <button onClick={() => toggleBrand(brand)} className="w-full p-4 flex justify-between items-center bg-brand-gray-50 dark:bg-brand-gray-700/50 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <h3 className="font-bold text-lg text-brand-gray-800 dark:text-brand-gray-100">{brand}</h3>
                  <div className="flex items-center">
                    <span className="text-sm bg-brand-blue text-white rounded-full px-2 py-0.5 mr-4">{parts.length}</span>
                    <svg className={`h-5 w-5 text-brand-gray-500 transform transition-transform ${openBrands[brand] ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </div>
                </button>
                {openBrands[brand] && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                      <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
                          <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">{t('partNameHeader')}</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">{t('compatibleBrandsHeader')}</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">{t('stockHeader')}</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">{t('priceHeader')}</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">{t('actionsHeader')}</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                          {parts.map(part => (
                              <tr key={part.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-brand-gray-900 dark:text-white">{part.name}</div>
                                    <div className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{part.sku || 'N/A'}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">
                                    {part.compatibleBrands?.join(', ') || '-'}
                                  </td>
                                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${part.stock <= 5 ? 'text-red-500' : 'text-green-500 dark:text-green-400'}`}>{part.stock}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">{formatCurrency(part.price)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => onEditPart(part)} className="text-brand-blue hover:text-brand-blue-dark dark:text-blue-400 dark:hover:text-blue-300 flex items-center">
                                      <PencilSquareIcon className="h-5 w-5 mr-1" />
                                      {t('editButtonLabel')}
                                    </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
    </div>
  );
};
