/**
 * ALGORITHMIC FAIRNESS - Hard-Coded Equality
 * 
 * Problem: Algorithm favors high-traffic (UB) listings.
 *          Rural listings never appear on top.
 *          Platform becomes "UB only" marketplace.
 * 
 * Solution: Constitutional rules that FORCE diversity.
 *           "At least 3 of top 10 must be rural"
 */

import { supabase } from './supabase';

// ============================================
// THE ALGORITHMIC CONSTITUTION
// ============================================

/**
 * Үндсэн Хууль - Rules that CANNOT be overridden
 */
export const ALGORITHMIC_CONSTITUTION = {
    // RULE 1: Regional Diversity Quota
    // At least 30% of top 10 must be NON-Ulaanbaatar
    minRuralInTop10: 3,

    // RULE 2: No single aimag can dominate
    // Max 40% from any single aimag in top 10
    maxSingleAimagPercent: 0.4,

    // RULE 3: New seller protection
    // At least 1 listing from seller with 0 previous sales
    minNewSellerInTop10: 1,

    // RULE 4: Age diversity
    // At least 2 listings should be from last 24 hours
    minFreshInTop10: 2,

    // RULE 5: Price diversity  
    // Don't show only expensive or only cheap items
    requirePriceDiversity: true
};

// Capital city identifier
const CAPITAL_CITY = 'Улаанбаатар';

interface Product {
    id: string;
    title: string;
    price: number;
    location_aimag: string;
    location_soum?: string;
    seller_id: string;
    seller_total_sales?: number;
    created_at: string;
    engagement_score?: number;
    is_vip?: boolean;
    [key: string]: any;
}

interface FairnessResult {
    items: Product[];
    fairnessReport: {
        ruralCount: number;
        newSellerCount: number;
        freshCount: number;
        aimagDistribution: Record<string, number>;
        adjustmentsMade: string[];
    };
}

/**
 * Apply fairness algorithm to product list
 * This is the MAIN function - use this instead of raw sorting
 */
