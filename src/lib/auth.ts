/**
 * Authentication Helpers
 * Phone-based authentication using email pattern
 */

import { supabase } from './supabase';

/**
 * Convert phone number to email for Supabase Auth
 * Supabase Free tier only supports Email/Password by default
 */
export const phoneToEmail = (phone: string): string => {
    // Sanitize phone number
    const sanitizedPhone = phone.trim().replace(/[^0-9]/g, '');
    return `${sanitizedPhone}@example.com`;
};

/**
 * Validate phone number format (Mongolian)
 */
export const isValidPhone = (phone: string): boolean => {
    const sanitizedPhone = phone.trim().replace(/[^0-9]/g, '');
    return sanitizedPhone.length === 8 && /^[89]\d{7}$/.test(sanitizedPhone);
};

/**
 * Sign Up with Phone (via Email)
 */
export const signUpWithPhone = async (phone: string, password: string, name?: string) => {
    // Validate phone
    if (!isValidPhone(phone)) {
        return { data: null, error: { message: 'Утасны дугаар буруу байна' } };
    }

    // Validate password
    if (!password || password.length < 6) {
        return { data: null, error: { message: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой' } };
    }

    const email = phoneToEmail(phone);
    const sanitizedName = name?.replace(/<[^>]*>/g, '').trim().slice(0, 100) || '';

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    phone: phone.trim(),
                    name: sanitizedName,
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
                }
            }
        });

        return { data, error };
    } catch (err: any) {
        return { data: null, error: { message: err?.message || 'Бүртгэл амжилтгүй' } };
    }
};

/**
 * Sign In with Phone (via Email)
 */
export const signInWithPhone = async (phone: string, password: string) => {
    // Validate phone
    if (!isValidPhone(phone)) {
        return { data: null, error: { message: 'Утасны дугаар буруу байна' } };
    }

    const email = phoneToEmail(phone);

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        return { data, error };
    } catch (err: any) {
        return { data: null, error: { message: err?.message || 'Нэвтрэлт амжилтгүй' } };
    }
};

/**
 * Sign Out - Use the one from supabase.ts
 * Re-exported for convenience
 */
export { signOut } from './supabase';

/**
 * Get Current User Profile
 */
export const getCurrentProfile = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data: profile, error } = await (supabase
            .from('profiles') as any)
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) return null;
        return profile;
    } catch {
        return null;
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return !!user;
    } catch {
        return false;
    }
};

/**
 * Super Admin Emails
 * Add your email here to get admin access
 */
export const SUPER_ADMIN_EMAILS = [
    'eerdenee320@gmail.com', // User's email
    'admin@nutgiindelguur.mn'
];

/**
 * Check if current user is Super Admin
 */
export const isSuperAdmin = async (): Promise<boolean> => {
    try {
        const profile = await getCurrentProfile();
        if (!profile || !profile.email) return false;
        return SUPER_ADMIN_EMAILS.includes(profile.email);
    } catch {
        return false;
    }
};
