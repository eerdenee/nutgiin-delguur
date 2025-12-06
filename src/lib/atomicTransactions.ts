/**
 * Atomic Transaction System
 * 
 * Problem: Two users clicking "Buy VIP" at the exact same millisecond
 *          Both get charged, but only one slot exists.
 * Solution: Database-level locking with atomic transactions.
 */

import { supabase } from './supabase';

/**
 * Atomic VIP Purchase with Database Lock
 * Uses PostgreSQL's SELECT FOR UPDATE to prevent race conditions
 */
export async function atomicVIPPurchase(
    productId: string,
    userId: string,
    locationAimag: string,
    locationSoum?: string
): Promise<{ success: boolean; message: string; transactionId?: string }> {

    // Use Supabase RPC to execute atomic transaction
    // Cast to 'any' to bypass missing RPC type definitions
    const { data, error } = await (supabase as any).rpc('atomic_vip_purchase', {
        p_product_id: productId,
        p_user_id: userId,
        p_location_aimag: locationAimag,
        p_location_soum: locationSoum || null
    });

    if (error) {
        if (error.message.includes('NO_SLOTS_AVAILABLE')) {
            return {
                success: false,
                message: 'VIP зай дүүрсэн байна. Дараа дахин оролдоно уу.'
            };
        }
        if (error.message.includes('ALREADY_VIP')) {
            return {
                success: false,
                message: 'Энэ бараа аль хэдийн VIP байна.'
            };
        }
        return {
            success: false,
            message: 'Алдаа гарлаа. Дахин оролдоно уу.'
        };
    }

    return {
        success: true,
        message: 'VIP амжилттай идэвхжүүллээ!',
        transactionId: data?.transaction_id
    };
}

/**
 * Atomic inventory decrement (for any limited resource)
 * Prevents overselling
 */
export async function atomicDecrementInventory(
    productId: string,
    quantity: number = 1
): Promise<{ success: boolean; remainingStock: number }> {

    // Cast to 'any' to bypass missing RPC type definitions
    const { data, error } = await (supabase as any).rpc('atomic_decrement_stock', {
        p_product_id: productId,
        p_quantity: quantity
    });

    if (error) {
        return { success: false, remainingStock: 0 };
    }

    return {
        success: true,
        remainingStock: data?.remaining_stock || 0
    };
}

/**
 * Reserve a slot temporarily (with timeout)
 * Used for payment processing
 */
export async function reserveSlotWithTimeout(
    resourceType: 'vip_slot' | 'featured_slot' | 'inventory',
    resourceId: string,
    userId: string,
    timeoutSeconds: number = 300 // 5 minutes
): Promise<{ success: boolean; reservationId?: string; expiresAt?: string }> {

    const expiresAt = new Date(Date.now() + timeoutSeconds * 1000).toISOString();

    // Cast to 'any' to bypass missing table type definitions
    const { data, error } = await (supabase as any)
        .from('resource_reservations')
        .insert({
            resource_type: resourceType,
            resource_id: resourceId,
            user_id: userId,
            status: 'pending',
            expires_at: expiresAt,
            created_at: new Date().toISOString()
        })
        .select('id')
        .single();

    if (error) {
        // Check if already reserved
        if (error.code === '23505') { // Unique violation
            return { success: false };
        }
        return { success: false };
    }

    return {
        success: true,
        reservationId: data?.id,
        expiresAt
    };
}

/**
 * Complete a reservation (after payment success)
 */
export async function completeReservation(
    reservationId: string
): Promise<{ success: boolean }> {

    const { error } = await (supabase as any)
        .from('resource_reservations')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .eq('status', 'pending');

    return { success: !error };
}

/**
 * Cancel expired reservations (cron job, every minute)
 */
export async function cleanupExpiredReservations(): Promise<number> {
    const { data } = await (supabase as any)
        .from('resource_reservations')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lte('expires_at', new Date().toISOString())
        .select('id');

    return data?.length || 0;
}