export function applyFairnessAlgorithm(
    products: Product[],
    topN: number = 10
): FairnessResult {
    const adjustments: string[] = [];

    // Start with engagement-based sorting
    let sorted = [...products].sort((a, b) => {
        // VIP always first
        if (a.is_vip && !b.is_vip) return -1;
        if (!a.is_vip && b.is_vip) return 1;
        // Then by engagement
        return (b.engagement_score || 0) - (a.engagement_score || 0);
    });

    // Get initial top N
    let topItems = sorted.slice(0, topN);
    let remainingItems = sorted.slice(topN);

    // ============================================
    // RULE 1: Ensure rural representation
    // ============================================
    const ruralNeeded = ALGORITHMIC_CONSTITUTION.minRuralInTop10;
    let ruralCount = topItems.filter(p => p.location_aimag !== CAPITAL_CITY).length;

    if (ruralCount < ruralNeeded) {
        const ruralToAdd = ruralNeeded - ruralCount;
        const availableRural = remainingItems.filter(p => p.location_aimag !== CAPITAL_CITY);

        // Swap UB items with rural items
        for (let i = 0; i < ruralToAdd && i < availableRural.length; i++) {
            // Find lowest-ranked UB item in top
            const ubIndex = topItems.findIndex(
                (p, idx) => p.location_aimag === CAPITAL_CITY && idx >= topN - ruralToAdd
            );

            if (ubIndex >= 0) {
                // Swap
                const removed = topItems[ubIndex];
                topItems[ubIndex] = availableRural[i];
                remainingItems = remainingItems.filter(p => p.id !== availableRural[i].id);
                remainingItems.push(removed);
                adjustments.push(`Rural boost: Added ${availableRural[i].location_aimag} item`);
            }
        }

        ruralCount = topItems.filter(p => p.location_aimag !== CAPITAL_CITY).length;
    }

    // ============================================
    // RULE 2: Prevent single aimag domination
    // ============================================
    const aimagCounts: Record<string, number> = {};
    topItems.forEach(p => {
        aimagCounts[p.location_aimag] = (aimagCounts[p.location_aimag] || 0) + 1;
    });

    const maxAllowed = Math.ceil(topN * ALGORITHMIC_CONSTITUTION.maxSingleAimagPercent);

    for (const [aimag, count] of Object.entries(aimagCounts)) {
        if (count > maxAllowed) {
            const excess = count - maxAllowed;
            const toRemove = topItems
                .filter(p => p.location_aimag === aimag)
                .slice(-excess); // Remove lowest ranked from this aimag

            const replacements = remainingItems
                .filter(p => p.location_aimag !== aimag)
                .slice(0, excess);

            for (let i = 0; i < toRemove.length && i < replacements.length; i++) {
                const removeIdx = topItems.findIndex(p => p.id === toRemove[i].id);
                if (removeIdx >= 0) {
                    topItems[removeIdx] = replacements[i];
                    adjustments.push(`Diversity: Reduced ${aimag} dominance`);
                }
            }
        }
    }

    // ============================================
    // RULE 3: New seller inclusion
    // ============================================
    const newSellerNeeded = ALGORITHMIC_CONSTITUTION.minNewSellerInTop10;
    let newSellerCount = topItems.filter(p => (p.seller_total_sales || 0) === 0).length;

    if (newSellerCount < newSellerNeeded) {
        const availableNewSeller = remainingItems.filter(p => (p.seller_total_sales || 0) === 0);

        if (availableNewSeller.length > 0) {
            // Replace last non-VIP item
            const replaceIdx = topItems.length - 1;
            if (!topItems[replaceIdx].is_vip) {
                const removed = topItems[replaceIdx];
                topItems[replaceIdx] = availableNewSeller[0];
                remainingItems.push(removed);
                adjustments.push('New seller boost: Added first-time seller');
            }
        }

        newSellerCount = topItems.filter(p => (p.seller_total_sales || 0) === 0).length;
    }

    // ============================================
    // RULE 4: Fresh content inclusion
    // ============================================
    const freshThreshold = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    const minFresh = ALGORITHMIC_CONSTITUTION.minFreshInTop10;
    let freshCount = topItems.filter(p =>
        new Date(p.created_at).getTime() > freshThreshold
    ).length;

    if (freshCount < minFresh) {
        const availableFresh = remainingItems.filter(p =>
            new Date(p.created_at).getTime() > freshThreshold
        );

        const toAdd = Math.min(minFresh - freshCount, availableFresh.length);
        for (let i = 0; i < toAdd; i++) {
            // Insert fresh items at positions 3, 6, etc. (not top, not bottom)
            const insertPos = Math.min(3 + i * 3, topItems.length - 1);
            if (!topItems[insertPos].is_vip) {
                topItems.splice(insertPos, 0, availableFresh[i]);
                topItems = topItems.slice(0, topN);
                adjustments.push('Fresh boost: Added recent listing');
            }
        }

        freshCount = topItems.filter(p =>
            new Date(p.created_at).getTime() > freshThreshold
        ).length;
    }

    // Final aimag distribution
    const finalDistribution: Record<string, number> = {};
    topItems.forEach(p => {
        finalDistribution[p.location_aimag] = (finalDistribution[p.location_aimag] || 0) + 1;
    });

    return {
        items: topItems,
        fairnessReport: {
            ruralCount,
            newSellerCount,
            freshCount,
            aimagDistribution: finalDistribution,
            adjustmentsMade: adjustments
        }
    };
}

/**
 * Get products with fairness applied  
 * Main entry point for fetching products
 */
export async function getFairProducts(
    filters: {
        category?: string;
        aimag?: string;
        soum?: string;
        searchQuery?: string;
    } = {},
    limit: number = 20
): Promise<FairnessResult> {
    let query = supabase
        .from('products')
        .select('*, profiles!seller_id(total_reviews)')
        .eq('status', 'active')
        .order('engagement_score', { ascending: false })
        .limit(limit * 3); // Fetch extra for fairness adjustments

    if (filters.category) {
        query = query.eq('category', filters.category);
    }
    if (filters.aimag) {
        query = query.eq('location_aimag', filters.aimag);
    }
    if (filters.soum) {
        query = query.eq('location_soum', filters.soum);
    }
    if (filters.searchQuery) {
        query = query.ilike('title', `%${filters.searchQuery}%`);
    }

    const { data: products } = await query;

    if (!products || products.length === 0) {
        return {
            items: [],
            fairnessReport: {
                ruralCount: 0,
                newSellerCount: 0,
                freshCount: 0,
                aimagDistribution: {},
                adjustmentsMade: []
            }
        };
    }

    // Map seller sales
    const productsWithSales = products.map((p: any) => ({
        ...p,
        seller_total_sales: p.profiles?.total_reviews || 0
    }));

    // Apply fairness algorithm
    const result = applyFairnessAlgorithm(productsWithSales, limit);

    // Log fairness report for monitoring
    if (result.fairnessReport.adjustmentsMade.length > 0) {
        console.log('[Fairness] Adjustments made:', result.fairnessReport.adjustmentsMade);
    }

    return result;
}

