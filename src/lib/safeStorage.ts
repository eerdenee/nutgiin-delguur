/**
 * Safe localStorage wrapper with error handling
 * Prevents crashes from corrupted data, quota exceeded, or private mode
 */

import { useState, useCallback } from 'react';

// Helper to log only in development
const devLog = (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') {
        console.error(message, error || '');
    }
};

/**
 * Check if localStorage is available
 */
const isStorageAvailable = (): boolean => {
    if (typeof window === 'undefined') return false;

    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
};

export const safeLocalStorage = {
    /**
     * Check if storage is available
     */
    isAvailable: isStorageAvailable,

    /**
     * Safely get and parse JSON from localStorage
     */
    get: <T = any>(key: string, fallback: T): T => {
        if (!isStorageAvailable()) return fallback;

        try {
            const item = localStorage.getItem(key);
            if (item === null) return fallback;
            return JSON.parse(item) as T;
        } catch (e) {
            devLog(`[safeLS] Failed to parse "${key}":`, e);
            // Clear corrupted data
            try {
                localStorage.removeItem(key);
            } catch { }
            return fallback;
        }
    },

    /**
     * Safely stringify and save to localStorage
     */
    set: (key: string, value: any): boolean => {
        if (!isStorageAvailable()) return false;

        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e: any) {
            if (e.name === 'QuotaExceededError') {
                devLog('[safeLS] Storage quota exceeded');
                // Try to clear old cache data
                try {
                    const keysToTry = ['cache_', 'temp_'];
                    for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        if (k && keysToTry.some(prefix => k.startsWith(prefix))) {
                            localStorage.removeItem(k);
                        }
                    }
                    // Retry
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch {
                    window.dispatchEvent(new CustomEvent('storage-quota-exceeded', { detail: key }));
                }
            } else {
                devLog(`[safeLS] Failed to set "${key}":`, e);
            }
            return false;
        }
    },

    /**
     * Remove item from localStorage
     */
    remove: (key: string): void => {
        if (!isStorageAvailable()) return;

        try {
            localStorage.removeItem(key);
        } catch (e) {
            devLog(`[safeLS] Failed to remove "${key}":`, e);
        }
    },

    /**
     * Clear all localStorage
     */
    clear: (): void => {
        if (!isStorageAvailable()) return;

        try {
            localStorage.clear();
        } catch (e) {
            devLog('[safeLS] Failed to clear storage:', e);
        }
    },

    /**
     * Get all keys
     */
    keys: (): string[] => {
        if (!isStorageAvailable()) return [];

        try {
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) keys.push(key);
            }
            return keys;
        } catch {
            return [];
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

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            safeLocalStorage.set(key, valueToStore);
        } catch (error) {
            devLog(`Failed to save ${key}:`, error);
        }
    }, [key, storedValue]);

    const removeValue = useCallback(() => {
        safeLocalStorage.remove(key);
        setStoredValue(initialValue);
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue] as const;
};

/**
 * Get item directly (for non-React usage)
 */
export const getItem = <T = any>(key: string, fallback: T): T => {
    return safeLocalStorage.get(key, fallback);
};

/**
 * Set item directly (for non-React usage)
 */
export const setItem = (key: string, value: any): boolean => {
    return safeLocalStorage.set(key, value);
};
