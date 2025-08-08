import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Services ---
import { dbService } from './services/dbService';
import { LocalizationProvider, useLocalization, getInitialLanguage, supportedLanguages } from './services/localization';

// --- Components & Modals ---
import { Header } from './Header';
import { QuoteDisplay } from './components/QuoteDisplay';
import { CustomerModal } from './components/CustomerModal';
import { VehicleModal } from './components/VehicleModal';
import { PartModal } from './components/PartModal';
import { TechnicianModal } from './components/TechnicianModal';
import { AppointmentModal } from './components/AppointmentModal';
import { PaymentModal } from './components/PaymentModal';
import { InvoiceView } from './components/InvoiceView';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { MaintenanceScheduleModal } from './components/MaintenanceScheduleModal';
import { CommunicationModal } from './components/CommunicationModal';
import { JobCardView } from './components/JobCardView';


// --- Views ---
import { DashboardView } from './components/DashboardView';
import { JobsView } from './components/JobsView';
import { CustomerVehicleView } from './components/CustomerVehicleView';
import { InventoryView } from './components/InventoryView';
import { TechnicianView } from './components/TechnicianView';
import { SchedulerView } from './components/SchedulerView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { CommunicationsView } from './components/CommunicationsView';
import { ApiView } from './components/ApiView';
import { QuotesView } from './components/QuotesView';


// --- Icons ---
import { WrenchScrewdriverIcon, ChartBarIcon, Cog6ToothIcon, UsersIcon, CubeIcon, CalendarDaysIcon, UserGroupIcon, Squares2X2Icon, MegaphoneIcon, CodeBracketIcon, DocumentPlusIcon } from './Icon';

// --- Types ---
import type { 
    Customer, Vehicle, Quote, HydratedQuote, Appointment, HydratedAppointment, InventoryPart, 
    Technician, Language, UISettings, ShopSettings, Photo, DraftQuote, QuoteStatus, Payment, Invoice,
    CommunicationLog, MaintenanceSchedule, VehicleMaintenance, Notification, CommunicationModalData, CommunicationType,
    JobCardData
} from './types';

// ===================================================================================
// Helper Components
// ===================================================================================

const LoadingSpinner: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="fixed inset-0 bg-brand-gray-100 dark:bg-brand-gray-900 z-50 flex items-center justify-center animate-fade-in">
        <div className="text-center">
            <Cog6ToothIcon className="h-12 w-12 text-brand-blue dark:text-blue-400 mx-auto animate-spin" />
            <h2 className="mt-4 text-xl font-bold text-brand-gray-800 dark:text-brand-gray-200">{title}</h2>
            <p className="mt-2 text-brand-gray-600 dark:text-brand-gray-400">{description}</p>
        </div>
    </div>
);

const ErrorDisplay: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => {
    const { t } = useLocalization();
    return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400">{t('errorTitle')}</h3>
            <p className="mt-2 text-sm text-brand-gray-600 dark:text-brand-gray-300">{message}</p>
            {onRetry && (
                 <button onClick={onRetry} className="mt-4 px-4 py-2 bg-brand-blue text-white rounded-md">Try Again</button>
            )}
        </div>
    </div>
)};

