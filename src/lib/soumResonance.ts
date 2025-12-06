/**
 * SOUM RESONANCE - Local Social Proof System
 * 
 * Problem: Mongolians don't trust strangers but trust "Nutgiin Ah".
 * Solution: Show local endorsements and same-soum indicators.
 */

import { supabase } from './supabase';

interface LocalTrustData {
    sellerSoum: string;
    sellerAimag: string;
    localEndorsements: number;   // How many from same soum recommend this seller
    totalSales: number;          // Total successful sales in this area
    isSameLocation: boolean;     // Is buyer from same location as seller
    trustLevel: 'local' | 'aimag' | 'national';
    badges: string[];
}

/**
 * Get local trust data for a seller
 */
export async function getLocalTrustData(
    sellerId: string,
    buyerLocation?: { aimag: string; soum: string }
): Promise<LocalTrustData> {
    // Get seller's location
    const { data: seller } = await supabase
        .from('profiles')
        .select('location, location_aimag, location_soum')
        .eq('id', sellerId)
        .single();

    const sellerAimag = seller?.location_aimag || seller?.location?.aimag || 'Улаанбаатар';
    const sellerSoum = seller?.location_soum || seller?.location?.soum || '';

    // Count local endorsements (reviews from same soum)
    const { count: localEndorsements } = await supabase
        .from('reviews')
        .select('*, profiles!inner(location_soum)', { count: 'exact' })
        .eq('seller_id', sellerId)
        .eq('profiles.location_soum', sellerSoum)
        .gte('rating', 4);

    // Count total successful transactions
    const { count: totalSales } = await supabase
        .from('verified_transactions')
        .select('*', { count: 'exact' })
        .eq('seller_id', sellerId)
        .eq('status', 'completed');

    // Check if same location
    const isSameSoum = buyerLocation?.soum === sellerSoum && sellerSoum !== '';
    const isSameAimag = buyerLocation?.aimag === sellerAimag;

    // Determine trust level
    let trustLevel: 'local' | 'aimag' | 'national' = 'national';
    if (isSameSoum) trustLevel = 'local';
    else if (isSameAimag) trustLevel = 'aimag';

    // Generate badges
    const badges: string[] = [];
    if (isSameSoum) badges.push('🏠 Нутгийн хүн');
    if (isSameAimag && !isSameSoum) badges.push('📍 Аймгийн хүн');
    if ((localEndorsements || 0) >= 10) badges.push('⭐ Нутагт танигдсан');
    if ((totalSales || 0) >= 50) badges.push('🏆 Туршлагатай');
    if ((totalSales || 0) >= 100) badges.push('💎 Итгэлтэй борлуулагч');

    return {
        sellerSoum,
        sellerAimag,
        localEndorsements: localEndorsements || 0,
        totalSales: totalSales || 0,
        isSameLocation: isSameSoum || isSameAimag,
        trustLevel,
        badges
    };
}

/**
 * Generate trust message for product page
 */
export function generateTrustMessage(trustData: LocalTrustData): string {
    const { sellerSoum, sellerAimag, localEndorsements, isSameLocation, trustLevel } = trustData;

    if (trustLevel === 'local') {
        return `🏠 Та нар нэг нутгийнхан байна! ${sellerSoum}-д ${localEndorsements} хүн энэ борлуулагчийг санал болгосон.`;
    }

    if (trustLevel === 'aimag') {
        return `📍 ${sellerAimag} аймгийн ${sellerSoum}-оос нийтлэгдсэн. ${localEndorsements} нутгийн хүн санал болгосон.`;
    }

    if (localEndorsements > 0) {
        return `Энэ зар ${sellerAimag}, ${sellerSoum}-оос нийтлэгдсэн. ${localEndorsements} нутгийн хүн санал болгосон.`;
    }

    return `${sellerAimag}${sellerSoum ? ', ' + sellerSoum : ''}-оос нийтлэгдсэн.`;
}

/**
 * Record local endorsement
 */
export async function endorseSeller(
    endorserId: string,
    sellerId: string
): Promise<{ success: boolean; message: string }> {
    // Check if already endorsed
    const { data: existing } = await supabase
        .from('seller_endorsements')
        .select('id')
        .eq('endorser_id', endorserId)
        .eq('seller_id', sellerId)
        .single();

    if (existing) {
        return { success: false, message: 'Та энэ борлуулагчийг аль хэдийн санал болгосон' };
    }

    // Check if from same location
    const { data: endorser } = await supabase
        .from('profiles')
        .select('location_soum')
        .eq('id', endorserId)
        .single();

    const { data: seller } = await supabase
        .from('profiles')
        .select('location_soum')
        .eq('id', sellerId)
        .single();

    const isSameLocation = endorser?.location_soum === seller?.location_soum;

    await supabase.from('seller_endorsements').insert({
        endorser_id: endorserId,
        seller_id: sellerId,
        is_same_location: isSameLocation,
        created_at: new Date().toISOString()
    });

    return { success: true, message: 'Амжилттай санал болголоо!' };
}

/**
 * Get endorsement count for trust display
 */
export async function getEndorsementStats(sellerId: string): Promise<{
    total: number;
    local: number;
    aimag: number;
    national: number;
}> {
    // Get all endorsements
    const { data: endorsements } = await supabase
        .from('seller_endorsements')
        .select('is_same_location')
        .eq('seller_id', sellerId);

    if (!endorsements) {
        return { total: 0, local: 0, aimag: 0, national: 0 };
    }

    return {
        total: endorsements.length,
        local: endorsements.filter(e => e.is_same_location).length,
        aimag: 0, // Would need more complex query
        national: endorsements.filter(e => !e.is_same_location).length
    };
}
