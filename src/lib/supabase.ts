/**
 * Supabase Client Configuration
 * Browser болон Server-д ашиглах client-үүд
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables (only warn in development)
if (process.env.NODE_ENV === 'development') {
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
        console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL not configured');
    }
    if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key') {
        console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY not configured');
    }
}

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
    return !!(
        supabaseUrl &&
        supabaseUrl !== 'https://placeholder.supabase.co' &&
        supabaseAnonKey &&
        supabaseAnonKey !== 'placeholder-key'
    );
};

/**
 * Supabase client for browser usage
 * Use this in Client Components
 */
export const supabase = createBrowserClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

/**
 * Helper: Get current user
 */
export const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) return null;
        return user;
    } catch {
        return null;
    }
};

/**
 * Helper: Get current session
 */
export const getCurrentSession = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) return null;
        return session;
    } catch {
        return null;
    }
};

/**
 * Helper: Sign out
 */
export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        return { error };
    } catch (err: any) {
        return { error: err };
    }
};

// Re-export types
export type { Database } from './database.types';
