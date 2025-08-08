import React, { useState, useEffect, useMemo } from 'react';
import { BanknotesIcon, XMarkIcon, UserIcon, CarIcon, CheckCircleIcon } from '../Icon';
import type { HydratedQuote, Payment } from '../types';
import { useLocalization } from '../services/localization';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quoteId: string, paymentData: Omit<Payment, 'id'>, sendReceipt: boolean) => void;
  quote: HydratedQuote | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSave, quote }) => {
  const { t, formatCurrency } = useLocalization();

  const totalPaid = useMemo(() => {
    return quote?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  }, [quote?.payments]);

  const amountDue = useMemo(() => {
    if (!quote) return 0;
    const totalCost = quote.totalCost - (quote.discountAmount || 0);
    return totalCost - totalPaid;
  }, [quote?.totalCost, quote?.discountAmount, totalPaid]);

  const [amount, setAmount] = useState(amountDue);
  const [method, setMethod] = useState<Payment['method']>('Credit Card');
  const [date, setDate] = useState('');
  const [sendReceipt, setSendReceipt] = useState(true);

  const isFinalPayment = useMemo(() => {
    return Number(amount.toFixed(2)) >= Number(amountDue.toFixed(2));
  }, [amount, amountDue]);

  useEffect(() => {
    if (isOpen) {
        setAmount(amountDue);
        setDate(new Date().toISOString().split('T')[0]);
        setSendReceipt(true);
    }
  }, [isOpen, amountDue]);

  const handleSave = () => {
    if (quote && amount > 0) {
      onSave(quote.id, {
        amount: Number(amount),
        method,
        date: new Date(date).toISOString(),
      }, isFinalPayment && sendReceipt);
      onClose();
    }
  };

  if (!isOpen || !quote) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg m-4 transform transition-all animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-brand-blue dark:text-blue-400" />
            <h2 className="ml-3 text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{t('paymentModalTitle')}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-200 hover:text-brand-gray-600 dark:text-brand-gray-400 dark:hover:bg-brand-gray-700 dark:hover:text-brand-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 bg-brand-gray-50 dark:bg-brand-gray-900/40 p-4 rounded-lg">
            <div className='flex items-center'>
                <UserIcon className='h-5 w-5 text-brand-gray-500 dark:text-brand-gray-400 mr-3'/>
                <p><span className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{quote.customerName}</span></p>
            </div>
            <div className='flex items-center'>
                <CarIcon className='h-5 w-5 text-brand-gray-500 dark:text-brand-gray-400 mr-3'/>
                 <p><span className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{quote.vehicle}</span></p>
            </div>
            <div className="mt-2 pl-8 border-t border-brand-gray-200 dark:border-brand-gray-700 pt-2 flex justify-between items-baseline">
                <span className="text-sm text-brand-gray-600 dark:text-brand-gray-300">{t('amountDueLabel')}</span>
                <span className="font-bold text-lg text-red-600 dark:text-red-400">{formatCurrency(amountDue)}</span>
            </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="payment-amount" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('paymentAmountLabel')}</label>
            <input
              id="payment-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
              required
            />
          </div>
          <div>
            <label htmlFor="payment-method" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('paymentMethodLabel')}</label>
             <select
                id="payment-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as Payment['method'])}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm appearance-none"
            >
                <option value="Credit Card">{t('paymentMethodCreditCard')}</option>
                <option value="Cash">{t('paymentMethodCash')}</option>
                <option value="Bank Transfer">{t('paymentMethodBankTransfer')}</option>
                <option value="Other">{t('paymentMethodOther')}</option>
            </select>
          </div>
        </div>
         <div className="mt-4">
            <label htmlFor="payment-date" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{t('paymentDateLabel')}</label>
            <input
              id="payment-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full md:w-1/2 px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
              required
            />
          </div>

        {isFinalPayment && (
            <div className="mt-6 flex items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-md animate-fade-in">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                <div>
                    <label htmlFor="send-receipt" className="text-sm font-medium text-green-800 dark:text-green-200 cursor-pointer">
                        {t('sendReceiptCheckboxLabel')}
                    </label>
                    <input
                        id="send-receipt"
                        type="checkbox"
                        checked={sendReceipt}
                        onChange={(e) => setSendReceipt(e.target.checked)}
                        className="ml-4 h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                    />
                </div>
            </div>
        )}

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
                disabled={!date || amount <= 0}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-brand-gray-400 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed transition-colors"
            >
                {t('savePaymentButton')}
            </button>
        </div>
      </div>
    </div>
  );
};