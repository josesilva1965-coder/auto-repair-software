
import React from 'react';
import type { Invoice, ShopSettings, HydratedQuote, CommunicationType } from '../types';
import { WrenchScrewdriverIcon, PrinterIcon, XMarkIcon, EnvelopeIcon } from '../Icon';
import { useLocalization } from '../services/localization';

interface InvoiceViewProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  settings: ShopSettings;
  onSendMessage: (quote: HydratedQuote, type: 'invoice' | 'receipt') => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ isOpen, onClose, invoice, settings, onSendMessage }) => {
  const { t, formatCurrency, formatDate } = useLocalization();

  if (!isOpen || !invoice) {
    return null;
  }
  
  const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const amountDue = invoice.totalCost - (invoice.discountAmount || 0) - totalPaid;

  const handleSendMessage = () => {
    if (amountDue > 0) {
      onSendMessage(invoice, 'invoice');
    } else {
      onSendMessage(invoice, 'receipt');
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-gray-100 dark:bg-brand-gray-900 z-50 overflow-y-auto animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-brand-gray-200 dark:bg-brand-gray-800 p-4 sticky top-0 z-10 flex justify-center items-center print:hidden">
          <div className="flex-1"></div>
          <div className="flex-1 flex justify-center space-x-4">
              <button 
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-lg shadow-md hover:bg-brand-blue-dark transition-colors"
              >
                  <PrinterIcon className="h-5 w-5 mr-2" />
                  {t('printButton')}
              </button>
              <button 
                  onClick={handleSendMessage}
                  className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition-colors"
              >
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  {amountDue > 0 ? t('sendInvoiceButton') : t('sendReceiptButton')}
              </button>
              <button 
                onClick={onClose}
                className="flex items-center px-4 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 rounded-lg shadow-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 transition-colors"
              >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  {t('closeButton')}
              </button>
          </div>
          <div className="flex-1"></div>
      </div>
      <div className="p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-4xl bg-white shadow-2xl p-12 print:shadow-none print:p-0 print:m-0 print:text-black">
          {/* Invoice Header */}
          <header className="flex justify-between items-start pb-8 border-b-2 border-brand-gray-800">
            <div>
              {settings.logoDataUrl ? (
                <img src={settings.logoDataUrl} alt="Shop Logo" className="h-20 w-auto mb-4" />
              ) : (
                <div className="bg-brand-gray-800 text-white p-3 rounded-lg mb-4 inline-block">
                    <WrenchScrewdriverIcon className="h-8 w-8" />
                </div>
              )}
              <h1 className="text-3xl font-bold text-brand-gray-800">{settings.shopName}</h1>
              <p className="text-sm text-brand-gray-600">{settings.address}</p>
              <p className="text-sm text-brand-gray-600">{settings.phone} | {settings.email}</p>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-bold uppercase text-brand-gray-400">{t('invoiceTitle')}</h2>
              <p className="text-md text-brand-gray-600 mt-2">{t('invoiceNumberLabel')} <span className="font-semibold text-brand-gray-800">#{invoice.id}</span></p>
              <p className="text-md text-brand-gray-600">{t('dateLabel')}: <span className="font-semibold text-brand-gray-800">{formatDate(new Date().toISOString())}</span></p>
            </div>
          </header>

          {/* Bill To & Vehicle Info */}
          <section className="grid grid-cols-2 gap-8 my-8">
            <div>
              <h3 className="text-sm font-bold uppercase text-brand-gray-500 mb-2">{t('billToLabel')}</h3>
              <p className="text-lg font-semibold text-brand-gray-800">{invoice.customer.name}</p>
              <p className="text-brand-gray-600">{invoice.customer.email}</p>
              <p className="text-brand-gray-600">{invoice.customer.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase text-brand-gray-500 mb-2">{t('vehicleInfoCardTitle')}</h3>
              <p className="text-lg font-semibold text-brand-gray-800">{invoice.vehicleDetails.year} {invoice.vehicleDetails.make} {invoice.vehicleDetails.model}</p>
              <p className="text-brand-gray-600">{t('vinLabel')}: {invoice.vehicleDetails.vin}</p>
              <p className="text-brand-gray-600">{t('licensePlateLabel')}: {invoice.vehicleDetails.licensePlate}</p>
            </div>
          </section>

          {/* Itemized Services Table */}
          <section>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-gray-800 text-white">
                  <th className="p-3 font-semibold uppercase text-sm w-1/2">{t('itemDescriptionHeader')}</th>
                  <th className="p-3 font-semibold uppercase text-sm text-right">{t('itemQuantityHeader')}</th>
                  <th className="p-3 font-semibold uppercase text-sm text-right">{t('itemPriceHeader')}</th>
                  <th className="p-3 font-semibold uppercase text-sm text-right">{t('itemTotalHeader')}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.services.map((service, index) => (
                  <React.Fragment key={index}>
                    <tr className="bg-brand-gray-100 font-bold">
                      <td colSpan={4} className="p-3 text-brand-gray-800">{service.name}</td>
                    </tr>
                    {service.parts.map((part, pIndex) => (
                      <tr key={`part-${pIndex}`} className="border-b border-brand-gray-200">
                        <td className="p-3 pl-8 text-brand-gray-600">{part.name}</td>
                        <td className="p-3 text-right text-brand-gray-600">{part.quantity}</td>
                        <td className="p-3 text-right text-brand-gray-600">{formatCurrency(part.unitPrice)}</td>
                        <td className="p-3 text-right text-brand-gray-600">{formatCurrency(part.totalPrice)}</td>
                      </tr>
                    ))}
                     <tr className="border-b border-brand-gray-200">
                        <td className="p-3 pl-8 text-brand-gray-600">{t('laborSectionTitle')}</td>
                        <td className="p-3 text-right text-brand-gray-600">{service.laborHours.toFixed(2)}</td>
                        <td className="p-3 text-right text-brand-gray-600">{formatCurrency(service.laborCost / service.laborHours)}</td>
                        <td className="p-3 text-right text-brand-gray-600">{formatCurrency(service.laborCost)}</td>
                      </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </section>

          {/* Totals Section */}
          <section className="flex justify-end mt-8">
            <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-brand-gray-600">
                    <p>{t('subtotalLabel')}</p>
                    <p>{formatCurrency(invoice.subtotal)}</p>
                </div>
                <div className="flex justify-between text-brand-gray-600">
                    <p>{t('taxLabel')}</p>
                    <p>{formatCurrency(invoice.taxAmount)}</p>
                </div>
                 {invoice.discountAmount && invoice.discountAmount > 0 && (
                    <div className="flex justify-between text-brand-gray-600">
                        <p>{t('discountLabel')}</p>
                        <p className='text-green-600'>-{formatCurrency(invoice.discountAmount)}</p>
                    </div>
                )}
                <div className="flex justify-between font-bold text-lg text-brand-gray-800 pt-2 border-t border-brand-gray-300">
                    <p>{t('totalCostLabel')}</p>
                    <p>{formatCurrency(invoice.totalCost - (invoice.discountAmount || 0))}</p>
                </div>
                {totalPaid > 0 && (
                     <div className="flex justify-between text-brand-gray-600 text-green-600">
                        <p>{t('amountPaidLabel')}</p>
                        <p>-{formatCurrency(totalPaid)}</p>
                    </div>
                )}
                <div className="flex justify-between font-bold text-2xl text-red-600 bg-brand-gray-100 p-3 rounded-lg">
                    <p>{t('amountDueLabel')}</p>
                    <p>{formatCurrency(amountDue)}</p>
                </div>
            </div>
          </section>
          
          <footer className="mt-12 pt-8 border-t border-brand-gray-300">
            <h3 className="text-sm font-bold uppercase text-brand-gray-500 mb-2">{t('notesInfoCardTitle')}</h3>
            <p className="text-sm text-brand-gray-600">{invoice.notes}</p>
            <p className="text-center text-xs text-brand-gray-500 mt-8">{t('thankYouMessage')}</p>
          </footer>
        </div>
      </div>
    </div>
  );
};
