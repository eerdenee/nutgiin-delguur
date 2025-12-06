/**
 * Verified Transaction Reviews System
 * 
 * Problem: Competitors can spam 1-star reviews to tank seller reputation.
 * Solution: Only users with a "Verified Transaction Code" can leave reviews.
 */

import { supabase } from './supabase';
import crypto from 'crypto';

/**
 * Generate a unique transaction code when items are purchased
 * This code proves a real transaction happened
 */
export function generateTransactionCode(
    buyerId: string,
    sellerId: string,
    productId: string
): string {
    const timestamp = Date.now();
    const payload = `${buyerId}-${sellerId}-${productId}-${timestamp}`;

    // Generate 8-character code
    const hash = crypto
        .createHash('sha256')
        .update(payload)
        .digest('hex')
        .substring(0, 8)
        .toUpperCase();

    return `TX-${hash}`;
}

/**
 * Create a transaction record when buyer confirms purchase
 */
export async function createVerifiedTransaction(
    buyerId: string,
    sellerId: string,
    productId: string,
    amount: number
): Promise<{ success: boolean; code?: string; message: string }> {
    const transactionCode = generateTransactionCode(buyerId, sellerId, productId);

    const { error } = await supabase.from('verified_transactions').insert({
        code: transactionCode,
        buyer_id: buyerId,
        seller_id: sellerId,
        product_id: productId,
        amount: amount,
        status: 'completed',
        created_at: new Date().toISOString(),
        review_allowed: true,
        review_submitted: false
    });

    if (error) {
        return { success: false, message: 'Гүйлгээ бүртгэхэд алдаа гарлаа.' };
    }

    return {
        success: true,
        code: transactionCode,
        message: `Гүйлгээ амжилттай! Таны код: ${transactionCode}`
    };
}

/**
 * Verify if user can leave a review (must have verified transaction)
 */
export async function canLeaveReview(
    userId: string,
    productId: string
): Promise<{ allowed: boolean; reason: string; transactionId?: string }> {
    // Check for verified transaction
    const { data: transaction } = await supabase
        .from('verified_transactions')
        .select('id, code, review_submitted')
        .eq('buyer_id', userId)
        .eq('product_id', productId)
        .eq('status', 'completed')
        .single();

    if (!transaction) {
        return {
            allowed: false,
            reason: 'Та энэ барааг худалдаж аваагүй тул үнэлгээ өгөх боломжгүй.'
        };
    }

    if (transaction.review_submitted) {
        return {
            allowed: false,
            reason: 'Та аль хэдийн үнэлгээ өгсөн байна.'
        };
    }

    return {
        allowed: true,
        reason: 'Үнэлгээ өгөх боломжтой.',
        transactionId: transaction.id
    };
}

/**
 * Submit a verified review
 */
export async function submitVerifiedReview(
    userId: string,
    productId: string,
    sellerId: string,
    rating: number, // 1-5
    review: string,
    transactionCode?: string
): Promise<{ success: boolean; message: string }> {
    // 1. Verify eligibility
    const eligibility = await canLeaveReview(userId, productId);

    if (!eligibility.allowed) {
        return { success: false, message: eligibility.reason };
    }

    // 2. Validate rating
    if (rating < 1 || rating > 5) {
        return { success: false, message: 'Үнэлгээ 1-5 хооронд байх ёстой.' };
    }

    // 3. Create review
    const { error: reviewError } = await supabase.from('reviews').insert({
        user_id: userId,
        product_id: productId,
        seller_id: sellerId,
        transaction_id: eligibility.transactionId,
        rating: rating,
        review: review,
        is_verified: true, // VERIFIED PURCHASER
        created_at: new Date().toISOString()
    });

    if (reviewError) {
        return { success: false, message: 'Үнэлгээ хадгалахад алдаа гарлаа.' };
    }

    // 4. Mark transaction as reviewed
    await supabase
        .from('verified_transactions')
        .update({ review_submitted: true, reviewed_at: new Date().toISOString() })
        .eq('id', eligibility.transactionId);

    // 5. Update seller's average rating
    await updateSellerRating(sellerId);

    return { success: true, message: 'Үнэлгээ амжилттай хадгалагдлаа!' };
}

/**
 * Update seller's average rating
 */
async function updateSellerRating(sellerId: string): Promise<void> {
    const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', sellerId)
        .eq('is_verified', true);

    if (!reviews || reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await supabase
        .from('profiles')
        .update({
            average_rating: Math.round(avgRating * 10) / 10,
            total_reviews: reviews.length
        })
        .eq('id', sellerId);
}

/**
 * Detect fake review patterns (admin tool)
 */
export async function detectFakeReviewPatterns(sellerId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
}> {
    const reasons: string[] = [];

    // Get recent reviews
    const { data: reviews } = await supabase
        .from('reviews')
        .select('*, users:user_id(created_at)')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (!reviews || reviews.length < 5) {
        return { suspicious: false, reasons: [] };
    }

    // 1. Check for suspiciously new accounts leaving reviews
    const newAccountReviews = reviews.filter((r: any) => {
        const accountAge = Date.now() - new Date(r.users?.created_at).getTime();
        return accountAge < 7 * 24 * 60 * 60 * 1000; // Less than 7 days old
    });

    if (newAccountReviews.length > reviews.length * 0.5) {
        reasons.push('50%+ үнэлгээ шинэ бүртгэлээс ирсэн');
    }

    // 2. Check for rating extremes (all 5s or all 1s)
    const ratings = reviews.map((r: any) => r.rating);
    const allFives = ratings.every((r: number) => r === 5);
    const allOnes = ratings.every((r: number) => r === 1);

    if (allFives && reviews.length > 10) {
        reasons.push('Бүх үнэлгээ 5 од (хуурамч байж болзошгүй)');
    }
    if (allOnes && reviews.length > 5) {
        reasons.push('Бүх үнэлгээ 1 од (өрсөлдөгчийн довтолгоо байж болзошгүй)');
    }

    // 3. Check for rapid review bursts
    const last24h = reviews.filter((r: any) =>
        Date.now() - new Date(r.created_at).getTime() < 24 * 60 * 60 * 1000
    );
    if (last24h.length > 20) {
        reasons.push(`Сүүлийн 24 цагт ${last24h.length} үнэлгээ (хэвийн бус)`);
    }

    return {
        suspicious: reasons.length > 0,
        reasons
    };
}