const AppContent: React.FC<{
    uiSettings: UISettings;
    onToggleTheme: () => void;
}> = ({ uiSettings, onToggleTheme }) => {
    // ===================================================================================
    // State Management
    // ===================================================================================
    const { t, language, formatTime, formatCurrency, formatAppointmentDate, formatDate } = useLocalization();
    const [isLoading, setIsLoading] = useState(true);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data stores
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [inventoryParts, setInventoryParts] = useState<InventoryPart[]>([]);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
    const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
    const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
    const [vehicleMaintenance, setVehicleMaintenance] = useState<VehicleMaintenance[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // UI State
    const [selectedTab, setSelectedTab] = useState<string>('dashboard');
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
    const [draftQuote, setDraftQuote] = useState<DraftQuote | null>(null);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
    const [initialVehicleCustomerId, setInitialVehicleCustomerId] = useState<string | null>(null);
    const [quoteToSchedule, setQuoteToSchedule] = useState<(HydratedQuote & { initialDate?: string }) | null>(null);
    const [quoteToPay, setQuoteToPay] = useState<HydratedQuote | null>(null);
    const [invoiceToShow, setInvoiceToShow] = useState<Invoice | null>(null);
    const [jobCardToShow, setJobCardToShow] = useState<JobCardData | null>(null);
    const [photoToShow, setPhotoToShow] = useState<{vehicleId: string, photo: Photo} | null>(null);
    const [communicationModalData, setCommunicationModalData] = useState<CommunicationModalData | null>(null);
    const [receiptToSendForQuoteId, setReceiptToSendForQuoteId] = useState<string | null>(null);
    const [partToEdit, setPartToEdit] = useState<InventoryPart | null>(null);

    // Modal State
    const [modalState, setModalState] = useState({
        isCustomerModalOpen: false,
        isVehicleModalOpen: false,
        isPartModalOpen: false,
        isTechnicianModalOpen: false,
        isMaintScheduleModalOpen: false,
    });
    
    // ===================================================================================
    // Data Loading and Initialization
    // ===================================================================================
    const loadAllData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // All dbService calls now fetch from the backend API
            const [
                loadedCustomers, loadedVehicles, loadedQuotes, loadedAppointments, 
                loadedParts, loadedTechs, loadedSettings, loadedLogs,
                loadedMaintSchedules, loadedVehicleMaint
            ] = await Promise.all([
                dbService.getAllCustomers(), dbService.getAllVehicles(), dbService.getAllQuotes(),
                dbService.getAllAppointments(), dbService.getAllInventoryParts(), dbService.getAllTechnicians(),
                dbService.getShopSettings(), dbService.getAllCommunicationLogs(),
                dbService.getAllMaintenanceSchedules(), dbService.getAllVehicleMaintenance()
            ]);
            
            setCustomers(loadedCustomers);
            setVehicles(loadedVehicles);
            setQuotes(loadedQuotes);
            setAppointments(loadedAppointments);
            setInventoryParts(loadedParts);
            setTechnicians(loadedTechs);
            setShopSettings(loadedSettings);
            setCommunicationLogs(loadedLogs as CommunicationLog[]);
            setMaintenanceSchedules(loadedMaintSchedules);
            setVehicleMaintenance(loadedVehicleMaint as VehicleMaintenance[]);

            setIsDataLoaded(true);
        } catch (err) {
            console.error(err);
            setError(t('errorFailedToLoad'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    useEffect(() => {
        const newNotifications: Notification[] = [];
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Appointment Reminders
        appointments.forEach(app => {
            const appDate = new Date(app.dateTime);
            if (appDate > now && appDate <= twentyFourHoursFromNow) {
                const customer = customers.find(c => c.id === app.customerId);
                const vehicle = vehicles.find(v => v.id === app.vehicleId);
                if (customer && vehicle) {
                    newNotifications.push({
                        id: `noti-app-${app.id}`,
                        type: 'APPOINTMENT_REMINDER',
                        message: t('notificationAppointment', { customer: customer.name, time: formatTime(app.dateTime) }),
                        customerId: customer.id,
                        customerName: customer.name,
                        vehicleId: app.vehicleId,
                        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                        appointmentId: app.id,
                        dueDate: app.dateTime,
                    });
                }
            }
        });

        // Payment Reminders
        quotes.forEach(quote => {
            const totalPaid = quote.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
            const amountDue = quote.totalCost - (quote.discountAmount || 0) - totalPaid;
            if (quote.status === 'Completed' && amountDue > 0) {
                const customer = customers.find(c => c.id === quote.customerId);
                const vehicle = vehicles.find(v => v.id === quote.vehicleId);
                if (customer && vehicle) {
                     newNotifications.push({
                        id: `noti-pay-${quote.id}`,
                        type: 'PAYMENT_REMINDER',
                        message: t('notificationPayment', { customer: customer.name, amount: formatCurrency(amountDue) }),
                        customerId: customer.id,
                        customerName: customer.name,
                        vehicleId: quote.vehicleId,
                        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                        quoteId: quote.id,
                    });
                }
            }
        });

        setNotifications(newNotifications);

    }, [appointments, quotes, customers, vehicles, t, formatCurrency, formatTime]);


    // ===================================================================================
    // Data Hydration (for display purposes)
    // ===================================================================================
    const hydratedQuotes = useMemo<HydratedQuote[]>(() => {
        return quotes
            .map(quote => {
                const customer = customers.find(c => c.id === quote.customerId);
                const vehicle = vehicles.find(v => v.id === quote.vehicleId);
                const appointment = appointments.find(a => a.id === quote.appointmentId);
                const technician = technicians.find(t => t.id === quote.technicianId);
                return {
                    ...quote,
                    customerName: customer?.name || 'Unknown Customer',
                    vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle',
                    appointmentDate: appointment?.dateTime,
                    technicianName: technician?.name
                };
            })
            .sort((a,b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]));
    }, [quotes, customers, vehicles, appointments, technicians]);

    const hydratedAppointments = useMemo<HydratedAppointment[]>(() => {
        return appointments.map(app => {
            const quote = hydratedQuotes.find(q => q.id === app.quoteId);
            return {
                ...app,
                customerName: quote?.customerName || 'N/A',
                vehicle: quote?.vehicle || 'N/A',
                serviceName: quote?.services[0]?.name || t('generalService'),
                technicianName: quote?.technicianName
            }
        });
    }, [appointments, hydratedQuotes, t]);
    
    const selectedQuote = useMemo(() => {
        if (draftQuote) {
            const customer = customers.find(c => c.id === draftQuote.customerId);
            const vehicle = vehicles.find(v => v.id === draftQuote.vehicleId);
            return {
                ...draftQuote,
                customerName: customer?.name || 'N/A',
                vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'N/A',
            };
        }
        return hydratedQuotes.find(q => q.id === selectedQuoteId) || null;
    }, [selectedQuoteId, draftQuote, hydratedQuotes, customers, vehicles]);

    // ===================================================================================
    // Handlers
    // ===================================================================================

    const handleGenerateQuote = async (formData: { customerId: string, vehicleId: string }, serviceRequest: string) => {
        setIsGenerating(true);
        setError(null);
        try {
            const newQuoteData = await dbService.generateQuote(formData.customerId, formData.vehicleId, serviceRequest);
            
            setDraftQuote({ ...newQuoteData, customerId: formData.customerId, vehicleId: formData.vehicleId });
            setSelectedQuoteId(null); // Ensure we're viewing the draft
        } catch (err) {
            console.error(err);
            setError(t('errorFailedToGenerate'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveDraftQuote = async () => {
        if (!draftQuote) return;
        try {
            const newQuote = await dbService.createQuote(draftQuote);
            setQuotes(prev => [newQuote, ...prev]);
            setDraftQuote(null);
            setSelectedQuoteId(newQuote.id);
        } catch (err) {
            console.error(err);
            setError(t('errorFailedToSaveQuote'));
        }
    };
    
    const handleSaveCustomer = async (customerData: Customer | Omit<Customer, 'id'>) => {
        try {
            const savedCustomer = await dbService.putCustomer(customerData);
            setCustomers(prev => 'id' in customerData
                ? prev.map(c => c.id === savedCustomer.id ? savedCustomer : c)
                : [savedCustomer, ...prev]
            );
            setModalState(prev => ({...prev, isCustomerModalOpen: false}));
        } catch (err) {
            console.error(err);
            setError(t('errorFailedToSaveCustomer'));
        }
    };

    const handleSaveOrUpdateVehicle = async (vehicleData: Vehicle | Omit<Vehicle, 'id' | 'customerId'>, customerIdForNew: string) => {
        try {
            const customerId = 'id' in vehicleData ? vehicleData.customerId : customerIdForNew;
            const savedVehicle = await dbService.putVehicle(vehicleData, customerId);

            setVehicles(prev => 'id' in vehicleData
                ? prev.map(v => v.id === savedVehicle.id ? savedVehicle : v)
                : [savedVehicle, ...prev]
            );
            setModalState(prev => ({...prev, isVehicleModalOpen: false}));
            setVehicleToEdit(null);
        } catch (err) {
            console.error(err);
            setError(t('errorFailedToSaveVehicle'));
        }
    };

    const handleSavePart = async (partData: InventoryPart | Omit<InventoryPart, 'id'>) => {
        try {
            const savedPart = await dbService.putInventoryPart(partData);
            setInventoryParts(prev => 'id' in partData
                ? prev.map(p => p.id === savedPart.id ? savedPart : p)
                : [savedPart, ...prev]
            );
            setModalState(prev => ({...prev, isPartModalOpen: false}));
            setPartToEdit(null);
        } catch (err) {
            console.error(err);
            setError(t('errorFailedToSavePart'));
        }
    };

    const handleSaveTechnician = async (techData: Omit<Technician, 'id' | 'availability'>) => {
        try {
            const newTech = await dbService.putTechnician(techData);
            setTechnicians(prev => [newTech, ...prev]);
            setModalState(prev => ({...prev, isTechnicianModalOpen: false}));
        } catch (err) {
            console.error(err);
            setError(t('errorFailedToSaveTechnician'));
        }
    };

     const handleSaveTechnicianChanges = async (updatedTechnicians: Technician[]) => {
        try {
            await dbService.putMultipleTechnicians(updatedTechnicians);
            setTechnicians(updatedTechnicians);
        } catch(err) {
            console.error(err);
            setError(t('errorFailedToSaveTechnician'));
        }
    };

    const handleUpdateQuote = async (updatedQuote: Quote) => {
        try {
            const savedQuote = await dbService.putQuote(updatedQuote);
            setQuotes(prev => prev.map(q => q.id === savedQuote.id ? savedQuote : q));
        } catch (err) {
            console.error(err);
            setError(t('errorFailedToUpdateQuote'));
        }
    };

    const handleUpdateQuoteStatus = async (quoteId: string, status: QuoteStatus, mileage?: number) => {
        try {
            const updatedQuote = await dbService.updateQuoteStatus(quoteId, status, mileage);
            // The API might return updated related data (e.g. customer points)
            // It's simplest to just refetch all data to stay in sync
            await loadAllData();
            // If we have a selected quote, ensure it's updated in the view
            if (selectedQuoteId === quoteId && draftQuote === null) {
                const refreshedQuote = await dbService.getQuote(quoteId);
                const customer = await dbService.getCustomer(refreshedQuote.customerId);
                const vehicle = await dbService.getVehicle(refreshedQuote.vehicleId);
                // this is complex, easier to just reload for now.
            }
        } catch(err) {
            console.error(err);
            setError(t('errorFailedToUpdateQuote'));
        }
    };
    
    const handleDeleteQuote = async (quoteId: string) => {
        if (window.confirm(t('deleteQuoteConfirm'))) {
            try {
                await dbService.deleteQuote(quoteId);
                setQuotes(prev => prev.filter(q => q.id !== quoteId));
                setAppointments(prev => prev.filter(a => a.quoteId !== quoteId));
                setSelectedQuoteId(null);
            } catch (err) {
                console.error(err);
                setError(t('errorFailedToDeleteQuote'));
            }
        }
    };

    const handleUpdateQuoteNotes = async (quoteId: string, newNotes: string) => {
        try {
            const updatedQuote = await dbService.updateQuoteNotes(quoteId, newNotes);
            setQuotes(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));
        } catch (err) {
            console.error(err);
            setError(t('errorFailedToUpdateQuote'));
        }
    };
    
    const handleSaveAppointment = async (quoteId: string, dateTime: string) => {
        try {
            const { appointment: newAppointment, quote: updatedQuote } = await dbService.createAppointment(quoteId, dateTime);
            setAppointments(prev => [newAppointment, ...prev]);
            setQuotes(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));
            setQuoteToSchedule(null);
        } catch(err) {
            console.error(err);
            setError(t('errorFailedToSaveAppointment'));
        }
    };

    const handleUpdateAppointmentDate = async (appointmentId: string, newDateISO: string) => {
        try {
            const updatedAppointment = await dbService.updateAppointmentDate(appointmentId, newDateISO);
            setAppointments(prev => prev.map(a => a.id === appointmentId ? updatedAppointment : a));
        } catch(err) {
            console.error(err);
            setError(t('errorFailedToUpdateAppointment'));
        }
    };
    
    const handleSavePayment = async (quoteId: string, paymentData: Omit<Payment, 'id'>, sendReceipt: boolean) => {
        try {
            const updatedQuote = await dbService.createPayment(quoteId, paymentData);
            setQuotes(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));

            if (updatedQuote.status === 'Paid') {
                await loadAllData(); // reload to get updated customer points etc.
                if (sendReceipt) {
                    setReceiptToSendForQuoteId(quoteId);
                }
            }
            setQuoteToPay(null);
        } catch(err) {
             console.error(err);
             setError(t('errorFailedToSavePayment'));
        }
    };

    const handleAssignTechnician = async (quoteId: string, technicianId: string) => {
        try {
            const updatedQuote = await dbService.assignTechnician(quoteId, technicianId);
            setQuotes(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));
            // Also update appointments in case it's displayed on scheduler
            await loadAllData();
        } catch(err) {
            console.error(err);
            setError(t('errorFailedToAssignTechnician'));
        }
    };
    
    const handleOpenInvoice = (quote: HydratedQuote) => {
        const customer = customers.find(c => c.id === quote.customerId);
        const vehicleDetails = vehicles.find(v => v.id === quote.vehicleId);
        if (customer && vehicleDetails) {
            setInvoiceToShow({ ...quote, customer, vehicleDetails });
        }
    };

    const handleOpenJobCard = (quote: HydratedQuote) => {
        const customer = customers.find(c => c.id === quote.customerId);
        const vehicleDetails = vehicles.find(v => v.id === quote.vehicleId);
        if (customer && vehicleDetails) {
            setJobCardToShow({ ...quote, customer, vehicleDetails });
        }
    };

    const handleAddVehiclePhotos = async (vehicleId: string, photos: Photo[]) => {
        try {
            const updatedVehicle = await dbService.addVehiclePhotos(vehicleId, photos);
            setVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
        } catch (err) {
            console.error(err);
            setError(t('errorFailedToSaveVehicle'));
        }
    };

    const handleDeleteVehiclePhoto = async (vehicleId: string, photoId: string) => {
        if (!window.confirm(t('deletePhotoConfirm'))) return;
        try {
            const updatedVehicle = await dbService.deleteVehiclePhoto(vehicleId, photoId);
            setVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
            setPhotoToShow(null);
        } catch (err) {
            console.error(err);
             setError(t('errorFailedToDeletePhoto'));
        }
    };
    
    const handleApplyDiscount = async (quoteId: string, pointsToRedeem: number) => {
        try {
            const { quote: updatedQuote, customer: updatedCustomer } = await dbService.applyDiscount(quoteId, pointsToRedeem);
            setQuotes(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));
            setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        } catch (err) {
            console.error(err);
            setError(t('errorFailedToApplyDiscount'));
        }
    };

    const handleSendMessage = async (customerIds: string[], subject: string, message: string) => {
        const recipients = customers
            .filter(c => customerIds.includes(c.id))
            .map(c => c.email);
    
        if (recipients.length === 0 || recipients.some(r => !r)) {
            setError(t('errorNoRecipientEmail'));
            return;
        }
    
        const mailtoLink = `mailto:${recipients.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.open(mailtoLink);

        try {
            const newLog = await dbService.createCommunicationLog(customerIds, subject, message);
            setCommunicationLogs(prev => [newLog, ...prev]);
        } catch (err) {
             console.error(err);
             setError(t('errorFailedToSaveLog'));
        }
    };

    const handleSaveMaintSchedule = async (scheduleData: Omit<MaintenanceSchedule, 'id'>) => {
        try {
            const newSchedule = await dbService.putMaintenanceSchedule(scheduleData);
            setMaintenanceSchedules(prev => [...prev, newSchedule]);
            setModalState(p => ({ ...p, isMaintScheduleModalOpen: false }));
        } catch (err) {
            console.error(err);
            setError(t('errorFailedToSaveMaintSchedule'));
        }
    };

    const handleSaveSettings = async (newSettings: ShopSettings) => {
        try {
            const savedSettings = await dbService.putShopSettings(newSettings);
            setShopSettings(savedSettings);
        } catch(err) {
             console.error(err);
             setError(t('errorFailedToSaveSettings'));
             throw err; // Re-throw for the component to handle UI state
        }
    };
    
    // Data Backup & Restore
    const handleBackup = async () => {
        try {
            const data = await dbService.exportAllData();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `autorepair-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            alert(t('backupSuccess'));
        } catch(e) {
            console.error(e);
            alert(t('backupError'));
        }
    };

    const handleRestore = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            if (!window.confirm(t('restoreConfirm'))) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    await dbService.clearAndImportData(data);
                    alert(t('restoreSuccess'));
                    window.location.reload();
                } catch(err) {
                    console.error(err);
                    alert(t('restoreError'));
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleScheduleDroppedJob = useCallback((quoteId: string, date: string) => {
        const quote = hydratedQuotes.find(q => q.id === quoteId);
        if (quote) {
            setQuoteToSchedule({ ...quote, initialDate: date });
        }
    }, [hydratedQuotes]);

    const handleOpenCommunicationModal = useCallback((data: CommunicationModalData) => {
        const { customers: modalCustomers, quote, appointment, communicationType } = data;
        let populatedMessage = data.message;
        const customer = modalCustomers[0];
    
        if (customer) {
          populatedMessage = populatedMessage.replace(/\[CustomerName\]/g, customer.name);
        }

        const generateDetails = (isReceipt: boolean) => {
            if (!quote) return '';
            const totalPaid = quote.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
            const amountDue = quote.totalCost - (quote.discountAmount || 0) - totalPaid;
            const detailsParts: string[] = [];
            
            const headerKey = communicationType === 'quoteApproval' ? 'quoteDetailsHeader' : (isReceipt ? 'receiptDetailsHeader' : 'invoiceDetailsHeader');
            detailsParts.push(`${t(headerKey)}`);
            detailsParts.push('--------------------------------');
            
            quote.services.forEach(service => {
                detailsParts.push(`${t('serviceLabel')}: ${service.name}`);
                service.parts.forEach(part => {
                    detailsParts.push(`  - ${part.name} (x${part.quantity}): ${formatCurrency(part.totalPrice)}`);
                });
                detailsParts.push(`  - ${t('laborSectionTitle')} (${service.laborHours} ${t('hoursLabel')}): ${formatCurrency(service.laborCost)}`);
                detailsParts.push(``); // Blank line
            });
            
            detailsParts.push('--------------------------------');
            detailsParts.push(`${t('subtotalLabel')} ${formatCurrency(quote.subtotal)}`);
            detailsParts.push(`${t('taxLabel')} ${formatCurrency(quote.taxAmount)}`);
            if (quote.discountAmount && quote.discountAmount > 0) {
                 detailsParts.push(`${t('discountLabel')} -${formatCurrency(quote.discountAmount)}`);
            }
            detailsParts.push(`${t('totalCostLabel')} ${formatCurrency(quote.totalCost - (quote.discountAmount || 0))}`);
            
            if (communicationType === 'invoice' || communicationType === 'receipt') {
                detailsParts.push('--------------------------------');
                quote.payments?.forEach(p => {
                     detailsParts.push(`${t('paidOnLabel')} ${formatDate(p.date)} (${t(`paymentMethod${p.method.replace(/\s/g, '')}` as any)}): -${formatCurrency(p.amount)}`);
                });
                 if (totalPaid > 0) {
                    detailsParts.push(`${t('amountPaidLabel')} -${formatCurrency(totalPaid)}`);
                }
            }
            detailsParts.push(`${t('amountDueLabel')} ${formatCurrency(amountDue)}`);
            return detailsParts.join('\n');
        }

        if (quote) {
          const totalPaid = quote.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
          const amountDue = quote.totalCost - (quote.discountAmount || 0) - totalPaid;
          populatedMessage = populatedMessage.replace(/\[Vehicle\]/g, quote.vehicle);
          populatedMessage = populatedMessage.replace(/\[QuoteID\]/g, quote.id);
          populatedMessage = populatedMessage.replace(/\[AmountDue\]/g, formatCurrency(amountDue));

          if (populatedMessage.includes('[QuoteDetails]')) {
              populatedMessage = populatedMessage.replace(/\[QuoteDetails\]/g, generateDetails(false));
          }
          if (populatedMessage.includes('[InvoiceDetails]')) {
              populatedMessage = populatedMessage.replace(/\[InvoiceDetails\]/g, generateDetails(communicationType === 'receipt'));
          }
        }
        if (appointment) {
          populatedMessage = populatedMessage.replace(/\[Vehicle\]/g, appointment.vehicle);
          populatedMessage = populatedMessage.replace(/\[AppointmentDate\]/g, formatAppointmentDate(appointment.dateTime));
        }
        populatedMessage = populatedMessage.replace(/\[ShopName\]/g, shopSettings?.shopName || 'The Auto Shop');
    
        setCommunicationModalData({
            ...data,
            message: populatedMessage
        });
    }, [formatCurrency, formatAppointmentDate, shopSettings?.shopName, t, formatDate]);

    // Effect to trigger sending a receipt after payment
    useEffect(() => {
        if (receiptToSendForQuoteId) {
            const quote = hydratedQuotes.find(q => q.id === receiptToSendForQuoteId);
            const customer = customers.find(c => c.id === quote?.customerId);
            if (quote && customer) {
                const subjectTemplate = t('template_receipt_subject');
                const messageTemplate = t('template_receipt_message');
                if (subjectTemplate && !subjectTemplate.startsWith('template_')) {
                    handleOpenCommunicationModal({
                        customers: [customer],
                        subject: subjectTemplate.replace(/\[Vehicle\]/g, quote.vehicle),
                        message: messageTemplate,
                        quote: quote,
                        communicationType: 'receipt'
                    });
                }
            }
            setReceiptToSendForQuoteId(null);
        }
    }, [receiptToSendForQuoteId, hydratedQuotes, customers, t, handleOpenCommunicationModal]);

    const handleOpenPartEditor = (part: InventoryPart) => {
        setPartToEdit(part);
        setModalState(prev => ({ ...prev, isPartModalOpen: true }));
    };

    // ===================================================================================
    // Render Logic
    // ===================================================================================

    const renderView = () => {
        switch (selectedTab) {
            case 'dashboard':
                return <DashboardView quotes={hydratedQuotes} appointments={hydratedAppointments} onSelectQuote={setSelectedQuoteId} />;
             case 'quotes':
                return <QuotesView 
                            quotes={hydratedQuotes} 
                            customers={customers}
                            vehicles={vehicles}
                            isLoading={isGenerating}
                            onSelectQuote={setSelectedQuoteId}
                            onSubmit={handleGenerateQuote}
                            onNewCustomerClick={() => setModalState(prev => ({...prev, isCustomerModalOpen: true}))}
                            onNewVehicleClick={(customerId) => { setInitialVehicleCustomerId(customerId); setModalState(prev => ({...prev, isVehicleModalOpen: true})); }}
                        />;
            case 'jobs':
                return <JobsView quotes={hydratedQuotes.filter(q => ['Work In Progress', 'Awaiting Parts', 'Ready for Pickup'].includes(q.status))} onSelectQuote={setSelectedQuoteId} onUpdateQuoteStatus={handleUpdateQuoteStatus} />;
            case 'customers':
                return <CustomerVehicleView 
                            customers={customers} 
                            vehicles={vehicles} 
                            quotes={hydratedQuotes} 
                            communicationLogs={communicationLogs}
                            maintenanceSchedules={maintenanceSchedules}
                            vehicleMaintenance={vehicleMaintenance}
                            onAddVehicleClick={(customerId) => { setInitialVehicleCustomerId(customerId); setModalState(prev => ({...prev, isVehicleModalOpen: true})); }} 
                            onSelectQuote={setSelectedQuoteId}
                            onAddVehiclePhotos={handleAddVehiclePhotos}
                            onViewPhoto={(vehicleId, photo) => setPhotoToShow({vehicleId, photo})}
                            onEditCustomer={(customer) => { setCustomerToEdit(customer); setModalState(prev => ({...prev, isCustomerModalOpen: true})); }}
                            onEditVehicle={(vehicle) => { setVehicleToEdit(vehicle); setModalState(prev => ({...prev, isVehicleModalOpen: true})); }}
                            onAddVehicleMaint={() => {}} // Placeholder
                            onSendMessage={(customer) => handleOpenCommunicationModal({customers: [customer], subject: '', message: '', communicationType: 'generic'})}
                        />;
            case 'communications':
                return <CommunicationsView customers={customers} onSendMessage={handleSendMessage} />;
            case 'scheduler':
                return <SchedulerView 
                            appointments={hydratedAppointments} 
                            quotes={hydratedQuotes}
                            technicians={technicians}
                            shopSettings={shopSettings}
                            onSelectAppointment={(app) => setSelectedQuoteId(app.quoteId)}
                            onScheduleDroppedJob={handleScheduleDroppedJob}
                            onUpdateAppointmentDate={handleUpdateAppointmentDate}
                            onUpdateAppointmentTechnician={handleAssignTechnician}
                            onRemind={(app) => {
                                const customer = customers.find(c => c.id === app.customerId);
                                const subjectTemplate = t('template_appointmentReminder_subject');
                                const messageTemplate = t('template_appointmentReminder_message');
                                if (customer && subjectTemplate && !subjectTemplate.startsWith('template_')) {
                                    handleOpenCommunicationModal({
                                        customers: [customer],
                                        subject: subjectTemplate.replace(/\[Vehicle\]/g, app.vehicle),
                                        message: messageTemplate,
                                        appointment: app,
                                        communicationType: 'appointmentReminder'
                                    });
                                }
                            }}
                        />;
            case 'inventory':
                return <InventoryView 
                          inventoryParts={inventoryParts} 
                          onAddPart={() => { setPartToEdit(null); setModalState(prev => ({...prev, isPartModalOpen: true})); }} 
                          onEditPart={handleOpenPartEditor}
                       />;
            case 'technicians':
                return <TechnicianView technicians={technicians} quotes={hydratedQuotes} onAddTechnician={() => setModalState(prev => ({...prev, isTechnicianModalOpen: true}))} onSaveTechnicians={handleSaveTechnicianChanges} />;
            case 'reports':
                return <ReportsView quotes={hydratedQuotes} onBackup={handleBackup} onRestore={handleRestore} />;
            case 'settings':
                return shopSettings ? <SettingsView initialSettings={shopSettings} onSave={handleSaveSettings} maintenanceSchedules={maintenanceSchedules} onAddMaintSchedule={() => setModalState(p => ({...p, isMaintScheduleModalOpen: true}))}/> : null;
            case 'api':
                return <ApiView quotes={hydratedQuotes} customers={customers} vehicles={vehicles} />;
            default:
                return null;
        }
    };
    
    if (!isDataLoaded || isLoading) {
        return <LoadingSpinner title={t('loadingTitle')} description={t('loadingDesc')} />;
    }

    const NavItem: React.FC<{
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
        label: string;
        tabName: string;
        currentTab: string;
        onClick: (tab: string) => void;
    }> = ({ icon: Icon, label, tabName, currentTab, onClick }) => (
        <button
            onClick={() => onClick(tabName)}
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                currentTab === tabName
                    ? 'bg-brand-lime text-black shadow-lg'
                    : 'text-brand-gray-600 dark:text-brand-gray-300 hover:bg-brand-gray-200 dark:hover:bg-brand-gray-700'
            }`}
        >
            <Icon className="h-6 w-6 mr-3" />
            <span className="font-semibold">{label}</span>
        </button>
    );

    const navItems = [
        { icon: Squares2X2Icon, label: t('dashboardTab'), tabName: 'dashboard' },
        { icon: DocumentPlusIcon, label: t('quotesTab'), tabName: 'quotes' },
        { icon: WrenchScrewdriverIcon, label: t('jobsDashboardTab'), tabName: 'jobs' },
        { icon: UsersIcon, label: t('customersTab'), tabName: 'customers' },
        { icon: MegaphoneIcon, label: t('communicationsTab'), tabName: 'communications' },
        { icon: CalendarDaysIcon, label: t('schedulerTab'), tabName: 'scheduler' },
        { icon: CubeIcon, label: t('inventoryTab'), tabName: 'inventory' },
        { icon: UserGroupIcon, label: t('techniciansTab'), tabName: 'technicians' },
        { icon: ChartBarIcon, label: t('reportsTab'), tabName: 'reports' },
        { icon: CodeBracketIcon, label: t('apiTab'), tabName: 'api'},
        { icon: Cog6ToothIcon, label: t('settingsTab'), tabName: 'settings' },
    ];

    return (
        <div className="flex flex-col h-screen">
             <Header 
                settings={uiSettings} 
                onToggleTheme={onToggleTheme} 
                shopName={shopSettings?.shopName}
                logoDataUrl={shopSettings?.logoDataUrl}
                notifications={notifications}
                onOpenCommunicationModal={handleOpenCommunicationModal}
                customers={customers}
                hydratedQuotes={hydratedQuotes}
                hydratedAppointments={hydratedAppointments}
             />
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-64 bg-white dark:bg-brand-gray-800 p-4 flex-shrink-0 flex flex-col overflow-y-auto custom-scrollbar">
                    <nav className="space-y-2">
                        {navItems.map(item => <NavItem key={item.tabName} {...item} currentTab={selectedTab} onClick={setSelectedTab} />)}
                    </nav>
                </aside>

                <main className="flex-1 flex flex-col overflow-hidden bg-brand-gray-50 dark:bg-brand-gray-900">
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                        {renderView()}
                    </div>
                </main>
            </div>
            
            {/* Slide-over for Quote Display */}
            <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${selectedQuote ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/50" onClick={() => { setSelectedQuoteId(null); setDraftQuote(null); }}></div>
                <div className={`absolute inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-brand-gray-800 border-l border-brand-gray-200 dark:border-brand-gray-700 shadow-2xl flex flex-col transform transition-transform duration-300 ${selectedQuote ? 'translate-x-0' : 'translate-x-full'}`}>
                    {selectedQuote && shopSettings && (
                        <QuoteDisplay
                            quote={selectedQuote}
                            inventoryParts={inventoryParts}
                            technicians={technicians}
                            customers={customers}
                            vehicles={vehicles}
                            shopSettings={shopSettings}
                            onSave={handleSaveDraftQuote}
                            onClose={() => { setSelectedQuoteId(null); setDraftQuote(null); }}
                            onUpdateQuote={handleUpdateQuote}
                            onUpdateStatus={handleUpdateQuoteStatus}
                            onDeleteQuote={handleDeleteQuote}
                            onUpdateNotes={handleUpdateQuoteNotes}
                            onSchedule={(quote) => setQuoteToSchedule(quote)}
                            onOpenPaymentModal={(quote) => setQuoteToPay(quote)}
                            onAssignTechnician={handleAssignTechnician}
                            onOpenInvoice={handleOpenInvoice}
                            onOpenJobCard={handleOpenJobCard}
                            onApplyDiscount={handleApplyDiscount}
                            onSendMessage={handleOpenCommunicationModal}
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            <CustomerModal isOpen={modalState.isCustomerModalOpen} onClose={() => { setModalState(prev => ({...prev, isCustomerModalOpen: false})); setCustomerToEdit(null); }} onSave={handleSaveCustomer} customerToEdit={customerToEdit}/>
            <VehicleModal isOpen={modalState.isVehicleModalOpen} onClose={() => { setModalState(prev => ({...prev, isVehicleModalOpen: false})); setVehicleToEdit(null); setInitialVehicleCustomerId(null); }} onSave={handleSaveOrUpdateVehicle} customers={customers} initialCustomerId={initialVehicleCustomerId} vehicleToEdit={vehicleToEdit} />
            <PartModal isOpen={modalState.isPartModalOpen} onClose={() => { setModalState(prev => ({...prev, isPartModalOpen: false})); setPartToEdit(null); }} onSave={handleSavePart} partToEdit={partToEdit} />
            <TechnicianModal isOpen={modalState.isTechnicianModalOpen} onClose={() => setModalState(prev => ({...prev, isTechnicianModalOpen: false}))} onSave={handleSaveTechnician} />
            {shopSettings && <AppointmentModal isOpen={!!quoteToSchedule} onClose={() => setQuoteToSchedule(null)} onSave={handleSaveAppointment} quote={quoteToSchedule} shopSettings={shopSettings} appointments={appointments} quotes={hydratedQuotes} />}
            <PaymentModal isOpen={!!quoteToPay} onClose={() => setQuoteToPay(null)} onSave={handleSavePayment} quote={quoteToPay} />
            {shopSettings && <InvoiceView isOpen={!!invoiceToShow} onClose={() => setInvoiceToShow(null)} invoice={invoiceToShow} settings={shopSettings} onSendMessage={(q, type) => handleOpenCommunicationModal({customers: [customers.find(c=>c.id === q.customerId)!], subject: t(`template_${type}_subject`), message: t(`template_${type}_message`), quote: q, communicationType: type})} />}
            {shopSettings && <JobCardView isOpen={!!jobCardToShow} onClose={() => setJobCardToShow(null)} jobCard={jobCardToShow} inventoryParts={inventoryParts} />}
            <PhotoViewerModal isOpen={!!photoToShow} onClose={() => setPhotoToShow(null)} photoData={photoToShow} onDelete={handleDeleteVehiclePhoto} />
            <MaintenanceScheduleModal isOpen={modalState.isMaintScheduleModalOpen} onClose={() => setModalState(p => ({...p, isMaintScheduleModalOpen: false}))} onSave={handleSaveMaintSchedule} />
            {shopSettings && <CommunicationModal isOpen={!!communicationModalData} onClose={() => setCommunicationModalData(null)} data={communicationModalData} shopSettings={shopSettings} onSend={handleSendMessage} />}
            {error && <ErrorDisplay message={error} onRetry={loadAllData} />}
        </div>
    );
};

const App: React.FC = () => {
    const [uiSettings, setUiSettings] = useState<UISettings>(() => {
        try {
            const saved = localStorage.getItem('settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    theme: parsed.theme || 'light',
                    language: supportedLanguages.includes(parsed.language) ? parsed.language : getInitialLanguage()
                };
            }
        } catch (error) {
            console.error("Failed to parse settings from localStorage", error);
        }
        return { theme: 'light', language: getInitialLanguage() };
    });

    useEffect(() => {
        try {
            localStorage.setItem('settings', JSON.stringify(uiSettings));
            document.documentElement.className = uiSettings.theme;
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, [uiSettings]);

    const handleToggleTheme = () => {
        setUiSettings(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
    };

    const handleLanguageChange = (lang: Language) => {
        setUiSettings(prev => ({ ...prev, language: lang }));
    };

    return (
        <LocalizationProvider initialLanguage={uiSettings.language} onLanguageChange={handleLanguageChange}>
             <div className={`font-sans antialiased text-brand-gray-900 bg-brand-gray-50 dark:bg-brand-gray-800 ${uiSettings.theme}`}>
                <AppContent uiSettings={uiSettings} onToggleTheme={handleToggleTheme} />
            </div>
        </LocalizationProvider>
    );
};

export default App;