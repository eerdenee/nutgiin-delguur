/**
 * Sentiment Analysis & Viral Negativity Shield
 * 
 * Problem: One bad review can create "butterfly effect" - 
 *          negativity spreads virally and tanks entire platform reputation.
 * Solution: Detect negativity patterns and dampen before they go viral.
 */

import { supabase } from './supabase';

// Mongolian negative sentiment words
const NEGATIVE_KEYWORDS = [
    // Fraud/Scam
    'луйвар', 'залилан', 'хуурамч', 'хулгай', 'мэхэлсэн',
    // Quality issues
    'муу', 'хог', 'эвдэрсэн', 'ажиллахгүй', 'хуучин',
    // Service issues
    'хариу өгөхгүй', 'залгахгүй', 'хүргээгүй', 'хоцорсон',
    // Anger
    'уурлаж', 'гомдсон', 'санаа зовсон', 'итгэлгүй'
];

// Viral negativity thresholds
const THRESHOLDS = {
    singleUserNegativeReviews: 3,    // Max negative reviews from single user per day
    productNegativeSpike: 5,         // Negative reviews on single product in 1 hour
    sellerNegativeSpike: 10,         // Negative reviews on single seller in 1 day
    platformNegativeRatio: 0.3       // If >30% of reviews are negative, alert
};

interface SentimentResult {
    score: number;          // -1 (very negative) to +1 (very positive)
    isNegative: boolean;
    keywords: string[];
    confidence: number;
}

/**
 * Simple sentiment analysis for Mongolian text
 */
export function analyzeSentiment(text: string): SentimentResult {
    const lowerText = text.toLowerCase();
    const foundNegative: string[] = [];

    for (const keyword of NEGATIVE_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            foundNegative.push(keyword);
        }
    }

    // Simple scoring
    const negativeScore = Math.min(foundNegative.length * 0.2, 1);
    const score = 1 - (negativeScore * 2); // -1 to +1

    return {
        score,
        isNegative: score < 0,
        keywords: foundNegative,
        confidence: foundNegative.length > 0 ? 0.7 : 0.3 // Low confidence without keywords
    };
}

/**
 * Check if a review should be flagged for moderation
 */
export async function shouldFlagReview(
    reviewText: string,
    rating: number,
    userId: string,
    productId: string,
    sellerId: string
): Promise<{ flag: boolean; reason?: string; priority: 'low' | 'medium' | 'high' }> {
    const sentiment = analyzeSentiment(reviewText);

    // 1. Check for extreme negativity with low rating
    if (rating <= 2 && sentiment.isNegative) {
        // Check if this user has left many negative reviews recently
        const { count: userNegativeCount } = await supabase
            .from('reviews')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .lte('rating', 2)
            .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString());

        if ((userNegativeCount || 0) >= THRESHOLDS.singleUserNegativeReviews) {
            return {
                flag: true,
                reason: 'User leaving multiple negative reviews in short period',
                priority: 'high'
            };
        }
    }

    // 2. Check for product negative spike
    const { count: productNegativeCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .eq('product_id', productId)
        .lte('rating', 2)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

    if ((productNegativeCount || 0) >= THRESHOLDS.productNegativeSpike) {
        return {
            flag: true,
            reason: 'Unusual negative review spike on product',
            priority: 'high'
        };
    }

    // 3. Check for seller negative spike
    const { count: sellerNegativeCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .eq('seller_id', sellerId)
        .lte('rating', 2)
        .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString());

    if ((sellerNegativeCount || 0) >= THRESHOLDS.sellerNegativeSpike) {
        return {
            flag: true,
            reason: 'Unusual negative review spike on seller',
            priority: 'medium'
        };
    }

    // 4. Flag reviews with specific dangerous keywords
    const dangerousKeywords = ['луйвар', 'хулгай', 'залилан'];
    const hasDangerous = sentiment.keywords.some(k => dangerousKeywords.includes(k));

    if (hasDangerous) {
        return {
            flag: true,
            reason: `Contains serious accusation: ${sentiment.keywords.join(', ')}`,
            priority: 'high'
        };
    }

    return { flag: false, priority: 'low' };
}

/**
 * Get platform health metrics (for dashboard)
 */
export async function getPlatformSentimentHealth(): Promise<{
    overallScore: number;
    negativeRatio: number;
    recentTrend: 'improving' | 'stable' | 'declining';
    alerts: string[];
}> {
    const alerts: string[] = [];

    // Get last 7 days of reviews
    const { data: recentReviews } = await supabase
        .from('reviews')
        .select('rating, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 3600000).toISOString());

    if (!recentReviews || recentReviews.length === 0) {
        return {
            overallScore: 1,
            negativeRatio: 0,
            recentTrend: 'stable',
            alerts: []
        };
    }

    // Calculate metrics
    const totalReviews = recentReviews.length;
    const negativeReviews = recentReviews.filter(r => r.rating <= 2).length;
    const negativeRatio = negativeReviews / totalReviews;

    const averageRating = recentReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    const overallScore = (averageRating - 1) / 4; // Normalize to 0-1

    // Check for platform-wide negativity
    if (negativeRatio > THRESHOLDS.platformNegativeRatio) {
        alerts.push(`⚠️ High negativity ratio: ${(negativeRatio * 100).toFixed(1)}%`);
    }

    // Calculate trend (compare first half to second half of week)
    const midPoint = new Date(Date.now() - 3.5 * 24 * 3600000);
    const firstHalf = recentReviews.filter(r => new Date(r.created_at) < midPoint);
    const secondHalf = recentReviews.filter(r => new Date(r.created_at) >= midPoint);

    const firstAvg = firstHalf.length > 0
        ? firstHalf.reduce((sum, r) => sum + r.rating, 0) / firstHalf.length
        : 0;
    const secondAvg = secondHalf.length > 0
        ? secondHalf.reduce((sum, r) => sum + r.rating, 0) / secondHalf.length
        : 0;

    let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondAvg > firstAvg + 0.3) recentTrend = 'improving';
    if (secondAvg < firstAvg - 0.3) recentTrend = 'declining';

    if (recentTrend === 'declining') {
        alerts.push('📉 Review sentiment is declining');
    }

    return {
        overallScore,
        negativeRatio,
        recentTrend,
        alerts
    };
}

/**
 * Dampen viral negativity by delaying publication of flagged reviews
 */
export async function processReviewWithDampening(
    review: {
        userId: string;
        productId: string;
        sellerId: string;
        rating: number;
        text: string;
    }
): Promise<{ published: boolean; delayed: boolean; reason?: string }> {
    const flagResult = await shouldFlagReview(
        review.text,
        review.rating,
        review.userId,
        review.productId,
        review.sellerId
    );

    if (flagResult.flag && flagResult.priority === 'high') {
        // Queue for moderation instead of immediate publish
        await supabase.from('moderation_queue').insert({
            type: 'review',
            user_id: review.userId,
            product_id: review.productId,
            content: review.text,
            rating: review.rating,
            flag_reason: flagResult.reason,
            priority: flagResult.priority,
            status: 'pending',
            created_at: new Date().toISOString()
        });

        return {
            published: false,
            delayed: true,
            reason: 'Таны сэтгэгдлийг хянаж байна. 24 цагийн дотор нийтлэгдэнэ.'
        };
    }

    return { published: true, delayed: false };
}
