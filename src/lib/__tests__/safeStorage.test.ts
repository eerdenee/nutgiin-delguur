/**
 * Safe Storage Tests
 */
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: jest.fn((key: string) => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: jest.fn((i: number) => Object.keys(store)[i] || null)
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import { safeLocalStorage } from '../safeStorage';

describe('safeLocalStorage', () => {
    beforeEach(() => {
        localStorageMock.clear();
        jest.clearAllMocks();
    });

    test('getItem returns null for non-existent key', () => {
        const result = safeLocalStorage.getItem('nonexistent');
        expect(result).toBeNull();
    });

    test('setItem stores value correctly', () => {
        safeLocalStorage.setItem('testKey', 'testValue');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', 'testValue');
    });

    test('getItem retrieves stored value', () => {
        localStorageMock.setItem('testKey', 'testValue');
        const result = safeLocalStorage.getItem('testKey');
        expect(result).toBe('testValue');
    });

    test('removeItem removes stored value', () => {
        safeLocalStorage.removeItem('testKey');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('testKey');
    });

    test('clear removes all stored values', () => {
        safeLocalStorage.clear();
        expect(localStorageMock.clear).toHaveBeenCalled();
    });

    test('getJSON parses JSON correctly', () => {
        const testObj = { name: 'test', value: 123 };
        localStorageMock.setItem('jsonKey', JSON.stringify(testObj));
        const result = safeLocalStorage.getJSON('jsonKey');
        expect(result).toEqual(testObj);
    });

    test('getJSON returns default value for invalid JSON', () => {
        localStorageMock.setItem('invalidJson', 'not valid json');
        const result = safeLocalStorage.getJSON('invalidJson', { default: true });
        expect(result).toEqual({ default: true });
    });

    test('setJSON stores JSON correctly', () => {
        const testObj = { name: 'test', value: 123 };
        safeLocalStorage.setJSON('jsonKey', testObj);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('jsonKey', JSON.stringify(testObj));
    });
});
