"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CountryCode, CountryConfig, COUNTRIES, DEFAULT_COUNTRY } from '@/lib/constants';
import { getTranslation, Locale } from '@/lib/i18n';
import Cookies from 'js-cookie';

interface CountryContextType {
    country: CountryConfig;
    setCountry: (code: CountryCode) => void;
    t: any; // Translation object
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({
    children,
    initialCountry = DEFAULT_COUNTRY
}: {
    children: React.ReactNode;
    initialCountry?: CountryCode;
}) {
    const [country, setCountryState] = useState<CountryConfig>(COUNTRIES[initialCountry]);
    const [t, setT] = useState(getTranslation(COUNTRIES[initialCountry].defaultLocale as Locale));

    // Load country from cookie on mount (client-side)
    useEffect(() => {
        const savedCountry = Cookies.get('country') as CountryCode;
        if (savedCountry && COUNTRIES[savedCountry]) {
            setCountryState(COUNTRIES[savedCountry]);
            setT(getTranslation(COUNTRIES[savedCountry].defaultLocale as Locale));
        }
    }, []);

    const setCountry = (code: CountryCode) => {
        const config = COUNTRIES[code];
        if (config) {
            setCountryState(config);
            setT(getTranslation(config.defaultLocale as Locale));
            // Save to cookie
            Cookies.set('country', code, { expires: 365 });
            // Reload page to apply changes everywhere (middleware, etc.)
            window.location.reload();
        }
    };

    return (
        <CountryContext.Provider value={{ country, setCountry, t }}>
            {children}
        </CountryContext.Provider>
    );
}

export function useCountry() {
    const context = useContext(CountryContext);
    if (context === undefined) {
        throw new Error('useCountry must be used within a CountryProvider');
    }
    return context;
}
