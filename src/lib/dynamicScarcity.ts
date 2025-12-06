/**
 * Dynamic Scarcity Algorithm
 * 
 * Purpose: Prevent "Attention Inflation" in VIP/Boost listings
 * Problem: If 90% of listings are VIP, VIP becomes meaningless
 */

const VIP_CONFIG = {
    maxPercentage: 0.20, // Maximum 20% of listings can be VIP at any time
    basePriceVIP: 9900,  // Base VIP price in MNT
    maxSurgeMultiplier: 3, // Maximum price surge (3x = 29,700 MNT)
    surgeSteps: [
        { threshold: 0.15, multiplier: 1.5 },  // 15% filled -> 1.5x price
        { threshold: 0.18, multiplier: 2.0 },  // 18% filled -> 2x price
        { threshold: 0.20, multiplier: 3.0 },  // 20% filled -> 3x price (max)
    ],
    cooldownHours: 24, // How long to wait before slots open again
};

interface VIPStatus {
    availableSlots: number;
    totalSlots: number;
    currentPercentage: number;
    currentPrice: number;
    priceMultiplier: number;
    message: string;
    canPurchase: boolean;
}

/**
 * Get current VIP status for a location (Aimag/Soum)
 */
export async function getVIPStatus(
    aimag: string,
    soum?: string,
    supabase?: any
): Promise<VIPStatus> {
    // 1. Count total active listings in this location
    let query = supabase
        .from('products')
        .select('id, is_vip', { count: 'exact' })
        .eq('location_aimag', aimag)
        .eq('status', 'active');

    if (soum) {
        query = query.eq('location_soum', soum);
    }

    const { count: totalListings } = await query;
    const total = totalListings || 0;

    // 2. Count current VIP listings
    let vipQuery = supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('location_aimag', aimag)
        .eq('status', 'active')
        .eq('is_vip', true);

    if (soum) {
        vipQuery = vipQuery.eq('location_soum', soum);
    }

    const { count: vipListings } = await vipQuery;
    const currentVIP = vipListings || 0;

    // 3. Calculate slots
    const maxVIPSlots = Math.max(1, Math.floor(total * VIP_CONFIG.maxPercentage));
    const availableSlots = Math.max(0, maxVIPSlots - currentVIP);
    const currentPercentage = total > 0 ? currentVIP / total : 0;

    // 4. Calculate surge pricing
    let priceMultiplier = 1;
    for (const step of VIP_CONFIG.surgeSteps) {
        if (currentPercentage >= step.threshold) {
            priceMultiplier = step.multiplier;
        }
    }

    const currentPrice = Math.round(VIP_CONFIG.basePriceVIP * priceMultiplier);
    const canPurchase = availableSlots > 0;

    // 5. Generate message
    let message = '';
    if (!canPurchase) {
        message = `VIP зай дүүрсэн. ${VIP_CONFIG.cooldownHours} цагийн дараа дахин шалгаарай.`;
    } else if (priceMultiplier > 1) {
        message = `VIP эрэлт өндөр байна! Үнэ ${priceMultiplier}x болсон.`;
    } else {
        message = `${availableSlots} VIP зай боломжтой.`;
    }

    return {
        availableSlots,
        totalSlots: maxVIPSlots,
        currentPercentage: Math.round(currentPercentage * 100),
        currentPrice,
        priceMultiplier,
        message,
        canPurchase
    };
}

/**
 * Attempt to purchase VIP slot
 */
export async function purchaseVIPSlot(
    productId: string,
    userId: string,
    supabase: any
): Promise<{ success: boolean; message: string; price?: number }> {
    // 1. Get product location
    const { data: product } = await supabase
        .from('products')
        .select('location_aimag, location_soum, is_vip')
        .eq('id', productId)
        .single();

    if (!product) {
        return { success: false, message: 'Бүтээгдэхүүн олдсонгүй.' };
    }

    if (product.is_vip) {
        return { success: false, message: 'Энэ бараа аль хэдийн VIP байна.' };
    }

    // 2. Check VIP availability
    const status = await getVIPStatus(product.location_aimag, product.location_soum, supabase);

    if (!status.canPurchase) {
        return {
            success: false,
            message: status.message
        };
    }

    // 3. Create payment record (actual payment integration needed)
    const { error } = await supabase
        .from('vip_purchases')
        .insert({
            product_id: productId,
            user_id: userId,
            price_paid: status.currentPrice,
            multiplier: status.priceMultiplier,
            location_aimag: product.location_aimag,
            location_soum: product.location_soum,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

    if (error) {
        return { success: false, message: 'Төлбөр боловсруулахад алдаа гарлаа.' };
    }

    // 4. Update product
    await supabase
        .from('products')
        .update({
            is_vip: true,
            vip_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', productId);

    return {
        success: true,
        message: `VIP амжилттай идэвхжүүллээ! Үнэ: ₮${status.currentPrice.toLocaleString()}`,
        price: status.currentPrice
    };
}

/**
 * Cron job: Expire VIP listings
 */
export async function expireVIPListings(supabase: any): Promise<number> {
    const { data, error } = await supabase
        .from('products')
        .update({ is_vip: false, vip_expires_at: null })
        .eq('is_vip', true)
        .lte('vip_expires_at', new Date().toISOString())
        .select('id');

    return data?.length || 0;
}
