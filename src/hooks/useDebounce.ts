"use client";

import { useState, useEffect } from "react";

/**
 * useDebounce hook - Delays updating a value until after a specified delay.
 * Useful for search inputs, API calls, and other expensive operations.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * const [searchQuery, setSearchQuery] = useState("");
 * const debouncedSearch = useDebounce(searchQuery, 300);
 * 
 * useEffect(() => {
 *   // This runs 300ms after the user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up the timeout
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up on unmount or when value/delay changes
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * useThrottle hook - Limits how often a value can update.
 * Useful for scroll events, resize handlers, etc.
 * 
 * @param value - The value to throttle
 * @param interval - Minimum time between updates in milliseconds
 * @returns The throttled value
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
    const [throttledValue, setThrottledValue] = useState<T>(value);
    const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

    useEffect(() => {
        const now = Date.now();

        if (now >= lastUpdated + interval) {
            setThrottledValue(value);
            setLastUpdated(now);
        } else {
            const timer = setTimeout(() => {
                setThrottledValue(value);
                setLastUpdated(Date.now());
            }, interval - (now - lastUpdated));

            return () => clearTimeout(timer);
        }
    }, [value, interval, lastUpdated]);

    return throttledValue;
}

/**
 * useTimeout hook - Execute a callback after a delay.
 * Automatically cleans up on unmount.
 * 
 * @param callback - Function to execute
 * @param delay - Delay in milliseconds (null to cancel)
 */
export function useTimeout(callback: () => void, delay: number | null): void {
    useEffect(() => {
        if (delay === null) return;

        const timer = setTimeout(callback, delay);

        return () => clearTimeout(timer);
    }, [callback, delay]);
}

/**
 * useInterval hook - Execute a callback at regular intervals.
 * Automatically cleans up on unmount.
 * 
 * @param callback - Function to execute
 * @param interval - Interval in milliseconds (null to stop)
 */
export function useInterval(callback: () => void, interval: number | null): void {
    useEffect(() => {
        if (interval === null) return;

        const id = setInterval(callback, interval);

        return () => clearInterval(id);
    }, [callback, interval]);
}

export default useDebounce;
