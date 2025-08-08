import React, { useMemo, useState, useEffect } from 'react';
import type { HydratedQuote, ServiceItem, Part, QuoteStatus, Payment, InventoryPart, Technician, Customer, CommunicationModalData, CommunicationType, ShopSettings, Quote, Vehicle } from '../types';
import { UserIcon, CarIcon, CalendarIcon, NoteIcon, TagIcon, WrenchIcon, CurrencyDollarIcon, CheckCircleIcon, XMarkIcon, ClockIcon, CheckBadgeIcon, ClipboardDocumentCheckIcon, CalendarDaysIcon, BanknotesIcon, CubeIcon, UserGroupIcon, PrinterIcon, SparklesIcon, EnvelopeIcon, PencilSquareIcon, TrashIcon, ClipboardDocumentListIcon, PlusIcon } from '../Icon';
import { useLocalization } from '../services/localization';

interface QuoteDisplayProps {
  quote: HydratedQuote | (Omit<HydratedQuote, 'id' | 'status' | 'appointmentId' | 'payments' | 'technicianId' | 'discountAmount' | 'discountReason' | 'completionDate' | 'mileageAtCompletion'> & { id?: undefined; status?: undefined; appointmentId?: undefined; payments?: undefined, technicianId?: undefined, discountAmount?: undefined, discountReason?: undefined, completionDate?: undefined, mileageAtCompletion?: undefined });
  inventoryParts: InventoryPart[];
  technicians: Technician[];
  customers: Customer[];
  vehicles: Vehicle[];
  shopSettings: ShopSettings | null;
  onSave?: () => void;
  onClose?: () => void;
  onUpdateQuote: (quote: Quote) => void;
  onUpdateStatus: (id: string, status: QuoteStatus, mileage?: number) => void;
  onDeleteQuote: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onSchedule?: (quote: HydratedQuote) => void;
  onViewAppointment?: () => void;
  onOpenPaymentModal?: (quote: HydratedQuote) => void;
  onAssignTechnician: (quoteId: string, technicianId: string) => void;
  onOpenInvoice: (quote: HydratedQuote) => void;
  onOpenJobCard: (quote: HydratedQuote) => void;
  onApplyDiscount: (quoteId: string, points: number) => void;
  onSendMessage: (data: CommunicationModalData) => void;
}

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode, onClick?: () => void, editAction?: React.ReactNode }> = ({ icon, title, children, onClick, editAction }) => (
    <div className={`bg-brand-gray-100 dark:bg-brand-gray-700/50 p-4 rounded-lg flex items-start ${onClick ? 'cursor-pointer hover:bg-brand-gray-200 dark:hover:bg-brand-gray-700' : ''}`} onClick={onClick}>
        <div className="flex-shrink-0 text-brand-blue dark:text-blue-400">{icon}</div>
        <div className="ml-3 flex-grow">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-brand-gray-600 dark:text-brand-gray-400">{title}</h4>
                {editAction}
            </div>
            <div className="text-md font-medium text-brand-gray-800 dark:text-brand-gray-200">{children}</div>
        </div>
    </div>
);

const StatusDisplay: React.FC<{status: QuoteStatus}> = ({ status }) => {
    const { t } = useLocalization();
    const statusConfig: Record<QuoteStatus, { text: string; icon: React.ReactNode; color: string; }> = {
        Saved: { text: t('statusSaved'), icon: <CheckCircleIcon className="h-5 w-5"/>, color: 'text-gray-600 dark:text-gray-300' },
        Approved: { text: t('statusApproved'), icon: <ClipboardDocumentCheckIcon className="h-5 w-5"/>, color: 'text-cyan-600 dark:text-cyan-400' },
        'Work In Progress': { text: t('statusWorkInProgress'), icon: <ClockIcon className="h-5 w-5"/>, color: 'text-blue-600 dark:text-blue-400' },
        'Awaiting Parts': { text: t('statusAwaitingParts'), icon: <CubeIcon className="h-5 w-5"/>, color: 'text-orange-600 dark:text-orange-400' },
        'Ready for Pickup': { text: t('statusReadyForPickup'), icon: <CarIcon className="h-5 w-5"/>, color: 'text-indigo-600 dark:text-indigo-400' },
        Completed: { text: t('statusCompleted'), icon: <CheckBadgeIcon className="h-5 w-5"/>, color: 'text-green-600 dark:text-green-400' },
        Paid: { text: t('statusPaid'), icon: <BanknotesIcon className="h-5 w-5"/>, color: 'text-purple-600 dark:text-purple-400' },
    };
    const config = statusConfig[status];
    return (
        <div className={`flex items-center text-sm font-semibold ${config.color}`}>
            {config.icon}
            <span className="ml-2">{config.text}</span>
        </div>
    );
};

