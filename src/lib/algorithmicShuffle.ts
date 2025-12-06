/**
 * ALGORITHMIC SHUFFLE - Make Site Feel Alive
 * 
 * Problem: With few listings, same products appear on top every day.
 *          Users think "nothing new here" and leave.
 * Solution: Randomize top 10 on each page load.
 */

/**
 * Shuffle top N items in an array
 * Keeps randomness feeling fresh while maintaining some order
 */
export function shuffleTopItems<T>(
    items: T[],
    shuffleCount: number = 10
): T[] {
    if (items.length <= 1) return items;

    const toShuffle = items.slice(0, Math.min(shuffleCount, items.length));
    const rest = items.slice(shuffleCount);

    // Fisher-Yates shuffle
    for (let i = toShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [toShuffle[i], toShuffle[j]] = [toShuffle[j], toShuffle[i]];
    }

    return [...toShuffle, ...rest];
}

/**
 * Time-based shuffle seed (changes every hour)
 * So users refreshing quickly see same order, but hourly it changes
 */
export function getHourlyShuffleSeed(): number {
    const now = new Date();
    // Create seed from date and hour
    return now.getFullYear() * 1000000 +
        (now.getMonth() + 1) * 10000 +
        now.getDate() * 100 +
        now.getHours();
}

/**
 * Seeded shuffle (deterministic based on seed)
 */
export function seededShuffle<T>(items: T[], seed: number): T[] {
    const shuffled = [...items];
    let currentSeed = seed;

    // Simple seeded random
    const seededRandom = () => {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        return currentSeed / 233280;
    };

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

/**
 * Apply freshness algorithm to products
 * Combines recency weighting with controlled randomness
 */
export function applyFreshnessAlgorithm<T extends {
    id: string;
    createdAt: string | Date;
    views?: number;
    isVip?: boolean;
}>(
    products: T[],
    options: {
        shuffleTop?: number;      // How many to shuffle (default: 10)
        vipFirst?: boolean;       // VIP always on top? (default: true)
        hourlyConsistent?: boolean; // Same shuffle for 1 hour? (default: true)
    } = {}
): T[] {
    const { shuffleTop = 10, vipFirst = true, hourlyConsistent = true } = options;

    let result = [...products];

    // 1. Separate VIP if needed
    let vipProducts: T[] = [];
    if (vipFirst) {
        vipProducts = result.filter(p => p.isVip);
        result = result.filter(p => !p.isVip);
    }

    // 2. Apply shuffle
    if (hourlyConsistent) {
        const seed = getHourlyShuffleSeed();
        const topItems = result.slice(0, shuffleTop);
        const restItems = result.slice(shuffleTop);
        result = [...seededShuffle(topItems, seed), ...restItems];
    } else {
        result = shuffleTopItems(result, shuffleTop);
    }

    // 3. Put VIP back on top
    if (vipFirst && vipProducts.length > 0) {
        result = [...seededShuffle(vipProducts, getHourlyShuffleSeed()), ...result];
    }

    return result;
}

/**
 * Get "freshness score" for sort comparison
 * Higher score = appears higher in list
 */
export function calculateFreshnessScore(product: {
    createdAt: string | Date;
    views?: number;
    isVip?: boolean;
    isFeatured?: boolean;
}): number {
    let score = 0;

    // Base: recency (decay over time)
    const ageHours = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 100 - ageHours); // Lose 1 point per hour
    score += recencyScore;

    // Engagement bonus (but capped to prevent echo chamber)
    const viewBonus = Math.min(product.views || 0, 50); // Cap at 50
    score += viewBonus * 0.5;

    // VIP/Featured boost
    if (product.isVip) score += 200;
    if (product.isFeatured) score += 100;

    // Add small random jitter (±5 points)
    const jitter = (Math.random() - 0.5) * 10;
    score += jitter;

    return score;
}

/**
 * Sort products by freshness score with randomness
 */
export function sortByFreshness<T extends {
    createdAt: string | Date;
    views?: number;
    isVip?: boolean;
    isFeatured?: boolean;
}>(products: T[]): T[] {
    return [...products].sort((a, b) => {
        return calculateFreshnessScore(b) - calculateFreshnessScore(a);
    });
}