/**
 * Validate that algorithm is being fair (for admin dashboard)
 */
export async function auditAlgorithmFairness(): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
    aimagStats: Record<string, { count: number; percent: number }>;
}> {
    // Get last 100 "top" displays
    const { data: products } = await supabase
        .from('products')
        .select('location_aimag, created_at, seller_id')
        .eq('status', 'active')
        .order('views', { ascending: false })
        .limit(100);

    if (!products) {
        return {
            score: 100,
            issues: [],
            recommendations: [],
            aimagStats: {}
        };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check aimag distribution
    const aimagCounts: Record<string, number> = {};
    products.forEach((p: any) => {
        aimagCounts[p.location_aimag] = (aimagCounts[p.location_aimag] || 0) + 1;
    });

    const total = products.length;
    const aimagStats: Record<string, { count: number; percent: number }> = {};

    for (const [aimag, count] of Object.entries(aimagCounts)) {
        const percent = (count / total) * 100;
        aimagStats[aimag] = { count, percent: Math.round(percent) };

        if (aimag === CAPITAL_CITY && percent > 70) {
            issues.push(`Улаанбаатар ${percent.toFixed(0)}% эзэлж байна - хэт их!`);
            recommendations.push('Орон нутгийн зарыг илүүтэй дэмжээрэй');
            score -= 20;
        }
    }

    // Check rural representation
    const ruralCount = products.filter((p: any) => p.location_aimag !== CAPITAL_CITY).length;
    const ruralPercent = (ruralCount / total) * 100;

    if (ruralPercent < 30) {
        issues.push(`Орон нутгийн зар зөвхөн ${ruralPercent.toFixed(0)}%`);
        recommendations.push('Fairness algorithm идэвхжүүлсэн эсэхийг шалгаарай');
        score -= 20;
    }

    // Check freshness
    const freshThreshold = Date.now() - 24 * 60 * 60 * 1000;
    const freshCount = products.filter((p: any) =>
        new Date(p.created_at).getTime() > freshThreshold
    ).length;

    if (freshCount < 10) {
        issues.push('Шинэ зар маш цөөхөн топ-д байна');
        recommendations.push('Шинэ зарыг илүү өндөр rank-лаарай');
        score -= 10;
    }

    return {
        score: Math.max(0, score),
        issues,
        recommendations,
        aimagStats
    };
}

/**
 * Get fairness-aware search results
 */
export async function fairSearch(
    query: string,
    userLocation?: { aimag: string; soum?: string }
): Promise<Product[]> {
    const result = await getFairProducts({
        searchQuery: query
    }, 20);

    // If user has location, boost local results slightly
    if (userLocation) {
        const items = result.items;
        const localItems = items.filter(p =>
            p.location_aimag === userLocation.aimag ||
            p.location_soum === userLocation.soum
        );
        const otherItems = items.filter(p =>
            p.location_aimag !== userLocation.aimag
        );

        // Interleave: local, other, local, other...
        const interleaved: Product[] = [];
        let li = 0, oi = 0;
        for (let i = 0; i < items.length; i++) {
            if (i % 3 === 0 && li < localItems.length) {
                interleaved.push(localItems[li++]);
            } else if (oi < otherItems.length) {
                interleaved.push(otherItems[oi++]);
            } else if (li < localItems.length) {
                interleaved.push(localItems[li++]);
            }
        }

        return interleaved;
    }

    return result.items;
}
