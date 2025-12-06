/**
 * Ghost Ads Auto-Expiry System
 * 
 * Problem: Users sell items but forget to delete/deactivate their listings.
 * Solution: Auto-expire listings after 14 days, requiring user action to renew.
 */

import { supabase } from './supabase';

const LISTING_EXPIRY_DAYS = 14; // 14 өдрийн дараа идэвхгүй болно
const REMINDER_BEFORE_DAYS = 2; // 2 өдрийн өмнө сануулга

interface ExpiryResult {
    expired: number;
    reminded: number;
    errors: number;
}

/**
 * Cron job: Auto-expire old listings (run daily)
 */
export async function autoExpireListings(): Promise<ExpiryResult> {
    let expired = 0;
    let reminded = 0;
    let errors = 0;

    const now = new Date();
    const expiryThreshold = new Date(now.getTime() - LISTING_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const reminderThreshold = new Date(now.getTime() - (LISTING_EXPIRY_DAYS - REMINDER_BEFORE_DAYS) * 24 * 60 * 60 * 1000);

    try {
        // 1. Expire old listings
        const { data: expiredListings, error: expireError } = await supabase
            .from('products')
            .update({
                status: 'expired',
                expired_at: now.toISOString(),
                expiry_reason: 'auto_expired'
            })
            .eq('status', 'active')
            .lte('last_renewed_at', expiryThreshold.toISOString())
            .select('id, user_id, title');

        if (expireError) {
            errors++;
        } else if (expiredListings) {
            expired = expiredListings.length;

            // Send expiry notifications
            for (const listing of expiredListings) {
                await createNotification(listing.user_id, {
                    type: 'listing_expired',
                    title: 'Зар хугацаа дууссан',
                    message: `"${listing.title}" зарын хугацаа дууссан. Дахин идэвхжүүлэх бол дарна уу.`,
                    productId: listing.id
                });
            }
        }

        // 2. Send reminders for soon-to-expire listings
        const { data: soonExpiring, error: reminderError } = await supabase
            .from('products')
            .select('id, user_id, title')
            .eq('status', 'active')
            .lte('last_renewed_at', reminderThreshold.toISOString())
            .gt('last_renewed_at', expiryThreshold.toISOString())
            .is('expiry_reminder_sent', null);

        if (reminderError) {
            errors++;
        } else if (soonExpiring) {
            for (const listing of soonExpiring) {
                await createNotification(listing.user_id, {
                    type: 'expiry_reminder',
                    title: 'Зар удахгүй хугацаа дуусна',
                    message: `"${listing.title}" 2 хоногийн дараа идэвхгүй болно. Сунгах бол дарна уу.`,
                    productId: listing.id
                });

                // Mark reminder as sent
                await supabase
                    .from('products')
                    .update({ expiry_reminder_sent: now.toISOString() })
                    .eq('id', listing.id);

                reminded++;
            }
        }

    } catch (err) {
        errors++;
        if (process.env.NODE_ENV === 'development') {
            console.error('Auto-expire error:', err);
        }
    }

    return { expired, reminded, errors };
}

/**
 * Renew a listing (extend expiry by 14 days)
 */
export async function renewListing(productId: string, userId: string): Promise<{ success: boolean; message: string }> {
    // 1. Verify ownership
    const { data: product } = await supabase
        .from('products')
        .select('id, user_id, status')
        .eq('id', productId)
        .single();

    if (!product) {
        return { success: false, message: 'Бүтээгдэхүүн олдсонгүй.' };
    }

    if (product.user_id !== userId) {
        return { success: false, message: 'Зөвхөн эзэмшигч сунгах боломжтой.' };
    }

    // 2. Renew
    const { error } = await supabase
        .from('products')
        .update({
            status: 'active',
            last_renewed_at: new Date().toISOString(),
            expired_at: null,
            expiry_reminder_sent: null
        })
        .eq('id', productId);

    if (error) {
        return { success: false, message: 'Алдаа гарлаа. Дахин оролдоно уу.' };
    }

    return { success: true, message: 'Зар 14 хоногоор сунгагдлаа!' };
}

/**
 * Mark listing as sold (instead of letting it expire)
 */
export async function markAsSold(productId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const { data: product } = await supabase
        .from('products')
        .select('id, user_id')
        .eq('id', productId)
        .single();

    if (!product || product.user_id !== userId) {
        return { success: false, message: 'Зөвхөн эзэмшигч шинэчлэх боломжтой.' };
    }

    const { error } = await supabase
        .from('products')
        .update({
            status: 'sold',
            sold_at: new Date().toISOString()
        })
        .eq('id', productId);

    if (error) {
        return { success: false, message: 'Алдаа гарлаа.' };
    }

    return { success: true, message: 'Зар "Зарагдсан" гэж тэмдэглэгдлээ.' };
}

/**
 * Create in-app notification
 */
async function createNotification(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    productId?: string;
}): Promise<void> {
    await supabase.from('notifications').insert({
        user_id: userId,
        ...notification,
        read: false,
        created_at: new Date().toISOString()
    });
}
