export type CountryCode = 'MN' | 'KG';

export interface CountryConfig {
    code: CountryCode;
    name: string;
    currency: string;
    currencySymbol: string;
    phoneCode: string;
    flag: string;
    locales: string[];
    defaultLocale: string;
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
    MN: {
        code: 'MN',
        name: 'Mongolia',
        currency: 'MNT',
        currencySymbol: '₮',
        phoneCode: '+976',
        flag: '🇲🇳',
        locales: ['mn', 'en'],
        defaultLocale: 'mn'
    },
    KG: {
        code: 'KG',
        name: 'Kyrgyzstan',
        currency: 'KGS',
        currencySymbol: 'с',
        phoneCode: '+996',
        flag: '🇰🇬',
        locales: ['kg', 'ru', 'en'],
        defaultLocale: 'kg'
    }
};

export const DEFAULT_COUNTRY: CountryCode = 'MN';

export const getCountryConfig = (code: string): CountryConfig => {
    return COUNTRIES[code as CountryCode] || COUNTRIES[DEFAULT_COUNTRY];
};

// --- Legacy Constants (Restored for compatibility) ---

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const STORAGE_KEYS = {
    USER_PROFILE: 'userProfile',
    USER_ROLE: 'userRole',
    USER_SUBSCRIPTION: 'userSubscription',
    MY_ADS: 'my_ads',
    FAVORITES: 'favorites',
    MODERATION_HISTORY: 'moderation_history',
    APPEALS: 'appeals',
    REPORTS: 'reports'
};

export const EVENTS = {
    PROFILE_UPDATED: 'profileUpdated',
    STORAGE: 'storage',
    ADS_UPDATED: 'adsUpdated',
    FAVORITES_UPDATED: 'favoritesUpdated',
    ROLE_UPDATED: 'roleUpdated',
    MODERATION_ACTION: 'moderationAction',
    REPORT_SUBMITTED: 'reportSubmitted'
};

// Moderation Constants
export const REPORT_DEADLINE_DAYS = 3;
export const APPEAL_DEADLINE_DAYS = 7;
export const REPORT_THRESHOLD_HIDE = 5;
export const REPORT_THRESHOLD_DELETE = 10;
