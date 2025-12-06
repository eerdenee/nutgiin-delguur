/**
 * Price Logic & Anomaly Detection System
 * 
 * Purpose: Detect suspicious pricing that could indicate money laundering
 * Legal: Anti-Money Laundering (AML) compliance
 */

// Category-based price limits (in MNT)
export const CATEGORY_PRICE_LIMITS: Record<string, { min: number; max: number; alertThreshold: number }> = {
    'clothing': { min: 5000, max: 5000000, alertThreshold: 2000000 },
    'electronics': { min: 10000, max: 50000000, alertThreshold: 20000000 },
    'food': { min: 1000, max: 500000, alertThreshold: 200000 },
    'handicraft': { min: 5000, max: 10000000, alertThreshold: 5000000 },
    'livestock': { min: 100000, max: 100000000, alertThreshold: 50000000 },
    'agriculture': { min: 5000, max: 50000000, alertThreshold: 20000000 },
    'dairy': { min: 2000, max: 1000000, alertThreshold: 500000 },
    'meat': { min: 10000, max: 10000000, alertThreshold: 5000000 },
    'wool': { min: 5000, max: 5000000, alertThreshold: 2000000 },
    'leather': { min: 10000, max: 20000000, alertThreshold: 10000000 },
    'furniture': { min: 50000, max: 50000000, alertThreshold: 20000000 },
    'vehicles': { min: 1000000, max: 500000000, alertThreshold: 200000000 },
    'realestate': { min: 10000000, max: 5000000000, alertThreshold: 1000000000 },
    'services': { min: 5000, max: 10000000, alertThreshold: 5000000 },
    'other': { min: 1000, max: 100000000, alertThreshold: 50000000 }
};

export interface PriceValidationResult {
    isValid: boolean;
    reason?: string;
    alertLevel: 'none' | 'warning' | 'critical';
    suggestedAction?: string;
}

/**
 * Validate price against category limits
 */
export function validatePrice(
    price: number,
    category: string,
    title: string
): PriceValidationResult {
    const limits = CATEGORY_PRICE_LIMITS[category] || CATEGORY_PRICE_LIMITS['other'];

    // 1. Below minimum - likely spam or error
    if (price < limits.min) {
        return {
            isValid: false,
            reason: `Үнэ хэт бага байна. ${category} ангилалд хамгийн багадаа ₮${limits.min.toLocaleString()} байх ёстой.`,
            alertLevel: 'warning',
            suggestedAction: 'BLOCK'
        };
    }

    // 2. Above maximum - likely error or fraud
    if (price > limits.max) {
        return {
            isValid: false,
            reason: `Үнэ хэт өндөр байна. ${category} ангилалд дээд тал нь ₮${limits.max.toLocaleString()} байх ёстой.`,
            alertLevel: 'critical',
            suggestedAction: 'BLOCK_AND_ALERT_ADMIN'
        };
    }

    // 3. Above alert threshold - requires admin review
    if (price > limits.alertThreshold) {
        return {
            isValid: true,
            reason: `Өндөр үнэтэй бараа. Админ шалгах шаардлагатай.`,
            alertLevel: 'warning',
            suggestedAction: 'ALLOW_BUT_ALERT_ADMIN'
        };
    }

    // 4. Normal price
    return {
        isValid: true,
        alertLevel: 'none'
    };
}

/**
 * Detect suspicious seller patterns
 */
export async function detectSuspiciousPatterns(
    sellerId: string,
    supabase: any
): Promise<{ suspicious: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    // 1. Get seller's recent listings
    const { data: listings } = await supabase
        .from('products')
        .select('price, category, created_at')
        .eq('seller_id', sellerId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

    if (!listings || listings.length === 0) {
        return { suspicious: false, reasons: [] };
    }

    // 2. Check for rapid posting (more than 20 in a day)
    const todayListings = listings.filter(l =>
        new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    if (todayListings.length > 20) {
        reasons.push(`Өнөөдөр ${todayListings.length} зар нийтэлсэн (Хэвийн бус идэвхтэй)`);
    }

    // 3. Check for suspiciously uniform pricing
    const prices = listings.map(l => l.price);
    const uniquePrices = new Set(prices);
    if (listings.length > 5 && uniquePrices.size === 1) {
        reasons.push('Бүх барааны үнэ адилхан (Сэжигтэй)');
    }

    // 4. Check for extreme price variations
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    if (maxPrice > minPrice * 1000) {
        reasons.push(`Үнийн зөрүү хэт их: ₮${minPrice.toLocaleString()} - ₮${maxPrice.toLocaleString()}`);
    }

    return {
        suspicious: reasons.length > 0,
        reasons
    };
}

/**
 * Admin alert for suspicious activity
 */
export async function alertAdminSuspiciousActivity(
    data: {
        sellerId: string;
        productId?: string;
        reason: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
    },
    supabase: any
): Promise<void> {
    await supabase.from('admin_alerts').insert({
        type: 'SUSPICIOUS_ACTIVITY',
        seller_id: data.sellerId,
        product_id: data.productId,
        reason: data.reason,
        severity: data.severity,
        status: 'pending',
        created_at: new Date().toISOString()
    });
}
