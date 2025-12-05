"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CountryCode, CountryConfig, COUNTRIES, DEFAULT_COUNTRY } from '@/lib/constants';
import { getTranslation, Locale } from '@/lib/i18n';
import Cookies from 'js-cookie';

interface CountryContextType {
    country: CountryConfig;
    setCountry: (code: CountryCode) => void;
    t: any; // Translation object
    locale: Locale;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({
    children,
    initialCountry = DEFAULT_COUNTRY
}: {
    children: React.ReactNode;
    initialCountry?: CountryCode;
}) {
    const [countryCode, setCountryCode] = useState<CountryCode>(initialCountry);

    // Load country from cookie on mount (client-side)
    useEffect(() => {
        const savedCountry = Cookies.get('country') as CountryCode;
        if (savedCountry && COUNTRIES[savedCountry]) {
            setCountryCode(savedCountry);
        }
    }, []);

    const country = COUNTRIES[countryCode];
    const locale = country.defaultLocale as Locale;
    const t = getTranslation(locale);

    const handleSetCountry = (code: CountryCode) => {
        setCountryCode(code);
        Cookies.set('country', code);
        // Optional: Reload page to refresh server data
        window.location.reload();
    };

    return (
        <CountryContext.Provider value={{ country, setCountry: handleSetCountry, t, locale }}>
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