const WorkflowActions: React.FC<{ quote: HydratedQuote, onUpdateStatus: (id: string, status: QuoteStatus, mileage?: number) => void, onOpenPaymentModal: (quote: HydratedQuote) => void, stockAvailability: {isAvailable: boolean, unavailableParts: string[]} }> = ({ quote, onUpdateStatus, onOpenPaymentModal, stockAvailability }) => {
    const { t } = useLocalization();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mileage, setMileage] = useState('');

    const renderActions = () => {
        switch (quote.status) {
            case 'Saved':
                return <button onClick={() => onUpdateStatus(quote.id, 'Approved')} disabled={!stockAvailability.isAvailable} title={!stockAvailability.isAvailable ? t('approveButtonDisabledTooltip', { parts: stockAvailability.unavailableParts.join(', ') }) : ''} className="workflow-button bg-brand-blue hover:bg-brand-blue-dark">{t('approveButton')}</button>;
            case 'Approved':
                return <button onClick={() => onUpdateStatus(quote.id, 'Work In Progress')} className="workflow-button bg-blue-600 hover:bg-blue-700">{t('startWorkButton')}</button>;
            case 'Work In Progress':
            case 'Awaiting Parts':
                 return (
                    <div className="relative">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="workflow-button bg-indigo-600 hover:bg-indigo-700 w-full">{t('updateStatusButton')}</button>
                        {isMenuOpen && (
                            <div className="absolute bottom-full mb-2 w-full bg-white dark:bg-brand-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                                {quote.status !== 'Awaiting Parts' && <button onClick={() => {onUpdateStatus(quote.id, 'Awaiting Parts'); setIsMenuOpen(false);}} className="workflow-menu-item">{t('moveToAwaitingParts')}</button>}
                                {quote.status !== 'Work In Progress' && <button onClick={() => {onUpdateStatus(quote.id, 'Work In Progress'); setIsMenuOpen(false);}} className="workflow-menu-item">{t('moveToWorkInProgress')}</button>}
                                <button onClick={() => {onUpdateStatus(quote.id, 'Ready for Pickup'); setIsMenuOpen(false);}} className="workflow-menu-item">{t('moveToReadyForPickup')}</button>
                            </div>
                        )}
                    </div>
                );
             case 'Ready for Pickup':
                return (
                    <div className="flex flex-col gap-2">
                        <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder={t('mileagePlaceholder')} className="block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"/>
                        <button onClick={() => onUpdateStatus(quote.id, 'Completed', parseInt(mileage))} disabled={!mileage} className="workflow-button bg-green-600 hover:bg-green-700">{t('markCompleteButton')}</button>
                    </div>
                );
            case 'Completed':
                 return <button onClick={() => onOpenPaymentModal(quote)} className="workflow-button bg-purple-600 hover:bg-purple-700">{t('recordPaymentButton')}</button>;
            default:
                return null;
        }
    };
    
    return <div className="mt-4">{renderActions()}</div>;
};


