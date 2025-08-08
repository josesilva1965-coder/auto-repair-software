import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Language } from '../types';

type Translations = Record<string, any>;

interface LocalizationContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
    formatCurrency: (amount: number) => string;
    formatDate: (dateString: string) => string;
    formatAppointmentDate: (dateString: string) => string;
    formatShortDateTime: (dateString: string) => string;
    formatWeekDate: (date: Date) => string;
    formatShortWeekday: (date: Date) => string;
    formatTime: (dateString: string) => string;
    templates: Translations;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

const supportedLanguages: Language[] = ['en-GB', 'es-ES', 'fr-FR', 'pt-PT'];

const getInitialLanguage = (): Language => {
    if (typeof window !== 'undefined') {
        const savedSettings = localStorage.getItem('settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (supportedLanguages.includes(settings.language)) {
                return settings.language;
            }
        }
        const browserLang = navigator.language;
        if (browserLang.startsWith('en')) return 'en-GB';
        const matchedLang = supportedLanguages.find(lang => browserLang.startsWith(lang.split('-')[0]));
        if (matchedLang) {
            return matchedLang;
        }
    }
    return 'en-GB';
};


export const LocalizationProvider: React.FC<{ children: React.ReactNode, initialLanguage: Language, onLanguageChange: (lang: Language) => void }> = ({ children, initialLanguage, onLanguageChange }) => {
    const [language, setLanguageState] = useState<Language>(initialLanguage);
    const [translations, setTranslations] = useState<Translations>({});

    useEffect(() => {
        const fetchTranslations = async () => {
            try {
                const response = await fetch(`/locales/${language}.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load translations for ${language}`);
                }
                const data = await response.json();
                setTranslations(data);
            } catch (error) {
                console.error(error);
                // Fallback to English if the desired language file fails
                const response = await fetch(`/locales/en-GB.json`);
                const data = await response.json();
                setTranslations(data);
            }
        };
        fetchTranslations();
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        onLanguageChange(lang);
    };

    const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
        let translation = translations[key] || key;
        if (replacements) {
            Object.keys(replacements).forEach(placeholder => {
                translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
            });
        }
        return translation;
    }, [translations]);

    const formatCurrency = (amount: number) => {
        const currencyMap: Record<Language, string> = {
            'en-GB': 'GBP',
            'es-ES': 'EUR',
            'fr-FR': 'EUR',
            'pt-PT': 'EUR',
        };
        const currency = currencyMap[language];
        return new Intl.NumberFormat(language, { style: 'currency', currency }).format(amount);
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' });
    const formatAppointmentDate = (dateString: string) => new Date(dateString).toLocaleString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: language === 'en-GB' });
    const formatShortDateTime = (dateString: string) => new Date(dateString).toLocaleString(language, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: language === 'en-GB' });
    const formatWeekDate = (date: Date) => new Intl.DateTimeFormat(language, { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
    const formatShortWeekday = (date: Date) => new Intl.DateTimeFormat(language, { weekday: 'short' }).format(date);
    const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString(language, { hour: 'numeric', minute: '2-digit', hour12: language === 'en-GB' });
    
    const value = { language, setLanguage, t, formatCurrency, formatDate, formatAppointmentDate, formatShortDateTime, formatWeekDate, formatShortWeekday, formatTime, templates: translations };

    return React.createElement(LocalizationContext.Provider, { value }, children);
};

export const useLocalization = (): LocalizationContextType => {
    const context = useContext(LocalizationContext);
    if (context === undefined) {
        throw new Error('useLocalization must be used within a LocalizationProvider');
    }
    return context;
};

export { getInitialLanguage, supportedLanguages };
