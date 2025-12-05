import mn from '@/locales/mn.json';
import kg from '@/locales/kg.json';
import en from '@/locales/en.json';
import { COUNTRIES, CountryCode, DEFAULT_COUNTRY } from './constants';

const translations = {
    mn,
    kg,
    en
};

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof mn.common | keyof typeof mn.dashboard | keyof typeof mn.product;

// Simple hook to get translations based on current country/locale
// In a real app, this would use Context or Next-Intl
export const getTranslation = (locale: Locale) => {
    return translations[locale] || translations.mn;
};

// Helper to format currency
export const formatCurrency = (amount: number, countryCode: CountryCode) => {
    const config = COUNTRIES[countryCode] || COUNTRIES[DEFAULT_COUNTRY];
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: config.currency,
        currencyDisplay: 'narrowSymbol'
    }).format(amount).replace(config.currency, config.currencySymbol); // Fallback if symbol not supported
};

// Helper to detect country from hostname (for Middleware)
export const getCountryFromHostname = (hostname: string): CountryCode => {
    if (hostname.includes('.kg')) return 'KG';
    if (hostname.includes('.mn')) return 'MN';
    return 'MN'; // Default
};
