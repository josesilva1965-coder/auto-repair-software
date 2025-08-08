
import React, { useState, useEffect } from 'react';
import { CubeIcon, XMarkIcon } from '../Icon';
import type { InventoryPart } from '../types';
import { useLocalization } from '../services/localization';

interface PartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partData: InventoryPart | Omit<InventoryPart, 'id'>) => void;
  partToEdit: InventoryPart | null;
}

export const PartModal: React.FC<PartModalProps> = ({ isOpen, onClose, onSave, partToEdit }) => {
  const { t } = useLocalization();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState<number | ''>(0);
  const [price, setPrice] = useState<number | ''>(0);
  const [brand, setBrand] = useState('');
  const [compatibleBrands, setCompatibleBrands] = useState('');


  const isEditing = !!partToEdit;

  const clearForm = () => {
    setName(''); setSku(''); setStock(0); setPrice(0); setBrand(''); setCompatibleBrands('');
  };

  useEffect(() => {
    if (isOpen) {
        if (partToEdit) {
            setName(partToEdit.name);
            setSku(partToEdit.sku);
            setStock(partToEdit.stock);
            setPrice(partToEdit.price);
            setBrand(partToEdit.brand || '');
            setCompatibleBrands((partToEdit.compatibleBrands || []).join(', '));
        } else {
            clearForm();
        }
    }
  }, [isOpen, partToEdit]);

  const handleSave = () => {
    if (name.trim() && price !== '' && Number(price) >= 0) {
      const compatibleBrandsArray = compatibleBrands.split(',').map(b => b.trim()).filter(Boolean);
      const commonData = { 
        name, 
        sku, 
        stock: Number(stock), 
        price: Number(price),
        brand,
        compatibleBrands: compatibleBrandsArray
      };

      if (isEditing) {
        onSave({ ...partToEdit, ...commonData });
      } else {
        onSave(commonData);
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg m-4 transform transition-all animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CubeIcon className="h-8 w-8 text-brand-blue dark:text-blue-400" />
            <h2 className="ml-3 text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{isEditing ? t('editPartModalTitle') : t('partModalTitle')}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-200 hover:text-brand-gray-600 dark:text-brand-gray-400 dark:hover:bg-brand-gray-700 dark:hover:text-brand-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="part-name" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('partNameLabel')}</label>
              <input id="part-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue placeholder-brand-gray-600 dark:placeholder-brand-gray-500" placeholder={t('partNamePlaceholder')} required />
            </div>
            <div>
              <label htmlFor="part-brand" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('brandLabel')}</label>
              <input id="part-brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue placeholder-brand-gray-600 dark:placeholder-brand-gray-500" placeholder={t('brandPlaceholder')} />
            </div>
          </div>
           <div>
            <label htmlFor="part-compatible-brands" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('compatibleBrandsLabel')}</label>
            <input id="part-compatible-brands" type="text" value={compatibleBrands} onChange={(e) => setCompatibleBrands(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue placeholder-brand-gray-600 dark:placeholder-brand-gray-500" placeholder={t('compatibleBrandsPlaceholder')} />
            <p className="mt-1 text-xs text-brand-gray-500 dark:text-brand-gray-400">{t('compatibleBrandsDesc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="part-sku" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('skuLabel')}</label>
              <input id="part-sku" type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue placeholder-brand-gray-600 dark:placeholder-brand-gray-500" placeholder={t('skuPlaceholder')} />
            </div>
            <div>
                <label htmlFor="part-stock" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('stockLabel')}</label>
                <input id="part-stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" required />
            </div>
            <div>
                <label htmlFor="part-price" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('priceLabel')}</label>
                <input id="part-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" placeholder="£" required />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800 transition-colors">{t('cancelButton')}</button>
            <button type="button" onClick={handleSave} disabled={!name.trim() || price === '' || Number(price) < 0} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark disabled:bg-brand-gray-400 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed transition-colors">{isEditing ? t('saveChangesButton') : t('savePartButton')}</button>
        </div>
      </div>
    </div>
  );
};
