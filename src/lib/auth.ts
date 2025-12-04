import { supabase } from './supabase';

/**
 * Convert phone number to email for Supabase Auth
 * Supabase Free tier only supports Email/Password by default
 * So we use phone@nutag.mn pattern
 */
export const phoneToEmail = (phone: string) => `${phone.trim()}@example.com`;

/**
 * Sign Up with Phone (via Email)
 */
export const signUpWithPhone = async (phone: string, password: string, name?: string) => {
    const email = phoneToEmail(phone);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                phone,
                name: name || '',
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
            }
        }
    });

    return { data, error };
};

/**
 * Sign In with Phone (via Email)
 */
export const signInWithPhone = async (phone: string, password: string) => {
    const email = phoneToEmail(phone);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    return { data, error };
};

/**
 * Sign Out
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

/**
 * Get Current User Profile
 */
export const getCurrentProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) return null;
    return profile;
};
