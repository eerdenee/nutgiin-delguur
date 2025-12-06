/**
 * Fair Discovery Algorithm
 * 
 * Problem: "Rich get richer" - popular items get more views, 
 *          making them more popular, while new items get zero visibility.
 * Solution: Inject randomness (Jitter) to give new items a fair chance.
 */

import { supabase } from './supabase';

interface Product {
    id: string;
    title: string;
    price: number;
    image: string;
    views?: number;
    likes?: number;
    created_at: string;
    [key: string]: any;
}

interface DiscoveryConfig {
    totalItems: number;        // How many items to return
    newItemSlots: number;      // Reserved slots for new items (last 7 days)
    randomSlots: number;       // Pure random items (lottery)
    boostNewHours: number;     // How many hours a product is "new"
}

const DEFAULT_CONFIG: DiscoveryConfig = {
    totalItems: 20,
    newItemSlots: 3,     // 3 slots reserved for items < 24h old
    randomSlots: 2,      // 2 slots for pure random selection
    boostNewHours: 24    // Products < 24h get boosted
};

/**
 * Get products with fair discovery algorithm
 */
export async function getFairDiscoveryProducts(
    category?: string,
    location?: { aimag?: string; soum?: string },
    config: Partial<DiscoveryConfig> = {}
): Promise<Product[]> {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const now = new Date();

    // 1. Get new products (< 24 hours old)
    const newThreshold = new Date(now.getTime() - cfg.boostNewHours * 60 * 60 * 1000).toISOString();

    let newQuery = supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .gte('created_at', newThreshold)
        .order('created_at', { ascending: false })
        .limit(cfg.newItemSlots * 2); // Get extra for randomization

    if (category) newQuery = newQuery.eq('category', category);
    if (location?.aimag) newQuery = newQuery.eq('location_aimag', location.aimag);
    if (location?.soum) newQuery = newQuery.eq('location_soum', location.soum);

    const { data: newProducts } = await newQuery;

    // 2. Get popular products (ranked by engagement score)
    const popularSlots = cfg.totalItems - cfg.newItemSlots - cfg.randomSlots;

    let popularQuery = supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('engagement_score', { ascending: false })
        .limit(popularSlots + 10); // Extra for duplicate removal

    if (category) popularQuery = popularQuery.eq('category', category);
    if (location?.aimag) popularQuery = popularQuery.eq('location_aimag', location.aimag);
    if (location?.soum) popularQuery = popularQuery.eq('location_soum', location.soum);

    const { data: popularProducts } = await popularQuery;

    // 3. Get random products (lottery for fairness)
    // Using random() function requires a different approach
    let randomQuery = supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .limit(cfg.randomSlots * 5); // Get more to pick randomly

    if (category) randomQuery = randomQuery.eq('category', category);
    if (location?.aimag) randomQuery = randomQuery.eq('location_aimag', location.aimag);
    if (location?.soum) randomQuery = randomQuery.eq('location_soum', location.soum);

    const { data: allForRandom } = await randomQuery;

    // Shuffle and pick random items
    const shuffled = (allForRandom || []).sort(() => Math.random() - 0.5);
    const randomProducts = shuffled.slice(0, cfg.randomSlots);

    // 4. Combine with smart merging (avoid duplicates)
    const usedIds = new Set<string>();
    const result: Product[] = [];

    // Add new products first (guaranteed visibility)
    const selectedNew = shuffleArray(newProducts || []).slice(0, cfg.newItemSlots);
    for (const p of selectedNew) {
        if (!usedIds.has(p.id)) {
            usedIds.add(p.id);
            result.push({ ...p, _source: 'new' });
        }
    }

    // Add popular products
    for (const p of (popularProducts || [])) {
        if (result.length >= cfg.totalItems - cfg.randomSlots) break;
        if (!usedIds.has(p.id)) {
            usedIds.add(p.id);
            result.push({ ...p, _source: 'popular' });
        }
    }

    // Inject random products at random positions (not just at end)
    for (const p of randomProducts) {
        if (result.length >= cfg.totalItems) break;
        if (!usedIds.has(p.id)) {
            usedIds.add(p.id);
            // Insert at random position (not end)
            const insertPos = Math.floor(Math.random() * result.length);
            result.splice(insertPos, 0, { ...p, _source: 'random' });
        }
    }

    return result.slice(0, cfg.totalItems);
}

/**
 * Calculate engagement score for a product
 * Uses time decay to prevent old popular items from dominating forever
 */
export function calculateEngagementScore(product: {
    views?: number;
    likes?: number;
    shares?: number;
    chat_clicks?: number;
    call_clicks?: number;
    created_at: string;
}): number {
    const views = product.views || 0;
    const likes = product.likes || 0;
    const shares = product.shares || 0;
    const chatClicks = product.chat_clicks || 0;
    const callClicks = product.call_clicks || 0;

    // Weighted engagement
    const rawScore =
        views * 1 +
        likes * 5 +
        shares * 10 +
        chatClicks * 15 +
        callClicks * 20;

    // Time decay factor (half-life: 7 days)
    const ageHours = (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60);
    const decayFactor = Math.pow(0.5, ageHours / (7 * 24));

    return rawScore * decayFactor;
}

/**
 * Update engagement scores for all products (run hourly)
 */
export async function updateAllEngagementScores(): Promise<number> {
    const { data: products } = await supabase
        .from('products')
        .select('id, views, likes, shares, chat_clicks, call_clicks, created_at')
        .eq('status', 'active');

    if (!products) return 0;

    let updated = 0;
    for (const product of products) {
        const score = calculateEngagementScore(product);
        await supabase
            .from('products')
            .update({ engagement_score: score })
            .eq('id', product.id);
        updated++;
    }

    return updated;
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get "Lucky Discovery" - completely random product
 * For homepage "You might like" section
 */
export async function getLuckyDiscovery(
    excludeIds: string[] = [],
    count: number = 1
): Promise<Product[]> {
    const { data } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(100);

    if (!data || data.length === 0) return [];

    return shuffleArray(data).slice(0, count);
}
