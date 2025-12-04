/**
 * Safe localStorage wrapper with error handling
 * Prevents crashes from corrupted data or quota exceeded errors
 */

import { useState } from 'react';

export const safeLocalStorage = {
    /**
     * Safely get and parse JSON from localStorage
     * @param key - localStorage key
     * @param fallback - default value if key doesn't exist or parsing fails
     * @returns parsed value or fallback
     */
    get: <T = any>(key: string, fallback: T): T => {
        if (typeof window === 'undefined') return fallback;

        try {
            const item = localStorage.getItem(key);
            if (item === null) return fallback;
            return JSON.parse(item) as T;
        } catch (e) {
            console.error(`[safeLS] Failed to parse "${key}":`, e);
            // Clear corrupted data
            try {
                localStorage.removeItem(key);
            } catch { }
            return fallback;
        }
    },

    /**
     * Safely stringify and save to localStorage
     * @param key - localStorage key
     * @param value - value to save
     * @returns true if successful, false otherwise
     */
    set: (key: string, value: any): boolean => {
        if (typeof window === 'undefined') return false;

        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e: any) {
            if (e.name === 'QuotaExceededError') {
                console.error('[safeLS] Storage quota exceeded');
                window.dispatchEvent(new CustomEvent('storage-quota-exceeded', { detail: key }));
            } else {
                console.error(`[safeLS] Failed to set "${key}":`, e);
            }
            return false;
        }
    },

    /**
     * Remove item from localStorage
     * @param key - localStorage key
     */
    remove: (key: string): void => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`[safeLS] Failed to remove "${key}":`, e);
        }
    },

    /**
     * Clear all localStorage
     */
    clear: (): void => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.clear();
        } catch (e) {
            console.error('[safeLS] Failed to clear storage:', e);
        }
    }
};

/**
 * Hook for safe localStorage with React state sync
 */
export const useSafeLocalStorage = <T = any>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        return safeLocalStorage.get(key, initialValue);
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            const success = safeLocalStorage.set(key, valueToStore);

            if (!success) {
                console.error(`Failed to save ${key} to localStorage`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue] as const;
};
