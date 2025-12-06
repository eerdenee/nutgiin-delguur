/**
 * Probabilistic Counting System
 * 
 * Problem: Popular product gets 10,000 views/second.
 *          Each view = UPDATE views = views + 1
 *          PostgreSQL locks that row, entire site freezes.
 * 
 * Solution: Buffer counts in memory, batch update to database.
 */

// In-memory counters (reset on server restart - that's OK for views)
const viewCounters = new Map<string, number>();
const likeCounters = new Map<string, number>();
const shareCounters = new Map<string, number>();

// Flush interval (5 minutes)
const FLUSH_INTERVAL_MS = 5 * 60 * 1000;

// Minimum threshold to flush (avoid tiny updates)
const MIN_FLUSH_THRESHOLD = 5;

/**
 * Increment view count (non-blocking, probabilistic)
 */
export function incrementViews(productId: string): void {
    const current = viewCounters.get(productId) || 0;
    viewCounters.set(productId, current + 1);
}

/**
 * Increment like count
 */
export function incrementLikes(productId: string, delta: number = 1): void {
    const current = likeCounters.get(productId) || 0;
    likeCounters.set(productId, current + delta);
}

/**
 * Increment share count
 */
export function incrementShares(productId: string): void {
    const current = shareCounters.get(productId) || 0;
    shareCounters.set(productId, current + 1);
}

/**
 * Get approximate view count (current DB value + buffered)
 */
export async function getApproximateViews(
    productId: string,
    supabase: any
): Promise<number> {
    const { data } = await supabase
        .from('products')
        .select('views')
        .eq('id', productId)
        .single();

    const dbViews = data?.views || 0;
    const bufferedViews = viewCounters.get(productId) || 0;

    return dbViews + bufferedViews;
}

/**
 * Format view count for display (e.g., "10.2K" instead of "10234")
 */
export function formatViewCount(count: number): string {
    if (count < 1000) return count.toString();
    if (count < 10000) return (count / 1000).toFixed(1) + 'K';
    if (count < 1000000) return Math.floor(count / 1000) + 'K';
    return (count / 1000000).toFixed(1) + 'M';
}

/**
 * Flush all counters to database (run every 5 minutes via cron)
 */
export async function flushCountersToDatabase(supabase: any): Promise<{
    viewsUpdated: number;
    likesUpdated: number;
    sharesUpdated: number;
}> {
    let viewsUpdated = 0;
    let likesUpdated = 0;
    let sharesUpdated = 0;

    // Flush views
    for (const [productId, count] of viewCounters.entries()) {
        if (count >= MIN_FLUSH_THRESHOLD) {
            try {
                await supabase.rpc('increment_product_stat', {
                    p_product_id: productId,
                    p_column: 'views',
                    p_amount: count
                });
                viewCounters.delete(productId);
                viewsUpdated++;
            } catch (err) {
                // Keep in buffer, try again next flush
                if (process.env.NODE_ENV === 'development') {
                    console.error('Failed to flush views:', err);
                }
            }
        }
    }

    // Flush likes
    for (const [productId, count] of likeCounters.entries()) {
        if (count !== 0) { // Can be negative (unlike)
            try {
                await supabase.rpc('increment_product_stat', {
                    p_product_id: productId,
                    p_column: 'likes',
                    p_amount: count
                });
                likeCounters.delete(productId);
                likesUpdated++;
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Failed to flush likes:', err);
                }
            }
        }
    }

    // Flush shares
    for (const [productId, count] of shareCounters.entries()) {
        if (count >= MIN_FLUSH_THRESHOLD) {
            try {
                await supabase.rpc('increment_product_stat', {
                    p_product_id: productId,
                    p_column: 'shares',
                    p_amount: count
                });
                shareCounters.delete(productId);
                sharesUpdated++;
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Failed to flush shares:', err);
                }
            }
        }
    }

    return { viewsUpdated, likesUpdated, sharesUpdated };
}

/**
 * Probabilistic increment (for very high traffic)
 * Only count with probability, then multiply
 * 10% sampling = 10x multiplier for estimate
 */
export function probabilisticIncrement(
    productId: string,
    samplingRate: number = 0.1 // 10% sampling
): void {
    // Random chance to actually count
    if (Math.random() < samplingRate) {
        // Increment by inverse of sample rate
        const multiplier = Math.round(1 / samplingRate);
        const current = viewCounters.get(productId) || 0;
        viewCounters.set(productId, current + multiplier);
    }
}

/**
 * Get current buffer size (for monitoring)
 */
export function getBufferStats(): {
    viewsBuffered: number;
    likesBuffered: number;
    sharesBuffered: number;
    totalProducts: number;
} {
    return {
        viewsBuffered: Array.from(viewCounters.values()).reduce((a, b) => a + b, 0),
        likesBuffered: Array.from(likeCounters.values()).reduce((a, b) => a + b, 0),
        sharesBuffered: Array.from(shareCounters.values()).reduce((a, b) => a + b, 0),
        totalProducts: new Set([
            ...viewCounters.keys(),
            ...likeCounters.keys(),
            ...shareCounters.keys()
        ]).size
    };
}

// Auto-flush on interval (if running in Node.js environment with long-running process)
if (typeof setInterval !== 'undefined' && process.env.ENABLE_AUTO_FLUSH === 'true') {
    setInterval(async () => {
        try {
            const { supabase } = await import('./supabase');
            await flushCountersToDatabase(supabase);
        } catch (err) {
            console.error('Auto-flush failed:', err);
        }
    }, FLUSH_INTERVAL_MS);
}
