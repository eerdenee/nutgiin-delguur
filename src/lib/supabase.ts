/**
 * Supabase Client Configuration
 * Browser болон Server-д ашиглах client-үүд
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('⚠️ Supabase URL not configured. Using mock mode.');
    console.log('Current URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
} else {
    console.log('✅ Supabase Client Initialized with URL:', supabaseUrl);
}

if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key') {
    console.warn('⚠️ Supabase Anon Key not configured. Using mock mode.');
}

/**
 * Supabase client for browser usage
 * Use this in Client Components
 */
export const supabase = createBrowserClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

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
 * Helper: Get current user
 */
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
};

/**
 * Helper: Get current session
 */
export const getCurrentSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return null;
    return session;
};

/**
 * Helper: Sign out
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

// Re-export types
export type { Database } from './database.types';