export const QuoteDisplay: React.FC<QuoteDisplayProps> = ({ quote, inventoryParts, technicians, customers, vehicles, shopSettings, onSave, onClose, onUpdateQuote, onUpdateStatus, onDeleteQuote, onUpdateNotes, onSchedule, onViewAppointment, onOpenPaymentModal, onAssignTechnician, onOpenInvoice, onOpenJobCard, onApplyDiscount, onSendMessage }) => {
  const { t, formatCurrency, formatDate, formatAppointmentDate } = useLocalization();
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editableNotes, setEditableNotes] = useState(quote.notes);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editableQuote, setEditableQuote] = useState<typeof quote | null>(null);

  const customer = useMemo(() => customers.find(c => c.id === quote.customerId), [customers, quote.customerId]);
  
  const totalPaid = useMemo(() => {
    return quote.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  }, [quote.payments]);

  const amountDue = useMemo(() => {
    const totalCost = quote.totalCost - (quote.discountAmount || 0);
    return totalCost - totalPaid;
  }, [quote.totalCost, quote.discountAmount, totalPaid]);

  const stockAvailability = useMemo(() => {
    if (!quote.id) return { isAvailable: true, unavailableParts: [] }; // Draft quotes don't check stock

    const unavailable: string[] = [];
    for (const service of quote.services) {
        for (const part of service.parts) {
            if (part.inventoryPartId) {
                const invPart = inventoryParts.find(p => p.id === part.inventoryPartId);
                if (!invPart || invPart.stock < part.quantity) {
                    unavailable.push(`${part.name} (need ${part.quantity}, have ${invPart?.stock || 0})`);
                }
            }
        }
    }
    return { isAvailable: unavailable.length === 0, unavailableParts: unavailable };
  }, [quote, inventoryParts]);

  const compatibleInventoryParts = useMemo(() => {
    const vehicle = vehicles.find(v => v.id === quote.vehicleId);
    if (!vehicle?.make) {
        return inventoryParts;
    }
    
    return inventoryParts.filter(part => {
        const isUniversal = !part.compatibleBrands || part.compatibleBrands.length === 0;
        const isMakeCompatible = part.compatibleBrands?.includes(vehicle.make);
        
        return isUniversal || isMakeCompatible;
    });
  }, [quote.vehicleId, vehicles, inventoryParts]);

  const handleRedeem = () => {
    const points = parseInt(pointsToRedeem, 10);
    if(quote.id && points > 0) {
      onApplyDiscount(quote.id, points);
      setPointsToRedeem('');
    }
  }

  const handleSaveNotes = () => {
    if (quote.id) {
        onUpdateNotes(quote.id, editableNotes);
        setIsEditingNotes(false);
    }
  };

  const communicationActions = useMemo(() => {
    if (!quote.id || !customer) return [];

    const actions: {text: string, handler: () => void, type: 'primary' | 'secondary'}[] = [];

    const createAction = (type: CommunicationType) => () => {
        let templateName: string = type;
        
        if(type === 'quoteApproval') templateName = 'quoteReady';
        if(type === 'paymentReminder') templateName = 'paymentReminder';

        const subjectKey = `template_${templateName}_subject`;
        const messageKey = `template_${templateName}_message`;

        const subjectTemplate = t(subjectKey);
        const messageTemplate = t(messageKey);

        if (subjectTemplate === subjectKey || messageTemplate === messageKey) {
            console.error(`Communication templates not found for '${templateName}'`);
            return;
        }

        onSendMessage({
            customers: [customer],
            subject: subjectTemplate.replace(/\[Vehicle\]/g, quote.vehicle),
            message: messageTemplate,
            quote: quote as HydratedQuote,
            communicationType: type
        });
    };
    
    switch (quote.status) {
        case 'Saved':
            actions.push({ text: t('sendForApprovalButton'), handler: createAction('quoteApproval'), type: 'secondary' });
            break;
        case 'Ready for Pickup':
            actions.push({ text: t('notifyForPickupButton'), handler: createAction('pickupReady'), type: 'secondary' });
            break;
        case 'Completed':
            actions.push({ text: t('sendInvoiceButton'), handler: createAction('invoice'), type: 'secondary' });
            if (amountDue > 0) {
                actions.push({ text: t('sendPaymentReminderButton'), handler: createAction('paymentReminder'), type: 'secondary' });
            }
            break;
        case 'Paid':
            actions.push({ text: t('sendReceiptButton'), handler: createAction('receipt'), type: 'secondary' });
            break;
    }

    return actions;
  }, [quote, customer, amountDue, t, onSendMessage]);
  
  const completionDate = useMemo(() => {
    if (quote.appointmentDate && quote.estimatedDurationHours) {
        const startDate = new Date(quote.appointmentDate);
        startDate.setHours(startDate.getHours() + quote.estimatedDurationHours);
        return startDate;
    }
    return null;
  }, [quote.appointmentDate, quote.estimatedDurationHours]);

  // --- Editing Logic ---
  const editInputStyle = "block w-full text-sm bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:ring-brand-blue focus:border-brand-blue px-2 py-1";

  useEffect(() => {
    // If the base quote changes (e.g., from parent state), reset editing mode.
    setIsEditing(false);
    setEditableQuote(null);
  }, [quote]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditableQuote(JSON.parse(JSON.stringify(quote))); // Deep copy to avoid mutating original
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableQuote(null);
  };

  const handleSaveChanges = () => {
    if (editableQuote && editableQuote.id) {
        onUpdateQuote(editableQuote as Quote);
        setIsEditing(false);
        setEditableQuote(null);
    }
  };

  const recalculateTotals = (quoteToCalc: typeof quote) => {
    if (!shopSettings) return quoteToCalc;
    let subtotal = 0;
    const services = quoteToCalc.services.map(service => {
        const partsTotal = service.parts.reduce((sum, part) => sum + (part.quantity * part.unitPrice), 0);
        const serviceTotal = partsTotal + service.laborCost;
        subtotal += serviceTotal;
        return { ...service, serviceTotal };
    });
    const taxAmount = subtotal * shopSettings.taxRate;
    const totalCost = subtotal + taxAmount;
    return { ...quoteToCalc, services, subtotal, taxAmount, totalCost };
  };

  const handleEditableQuoteChange = (updatedQuote: typeof quote) => {
    setEditableQuote(recalculateTotals(updatedQuote));
  };
  
  const handleServiceChange = (serviceIndex: number, field: keyof ServiceItem, value: any) => {
    if (!editableQuote) return;
    const newServices = [...editableQuote.services];
    const serviceToUpdate = { ...newServices[serviceIndex] };
    
    if (field === 'laborHours' && shopSettings) {
        serviceToUpdate.laborHours = Number(value);
        serviceToUpdate.laborCost = Number(value) * shopSettings.laborRate;
    } else {
        (serviceToUpdate as any)[field] = value;
    }
    
    newServices[serviceIndex] = serviceToUpdate;
    handleEditableQuoteChange({ ...editableQuote, services: newServices });
  };
  
  const handlePartChange = (serviceIndex: number, partIndex: number, field: keyof Part, value: any) => {
      if (!editableQuote) return;
      const newServices = [...editableQuote.services];
      const newParts = [...newServices[serviceIndex].parts];
      const partToUpdate = { ...newParts[partIndex] };
      (partToUpdate as any)[field] = value;
      partToUpdate.totalPrice = partToUpdate.quantity * partToUpdate.unitPrice;
      newParts[partIndex] = partToUpdate;
      newServices[serviceIndex].parts = newParts;
      handleEditableQuoteChange({ ...editableQuote, services: newServices });
  };

  const handleAddService = () => {
    if (!editableQuote) return;
    const newService: ServiceItem = { name: 'New Service', parts: [], laborHours: 1, laborCost: shopSettings?.laborRate || 100, serviceTotal: shopSettings?.laborRate || 100 };
    handleEditableQuoteChange({ ...editableQuote, services: [...editableQuote.services, newService] });
  };
  
  const handleRemoveService = (serviceIndex: number) => {
      if (!editableQuote) return;
      const newServices = editableQuote.services.filter((_, i) => i !== serviceIndex);
      handleEditableQuoteChange({ ...editableQuote, services: newServices });
  };

  const handleAddPart = (serviceIndex: number, inventoryPartId: string) => {
    if (!editableQuote) return;
    const partToAdd = inventoryParts.find(p => p.id === inventoryPartId);
    if (!partToAdd) return;

    const newPart: Part = {
        name: partToAdd.name,
        quantity: 1,
        unitPrice: partToAdd.price,
        totalPrice: partToAdd.price,
        inventoryPartId: partToAdd.id
    };

    const newServices = [...editableQuote.services];
    newServices[serviceIndex].parts.push(newPart);
    handleEditableQuoteChange({ ...editableQuote, services: newServices });
  };

  const handleRemovePart = (serviceIndex: number, partIndex: number) => {
    if (!editableQuote) return;
    const newServices = [...editableQuote.services];
    newServices[serviceIndex].parts = newServices[serviceIndex].parts.filter((_, i) => i !== partIndex);
    handleEditableQuoteChange({ ...editableQuote, services: newServices });
  };

  if (isEditing && editableQuote) {
    // RENDER EDITING VIEW
    return (
         <div className="animate-fade-in flex flex-col h-full">
            <div className="flex justify-between items-center p-6 pb-0">
                <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{t('editQuoteButtonLabel')}</h2>
                 <div className="flex space-x-2">
                    <button onClick={handleCancelEdit} className="py-2 px-4 border border-brand-gray-300 dark:border-brand-gray-600 rounded-md text-sm font-medium">{t('cancelButton')}</button>
                    <button onClick={handleSaveChanges} className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark">{t('saveChangesButton')}</button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar space-y-4">
                {editableQuote.services.map((service, sIdx) => (
                    <div key={sIdx} className="border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg">
                        <div className="bg-brand-gray-50 dark:bg-brand-gray-700/50 p-3 flex items-center justify-between">
                             <input type="text" value={service.name} onChange={e => handleServiceChange(sIdx, 'name', e.target.value)} className="bg-transparent font-bold text-lg w-full focus:ring-0 border-0 p-1" />
                             <button onClick={() => handleRemoveService(sIdx)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full"><TrashIcon className="h-5 w-5"/></button>
                        </div>
                        <div className="p-3 space-y-3">
                            {/* Parts */}
                            {service.parts.map((part, pIdx) => (
                                <div key={pIdx} className="grid grid-cols-12 gap-2 items-center">
                                    <span className="col-span-6 text-sm">{part.name}</span>
                                    <input type="number" value={part.quantity} onChange={e => handlePartChange(sIdx, pIdx, 'quantity', Number(e.target.value))} className={`col-span-2 ${editInputStyle}`} />
                                    <input type="number" value={part.unitPrice} onChange={e => handlePartChange(sIdx, pIdx, 'unitPrice', Number(e.target.value))} className={`col-span-2 ${editInputStyle}`} />
                                    <span className="col-span-1 text-sm text-right">{formatCurrency(part.totalPrice)}</span>
                                    <button onClick={() => handleRemovePart(sIdx, pIdx)} className="col-span-1 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full flex justify-center"><XMarkIcon className="h-4 w-4"/></button>
                                </div>
                            ))}
                             {/* Add Part Dropdown */}
                            <div className="flex items-center gap-2">
                                <select onChange={e => handleAddPart(sIdx, e.target.value)} defaultValue="" className={`flex-grow ${editInputStyle}`}>
                                    <option value="" disabled>{t('addPartButton')}</option>
                                    {compatibleInventoryParts.filter(p => !service.parts.some(sp => sp.inventoryPartId === p.id)).map(p => <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>)}
                                </select>
                            </div>
                            {/* Labour */}
                            <div className="grid grid-cols-12 gap-2 items-center pt-2 border-t border-dashed border-brand-gray-200 dark:border-brand-gray-700">
                                <span className="col-span-6 text-sm font-semibold">{t('laborSectionTitle')}</span>
                                <input type="number" value={service.laborHours} onChange={e => handleServiceChange(sIdx, 'laborHours', e.target.value)} className={`col-span-2 ${editInputStyle}`} />
                                <span className="col-span-2 text-sm text-center">({formatCurrency(shopSettings?.laborRate || 0)}/hr)</span>
                                <span className="col-span-2 text-sm text-right font-semibold">{formatCurrency(service.laborCost)}</span>
                            </div>
                        </div>
                    </div>
                ))}
                 <button onClick={handleAddService} className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-600 rounded-lg text-sm text-brand-gray-500 hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50">
                    <PlusIcon className="h-4 w-4" />
                    {t('addServiceButton')}
                </button>
            </div>
             <div className="mt-4 p-6 pt-4 border-t-2 border-dashed border-brand-gray-300 dark:border-brand-gray-700 text-right space-y-1">
                 <p>{t('subtotalLabel')} {formatCurrency(editableQuote.subtotal)}</p>
                 <p>{t('taxLabel')} {formatCurrency(editableQuote.taxAmount)}</p>
                 <p className="font-bold text-lg">{t('totalCostLabel')} {formatCurrency(editableQuote.totalCost)}</p>
            </div>
         </div>
    );
  }

  // RENDER DISPLAY VIEW
  return (
    <div className="animate-fade-in flex flex-col h-full">
        <div className="flex justify-between items-start p-6 pb-2">
            <div>
                <h2 className="text-3xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{t('quoteDisplayTitle')}</h2>
                <p className="text-brand-gray-500 dark:text-brand-gray-400">{t('quoteIdLabel')}: #{quote.id || t('draftLabel')}</p>
            </div>
            {onClose && (
                <button 
                  onClick={onClose}
                  className="p-2 text-brand-gray-500 dark:text-brand-gray-400 hover:text-brand-gray-800 dark:hover:text-white hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 rounded-full transition-colors"
                  aria-label={t('closeQuoteView')}
                >
                    <XMarkIcon className="h-6 w-6"/>
                </button>
            )}
        </div>
        
        <div className="flex-grow overflow-y-auto px-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <InfoCard icon={<UserIcon className="h-6 w-6"/>} title={t('customerInfoCardTitle')}>
                    <div className='flex items-center justify-between'>
                        <span>{quote.customerName}</span>
                    </div>
                </InfoCard>
                <InfoCard icon={<CarIcon className="h-6 w-6"/>} title={t('vehicleInfoCardTitle')}>{quote.vehicle}</InfoCard>
                
                {quote.id && ['Approved', 'Work In Progress', 'Awaiting Parts', 'Ready for Pickup'].includes(quote.status) ? (
                     <InfoCard icon={<UserGroupIcon className="h-6 w-6"/>} title={t('assignTechnicianLabel')}>
                        <select
                            id="assign-tech"
                            value={quote.technicianId || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onAssignTechnician(quote.id!, e.target.value)}
                            className="w-full bg-transparent dark:bg-brand-gray-700/0 font-medium border-none focus:ring-0 p-0"
                        >
                            <option value="">{t('unassignedTechnician')}</option>
                            {technicians.map(tech => (
                                <option key={tech.id} value={tech.id}>{tech.name}</option>
                            ))}
                        </select>
                    </InfoCard>
                ) : (
                    quote.technicianName && (
                        <InfoCard icon={<UserGroupIcon className="h-6 w-6"/>} title={t('technicianInfoCardTitle')}>
                            {quote.technicianName}
                        </InfoCard>
                    )
                )}

                {quote.appointmentDate ? (
                     <InfoCard icon={<CalendarDaysIcon className="h-6 w-6"/>} title={t('appointmentInfoCardTitle')} onClick={() => onViewAppointment && onViewAppointment()}>
                        {formatAppointmentDate(quote.appointmentDate)}
                    </InfoCard>
                ) : (
                    <InfoCard icon={<CalendarIcon className="h-6 w-6"/>} title={t('estDurationInfoCardTitle')}>{t('durationHours', { hours: quote.estimatedDurationHours })}</InfoCard>
                )}
                
                <InfoCard 
                    icon={<NoteIcon className="h-6 w-6"/>} 
                    title={t('notesInfoCardTitle')}
                    editAction={quote.id && !isEditingNotes ? (
                        <button onClick={() => setIsEditingNotes(true)} className="p-1 rounded-full hover:bg-brand-gray-200 dark:hover:bg-brand-gray-600">
                            <PencilSquareIcon className="h-4 w-4" />
                        </button>
                    ) : null}
                >
                    {isEditingNotes ? (
                        <div className="mt-2">
                            <textarea
                                value={editableNotes}
                                onChange={(e) => setEditableNotes(e.target.value)}
                                rows={4}
                                className="block w-full text-sm bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:ring-brand-blue focus:border-brand-blue"
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                                <button onClick={() => setIsEditingNotes(false)} className="px-3 py-1 text-xs rounded-md border border-brand-gray-300 dark:border-brand-gray-500">{t('cancelButton')}</button>
                                <button onClick={handleSaveNotes} className="px-3 py-1 text-xs rounded-md bg-brand-blue text-white">{t('saveNotesButton')}</button>
                            </div>
                        </div>
                    ) : (
                        quote.notes
                    )}
                </InfoCard>
                
                {quote.id && (customer?.loyaltyPoints || 0) > 0 && quote.status !== 'Paid' && (
                  <div className="md:col-span-2 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-dashed border-amber-500/50">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 flex items-center mb-2">
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      {t('loyaltyProgramTitle')}
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">{t('loyaltyPointsAvailable', { points: customer.loyaltyPoints })}</p>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="number" 
                        placeholder={t('pointsToRedeemPlaceholder')}
                        value={pointsToRedeem}
                        onChange={e => setPointsToRedeem(e.target.value)}
                        max={customer.loyaltyPoints}
                        min="0"
                        className="block w-full max-w-xs px-3 py-1.5 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                      />
                      <button onClick={handleRedeem} disabled={!pointsToRedeem || parseInt(pointsToRedeem,10) <= 0} className="px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 disabled:cursor-not-allowed">
                        {t('redeemButton')}
                      </button>
                    </div>
                  </div>
                )}
            </div>

            <div className="space-y-6">
                {quote.services.map((service: ServiceItem, index: number) => (
                    <div key={index} className="border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-brand-gray-50 dark:bg-brand-gray-700/50 p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <WrenchIcon className="h-6 w-6 text-brand-blue dark:text-blue-400 mr-3"/>
                                <h3 className="text-lg font-bold text-brand-gray-800 dark:text-brand-gray-200">{service.name}</h3>
                            </div>
                            <span className="text-lg font-semibold text-brand-gray-700 dark:text-brand-gray-300">{formatCurrency(service.serviceTotal)}</span>
                        </div>

                        <div className="p-4">
                            <h4 className="font-semibold text-brand-gray-600 dark:text-brand-gray-400 mb-2 flex items-center"><TagIcon className="h-4 w-4 mr-2"/>{t('partsSectionTitle')}</h4>
                            <ul className="space-y-2 mb-4">
                                {service.parts.map((part: Part, pIndex: number) => (
                                    <li key={pIndex} className="flex justify-between items-center text-sm text-brand-gray-700 dark:text-brand-gray-300">
                                        <span className="flex items-center">
                                            {part.name} (x{part.quantity})
                                            {part.inventoryPartId && <span title={t('partFromInventoryTooltip')}><CubeIcon className="h-4 w-4 ml-2 inline-block text-purple-500"/></span>}
                                        </span>
                                        <span>{formatCurrency(part.totalPrice)}</span>
                                    </li>
                                ))}
                            </ul>

                            <h4 className="font-semibold text-brand-gray-600 dark:text-brand-gray-400 mb-2 flex items-center"><CurrencyDollarIcon className="h-4 w-4 mr-2"/>{t('laborSectionTitle')}</h4>
                             <div className="flex justify-between items-center text-sm text-brand-gray-700 dark:text-brand-gray-300">
                                <span>{service.laborHours} hour(s)</span>
                                <span>{formatCurrency(service.laborCost)}</span>
                             </div>
                        </div>
                    </div>
                ))}
            </div>

            {quote.id && quote.payments && quote.payments.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-bold text-brand-gray-800 dark:text-brand-gray-200 mb-2">{t('paymentHistoryTitle')}</h3>
                     <div className="border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg overflow-hidden">
                        <ul className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                            {quote.payments.map((payment: Payment) => (
                                <li key={payment.id} className="px-4 py-3 flex justify-between items-center bg-brand-gray-50 dark:bg-brand-gray-700/30">
                                    <div>
                                        <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{formatCurrency(payment.amount)}</p>
                                        <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{t(`paymentMethod${payment.method.replace(/\s/g, '')}` as any)}</p>
                                    </div>
                                    <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{formatDate(payment.date)}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>

        <div className="mt-8 p-6 pt-6 border-t-2 border-dashed border-brand-gray-300 dark:border-brand-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                 <div className="md:col-span-1">
                    {quote.id && <StatusDisplay status={quote.status} />}
                    {onSave && !quote.id && (
                        <button onClick={onSave} className="workflow-button bg-green-600 hover:bg-green-700 w-full">{t('saveQuoteButton')}</button>
                    )}
                     {quote.id && <WorkflowActions quote={quote as HydratedQuote} onUpdateStatus={onUpdateStatus} onOpenPaymentModal={onOpenPaymentModal!} stockAvailability={stockAvailability}/>}
                     <div className="mt-4 flex flex-col gap-2">
                        {quote.id && ['Saved', 'Approved'].includes(quote.status) && (
                            <button onClick={handleEditClick} className="workflow-button-secondary bg-gray-500 hover:bg-gray-600">
                                <PencilSquareIcon className="h-4 w-4 mr-2" />
                                {t('editQuoteButtonLabel')}
                            </button>
                        )}
                         {quote.id && !quote.appointmentId && ['Approved', 'Work In Progress', 'Awaiting Parts'].includes(quote.status) && onSchedule && (
                             <button onClick={() => onSchedule(quote as HydratedQuote)} className="workflow-button-secondary bg-teal-600 hover:bg-teal-700">{t('scheduleButton')}</button>
                         )}
                         {communicationActions.map(action => (
                            <button key={action.text} onClick={action.handler} className="workflow-button-secondary bg-cyan-600 hover:bg-cyan-700 w-full">
                                <EnvelopeIcon className="h-4 w-4 mr-2" />
                                {action.text}
                            </button>
                         ))}
                         {quote.id && ['Approved', 'Work In Progress', 'Awaiting Parts'].includes(quote.status) && (
                            <button onClick={() => onOpenJobCard(quote as HydratedQuote)} className="workflow-button-secondary bg-gray-500 hover:bg-gray-600">
                                <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                                {t('printJobCardButton')}
                            </button>
                         )}
                         {(quote.id && (quote.status === 'Completed' || quote.status === 'Paid')) && (
                            <button onClick={() => onOpenInvoice(quote as HydratedQuote)} className="workflow-button-secondary bg-gray-500 hover:bg-gray-600">
                                <PrinterIcon className="h-4 w-4 mr-2" />
                                {t('printInvoiceButton')}
                            </button>
                         )}
                         {quote.id && quote.status === 'Saved' && (
                            <button onClick={() => onDeleteQuote(quote.id!)} className="workflow-button-secondary bg-red-600 hover:bg-red-700">
                                <TrashIcon className="h-4 w-4 mr-2" />
                                {t('deleteDraftButton')}
                            </button>
                         )}
                     </div>
                 </div>
                <div className="md:col-span-2 space-y-1 text-right">
                     <div className="flex justify-between text-md text-brand-gray-600 dark:text-brand-gray-400">
                        <span className="mr-4">{t('subtotalLabel')}</span>
                        <span>{formatCurrency(quote.subtotal)}</span>
                     </div>
                     <div className="flex justify-between text-md text-brand-gray-600 dark:text-brand-gray-400">
                        <span className="mr-4">{t('taxLabel')}</span>
                        <span>{formatCurrency(quote.taxAmount)}</span>
                     </div>
                     {(quote.discountAmount || 0) > 0 && (
                        <div className="flex justify-between text-md text-amber-600 dark:text-amber-400">
                           <span className="mr-4">{t('discountLabel')}</span>
                           <span>-{formatCurrency(quote.discountAmount!)}</span>
                        </div>
                     )}
                     <div className="flex justify-between text-lg font-bold text-brand-gray-800 dark:text-brand-gray-100">
                        <span className="mr-4">{t('totalCostLabel')}</span>
                        <span>{formatCurrency(quote.totalCost - (quote.discountAmount || 0))}</span>
                     </div>
                     {totalPaid > 0 && (
                        <>
                            <div className="flex justify-between text-md text-green-600 dark:text-green-400">
                                <span className="mr-4">{t('amountPaidLabel')}</span>
                                <span>-{formatCurrency(totalPaid)}</span>
                            </div>
                        </>
                     )}
                     { amountDue > 0 &&
                        <div className="flex justify-between text-xl font-bold text-red-600 dark:text-red-400 border-t border-brand-gray-300 dark:border-brand-gray-600 mt-1 pt-1">
                            <span className="mr-4">{t('amountDueLabel')}</span>
                            <span>{formatCurrency(amountDue)}</span>
                        </div>
                     }
                </div>
            </div>
        </div>
        <style>{`
            .workflow-button { @apply flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors disabled:bg-brand-gray-400 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed; }
            .workflow-button-secondary { @apply flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors; }
            .workflow-menu-item { @apply block w-full text-left px-4 py-2 text-sm text-brand-gray-700 dark:text-brand-gray-200 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600; }
        `}</style>
    </div>
  );
};