/**
 * VIBE MANAGEMENT - Rating-Based Reviews System
 * 
 * Problem: Open comments become battlegrounds. 
 *          One fake "He's a scammer!" comment destroys a seller.
 * Solution: Replace comments with structured ratings and Q&A.
 */

import { supabase } from './supabase';

// Rating reasons (structured, not free-form)
export const RATING_REASONS = {
    5: [
        'Бараа сайн чанартай',
        'Хурдан хүргэсэн',
        'Харилцаа сайн',
        'Тайлбартай тохирсон',
        'Санал болгоно'
    ],
    4: [
        'Сайн байсан',
        'Бараа зүгээр',
        'Тайлбартай ойролцоо',
        'Хангалттай'
    ],
    3: [
        'Дундаж байсан',
        'Хүлээсэнээс бага',
        'Удаан хариу өгсөн'
    ],
    2: [
        'Сэтгэл ханамжгүй',
        'Тайлбартай таарахгүй',
        'Харилцаа муу',
        'Чанар муу'
    ],
    1: [
        'Бараа ирээгүй',
        'Тайлбараас огт өөр',
        'Залилан / Мэхлэлт',
        'Мөнгө буцаагаагүй',
        'Хариу өгөхгүй болсон'
    ]
};

interface ReviewSubmission {
    userId: string;
    sellerId: string;
    productId: string;
    transactionId?: string;
    rating: number;
    reasons: string[];  // Selected from RATING_REASONS
    additionalComment?: string; // Limited, optional
}

/**
 * Submit a rating (not a comment)
 * Low ratings (1-2) go to moderation queue first
 */
export async function submitRating(
    submission: ReviewSubmission
): Promise<{ success: boolean; message: string; requiresModeration: boolean }> {
    const { rating, reasons, additionalComment, userId, sellerId, productId, transactionId } = submission;

    // Validate rating
    if (rating < 1 || rating > 5) {
        return { success: false, message: 'Үнэлгээ 1-5 хооронд байх ёстой', requiresModeration: false };
    }

    // Validate reasons
    const validReasons = RATING_REASONS[rating as keyof typeof RATING_REASONS] || [];
    const invalidReason = reasons.find(r => !validReasons.includes(r));
    if (invalidReason) {
        return { success: false, message: 'Буруу шалтгаан сонгосон байна', requiresModeration: false };
    }

    // Check if additional comment is too long
    if (additionalComment && additionalComment.length > 500) {
        return { success: false, message: 'Нэмэлт тайлбар 500 тэмдэгтээс хэтрэхгүй байна', requiresModeration: false };
    }

    // LOW RATING (1-2) → Goes to moderation queue FIRST
    if (rating <= 2) {
        await supabase.from('moderation_queue').insert({
            type: 'low_rating',
            user_id: userId,
            product_id: productId,
            seller_id: sellerId,
            content: JSON.stringify({ rating, reasons, additionalComment }),
            rating: rating,
            flag_reason: `Low rating (${rating} star): ${reasons.join(', ')}`,
            priority: rating === 1 ? 'high' : 'medium',
            status: 'pending'
        });

        return {
            success: true,
            message: 'Таны үнэлгээ хүлээн авлаа. Баталгаажуулалтын дараа нийтлэгдэнэ.',
            requiresModeration: true
        };
    }

    // HIGH RATING (3-5) → Publish immediately
    await supabase.from('reviews').insert({
        user_id: userId,
        seller_id: sellerId,
        product_id: productId,
        transaction_id: transactionId,
        rating: rating,
        review: JSON.stringify({ reasons, additionalComment }),
        is_verified: !!transactionId
    });

    // Update seller's average rating
    await updateSellerRating(sellerId);

    return {
        success: true,
        message: 'Үнэлгээ амжилттай!',
        requiresModeration: false
    };
}

/**
 * Approve moderated review (admin action)
 */
export async function approveModeratedReview(
    queueItemId: string,
    adminId: string
): Promise<{ success: boolean }> {
    const { data: item } = await supabase
        .from('moderation_queue')
        .select('*')
        .eq('id', queueItemId)
        .single();

    if (!item) {
        return { success: false };
    }

    const content = JSON.parse(item.content || '{}');

    // Create the review
    await supabase.from('reviews').insert({
        user_id: item.user_id,
        seller_id: item.seller_id,
        product_id: item.product_id,
        rating: item.rating,
        review: item.content,
        is_verified: false,
        created_at: item.created_at
    });

    // Update queue item
    await supabase
        .from('moderation_queue')
        .update({
            status: 'approved',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', queueItemId);

    // Update seller rating
    if (item.seller_id) {
        await updateSellerRating(item.seller_id);
    }

    return { success: true };
}

/**
 * Reject moderated review (admin action)
 */
export async function rejectModeratedReview(
    queueItemId: string,
    adminId: string,
    reason: string
): Promise<{ success: boolean }> {
    await supabase
        .from('moderation_queue')
        .update({
            status: 'rejected',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            review_notes: reason
        })
        .eq('id', queueItemId);

    return { success: true };
}

/**
 * Update seller's average rating
 */
async function updateSellerRating(sellerId: string): Promise<void> {
    const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', sellerId);

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

// ============================================
// Q&A SYSTEM (Instead of comments)
// ============================================

/**
 * Ask a question about a product
 */
export async function askQuestion(
    productId: string,
    askerId: string,
    question: string
): Promise<{ success: boolean; questionId?: string; message: string }> {
    if (!question || question.trim().length < 10) {
        return { success: false, message: 'Асуулт дор хаяж 10 тэмдэгт байна' };
    }

    if (question.length > 500) {
        return { success: false, message: 'Асуулт 500 тэмдэгтээс хэтрэхгүй байна' };
    }

    const { data, error } = await supabase
        .from('product_questions')
        .insert({
            product_id: productId,
            asker_id: askerId,
            question: question.trim(),
            status: 'pending'
        })
        .select('id')
        .single();

    if (error) {
        return { success: false, message: 'Алдаа гарлаа' };
    }

    return { success: true, questionId: data?.id, message: 'Асуулт илгээгдлээ' };
}

/**
 * Answer a question (seller only)
 */
export async function answerQuestion(
    questionId: string,
    sellerId: string,
    answer: string
): Promise<{ success: boolean; message: string }> {
    // Verify seller owns the product
    const { data: question } = await supabase
        .from('product_questions')
        .select('*, products!inner(user_id)')
        .eq('id', questionId)
        .single();

    if (!question || (question.products as any)?.user_id !== sellerId) {
        return { success: false, message: 'Зөвхөн борлуулагч хариулах боломжтой' };
    }

    await supabase
        .from('product_questions')
        .update({
            answer: answer.trim(),
            answered_at: new Date().toISOString(),
            status: 'answered'
        })
        .eq('id', questionId);

    return { success: true, message: 'Хариулт илгээгдлээ' };
}

/**
 * Get Q&A for a product
 */
export async function getProductQA(productId: string): Promise<Array<{
    id: string;
    question: string;
    answer?: string;
    askerName: string;
    createdAt: string;
    answeredAt?: string;
}>> {
    const { data } = await supabase
        .from('product_questions')
        .select('*, profiles!asker_id(name)')
        .eq('product_id', productId)
        .eq('status', 'answered')
        .order('created_at', { ascending: false });

    return (data || []).map(q => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        askerName: (q.profiles as any)?.name || 'Хэрэглэгч',
        createdAt: q.created_at,
        answeredAt: q.answered_at
    }));
}
