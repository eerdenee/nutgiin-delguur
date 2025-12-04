import { supabase } from './supabase';
import { phoneToEmail } from './auth';

/**
 * Migrate localStorage data to Supabase
 */
export const migrateData = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not logged in');

        // 1. Migrate Profile
        const localProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (localProfile.name) {
            await supabase
                .from('profiles')
                .update({
                    name: localProfile.name,
                    avatar_url: localProfile.avatar,
                    // phone is already set during signup
                } as any)
                .eq('id', user.id);
        }

        // 2. Migrate My Ads
        const myAds = JSON.parse(localStorage.getItem('my_ads') || '[]');
        let migratedAdsCount = 0;

        for (const ad of myAds) {
            // Check if ad already exists (by title and user_id roughly)
            // Or just insert blindly but handle errors

            const { error } = await supabase
                .from('products' as any)
                .insert({
                    user_id: user.id,
                    title: ad.title,
                    description: ad.description,
                    price: ad.price,
                    currency: ad.currency || '₮',
                    category: ad.category,
                    subcategory: ad.subcategory,
                    images: ad.images || [],
                    location: ad.location || { aimag: 'Улаанбаатар', soum: 'Сүхбаатар' },
                    tier: ad.subscriptionTier || 'soum',
                    status: 'active',
                    created_at: ad.createdAt || new Date().toISOString(),
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
                } as any);

            if (!error) migratedAdsCount++;
        }

        // 3. Migrate Favorites
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        // Note: Favorites in localStorage are just IDs. 
        // We can't migrate them easily unless those IDs match Supabase product IDs.
        // Since we just migrated products and they got NEW UUIDs, we can't map old IDs to new IDs easily
        // without a complex mapping logic. 
        // For now, we skip favorites migration or we need to match by title/content.

        return { success: true, migratedAds: migratedAdsCount };

    } catch (error) {
        console.error('Migration error:', error);
        return { success: false, error };
    }
};
