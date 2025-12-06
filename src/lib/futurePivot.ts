/**
 * FUTURE PIVOT PREPARATION
 * 
 * 1. Credit Scoring Data - For future micro-lending
 * 2. B2B Wholesale Data - For future supply chain
 * 
 * Collect the data NOW, monetize LATER.
 */

import { supabase } from './supabase';

// ============================================
// PIVOT 1: CREDIT SCORING DATA
// Track seller reliability for future lending
// ============================================

interface SellerCreditProfile {
    sellerId: string;

    // Transaction metrics
    totalTransactions: number;
    totalRevenue: number;           // In MNT
    averageTransactionValue: number;
    transactionFrequency: number;   // Per month

    // Reliability metrics
    successfulDeliveryRate: number; // 0-100%
    averageRating: number;          // 1-5
    disputeRate: number;            // 0-100%
    refundRate: number;

    // Activity metrics
    accountAgeDays: number;
    monthsActive: number;
    listingsPosted: number;

    // Computed credit score
    creditScore: number;            // 300-850 (like FICO)
    creditBand: 'A' | 'B' | 'C' | 'D' | 'F';
    loanEligibility: {
        eligible: boolean;
        maxLoanAmount: number;
        suggestedInterestRate: number; // Percentage
    };
}

/**
 * Calculate credit score for a seller
 * This is the "gold" data for future fintech pivot
 */
export async function calculateSellerCreditScore(
    sellerId: string
): Promise<SellerCreditProfile> {
    // Fetch all relevant data
    const [profile, transactions, reviews, products] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', sellerId).single(),
        supabase.from('verified_transactions').select('*').eq('seller_id', sellerId),
        supabase.from('reviews').select('*').eq('seller_id', sellerId),
        supabase.from('products').select('*').eq('seller_id', sellerId)
    ]);

    const txns = transactions.data || [];
    const revs = reviews.data || [];
    const prods = products.data || [];
    const prof = profile.data;

    // Calculate metrics
    const totalTransactions = txns.length;
    const totalRevenue = txns.reduce((sum, t) => sum + (t.amount || 0), 0);
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Account age
    const accountCreated = new Date(prof?.created_at || Date.now());
    const accountAgeDays = Math.floor((Date.now() - accountCreated.getTime()) / (24 * 3600000));

    // Monthly frequency
    const monthsActive = Math.max(1, Math.ceil(accountAgeDays / 30));
    const transactionFrequency = totalTransactions / monthsActive;

    // Ratings
    const averageRating = revs.length > 0
        ? revs.reduce((sum, r) => sum + r.rating, 0) / revs.length
        : 0;

    // Dispute/refund rates (simplified)
    const disputedTxns = txns.filter(t => t.status === 'disputed').length;
    const refundedTxns = txns.filter(t => t.status === 'refunded').length;
    const disputeRate = totalTransactions > 0 ? (disputedTxns / totalTransactions) * 100 : 0;
    const refundRate = totalTransactions > 0 ? (refundedTxns / totalTransactions) * 100 : 0;

    // Success rate
    const successfulTxns = txns.filter(t => t.status === 'completed').length;
    const successfulDeliveryRate = totalTransactions > 0 ? (successfulTxns / totalTransactions) * 100 : 0;

    // ============================================
    // CREDIT SCORE CALCULATION (300-850)
    // ============================================
    let baseScore = 500; // Starting point

    // Transaction history (+/- 150 points)
    if (totalTransactions >= 50) baseScore += 100;
    else if (totalTransactions >= 20) baseScore += 70;
    else if (totalTransactions >= 10) baseScore += 40;
    else if (totalTransactions >= 5) baseScore += 20;
    else baseScore -= 30;

    // Revenue stability (+/- 100 points)
    if (transactionFrequency >= 10) baseScore += 80;
    else if (transactionFrequency >= 5) baseScore += 50;
    else if (transactionFrequency >= 2) baseScore += 20;

    // Rating (+/- 100 points)
    if (averageRating >= 4.5) baseScore += 100;
    else if (averageRating >= 4.0) baseScore += 60;
    else if (averageRating >= 3.5) baseScore += 30;
    else if (averageRating >= 3.0) baseScore += 0;
    else if (averageRating > 0) baseScore -= 50;

    // Dispute rate (-50 to 0)
    if (disputeRate > 10) baseScore -= 50;
    else if (disputeRate > 5) baseScore -= 25;
    else if (disputeRate > 0) baseScore -= 10;

    // Account age (+50)
    if (accountAgeDays >= 365) baseScore += 50;
    else if (accountAgeDays >= 180) baseScore += 30;
    else if (accountAgeDays >= 90) baseScore += 10;

    // Clamp to 300-850
    const creditScore = Math.max(300, Math.min(850, baseScore));

    // Credit band
    let creditBand: 'A' | 'B' | 'C' | 'D' | 'F';
    if (creditScore >= 750) creditBand = 'A';
    else if (creditScore >= 650) creditBand = 'B';
    else if (creditScore >= 550) creditBand = 'C';
    else if (creditScore >= 450) creditBand = 'D';
    else creditBand = 'F';

    // Loan eligibility
    const eligible = creditScore >= 550 && totalTransactions >= 5;
    const maxLoanAmount = eligible
        ? Math.min(totalRevenue * 0.5, 50000000) // Max 50 million or 50% of revenue
        : 0;
    const suggestedInterestRate = creditBand === 'A' ? 12 :
        creditBand === 'B' ? 18 :
            creditBand === 'C' ? 24 :
                creditBand === 'D' ? 30 : 36;

    return {
        sellerId,
        totalTransactions,
        totalRevenue,
        averageTransactionValue,
        transactionFrequency,
        successfulDeliveryRate,
        averageRating,
        disputeRate,
        refundRate,
        accountAgeDays,
        monthsActive,
        listingsPosted: prods.length,
        creditScore,
        creditBand,
        loanEligibility: {
            eligible,
            maxLoanAmount,
            suggestedInterestRate
        }
    };
}

/**
 * Store credit score snapshot (for historical tracking)
 */
export async function storeCreditSnapshot(sellerId: string): Promise<void> {
    const profile = await calculateSellerCreditScore(sellerId);

    await supabase.from('credit_snapshots').insert({
        seller_id: sellerId,
        credit_score: profile.creditScore,
        credit_band: profile.creditBand,
        total_transactions: profile.totalTransactions,
        total_revenue: profile.totalRevenue,
        snapshot_date: new Date().toISOString()
    });
}

// ============================================
// PIVOT 2: B2B WHOLESALE DATA
// Track who is interested in bulk buying/selling
// ============================================

interface WholesaleProfile {
    userId: string;
    isWholesaleInterested: boolean;
    wholesaleType: 'seller' | 'buyer' | 'both';
    minimumOrderQuantity?: number;
    categories: string[];
    businessName?: string;
    businessRegNo?: string;     // ХХК регистр
    monthlyCapacity?: number;   // Units per month
    coverageAimags?: string[];  // Delivery coverage
}

/**
 * Mark user as wholesale interested
 */
export async function setWholesaleInterest(
    userId: string,
    data: Partial<WholesaleProfile>
): Promise<{ success: boolean }> {
    const { error } = await supabase
        .from('wholesale_profiles')
        .upsert({
            user_id: userId,
            is_wholesale_interested: true,
            wholesale_type: data.wholesaleType || 'seller',
            minimum_order_quantity: data.minimumOrderQuantity,
            categories: data.categories || [],
            business_name: data.businessName,
            business_reg_no: data.businessRegNo,
            monthly_capacity: data.monthlyCapacity,
            coverage_aimags: data.coverageAimags,
            updated_at: new Date().toISOString()
        });

    return { success: !error };
}

/**
 * Find potential wholesale partners in a region
 */
export async function findWholesalePartners(
    aimag: string,
    category: string,
    type: 'seller' | 'buyer'
): Promise<WholesaleProfile[]> {
    const { data } = await supabase
        .from('wholesale_profiles')
        .select('*')
        .eq('is_wholesale_interested', true)
        .eq('wholesale_type', type === 'seller' ? 'seller' : 'buyer')
        .contains('categories', [category])
        .contains('coverage_aimags', [aimag]);

    return (data || []).map(d => ({
        userId: d.user_id,
        isWholesaleInterested: d.is_wholesale_interested,
        wholesaleType: d.wholesale_type,
        minimumOrderQuantity: d.minimum_order_quantity,
        categories: d.categories,
        businessName: d.business_name,
        businessRegNo: d.business_reg_no,
        monthlyCapacity: d.monthly_capacity,
        coverageAimags: d.coverage_aimags
    }));
}

/**
 * Create cooperative (group of sellers)
 */
export async function createCooperative(
    name: string,
    leaderId: string,
    memberIds: string[],
    category: string,
    aimag: string
): Promise<{ success: boolean; cooperativeId?: string }> {
    const { data, error } = await supabase
        .from('cooperatives')
        .insert({
            name,
            leader_id: leaderId,
            member_ids: memberIds,
            category,
            aimag,
            status: 'active',
            created_at: new Date().toISOString()
        })
        .select('id')
        .single();

    return {
        success: !error,
        cooperativeId: data?.id
    };
}

/**
 * Get cooperative stats (for B2B pitches)
 */
export async function getCooperativeStats(cooperativeId: string): Promise<{
    memberCount: number;
    combinedMonthlyCapacity: number;
    averageRating: number;
    totalTransactions: number;
}> {
    const { data: coop } = await supabase
        .from('cooperatives')
        .select('member_ids')
        .eq('id', cooperativeId)
        .single();

    if (!coop) {
        return { memberCount: 0, combinedMonthlyCapacity: 0, averageRating: 0, totalTransactions: 0 };
    }

    let combinedCapacity = 0;
    let totalRating = 0;
    let totalTxns = 0;

    for (const memberId of coop.member_ids) {
        const { data: wholesale } = await supabase
            .from('wholesale_profiles')
            .select('monthly_capacity')
            .eq('user_id', memberId)
            .single();

        const { data: profile } = await supabase
            .from('profiles')
            .select('average_rating, total_reviews')
            .eq('id', memberId)
            .single();

        combinedCapacity += wholesale?.monthly_capacity || 0;
        totalRating += profile?.average_rating || 0;
        totalTxns += profile?.total_reviews || 0;
    }

    return {
        memberCount: coop.member_ids.length,
        combinedMonthlyCapacity: combinedCapacity,
        averageRating: coop.member_ids.length > 0 ? totalRating / coop.member_ids.length : 0,
        totalTransactions: totalTxns
    };
}

// ============================================
// DATA EXPORT FOR FUTURE USE
// ============================================

/**
 * Export all credit data for future fintech partner
 */
export async function exportCreditData(): Promise<{
    sellers: SellerCreditProfile[];
    exportDate: string;
    totalEligibleForLoans: number;
    totalLoanCapacity: number;
}> {
    const { data: sellers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'seller');

    const profiles: SellerCreditProfile[] = [];

    for (const seller of sellers || []) {
        const profile = await calculateSellerCreditScore(seller.id);
        profiles.push(profile);
    }

    const eligible = profiles.filter(p => p.loanEligibility.eligible);

    return {
        sellers: profiles,
        exportDate: new Date().toISOString(),
        totalEligibleForLoans: eligible.length,
        totalLoanCapacity: eligible.reduce((sum, p) => sum + p.loanEligibility.maxLoanAmount, 0)
    };
}

/**
 * Export wholesale network for B2B partner
 */
export async function exportWholesaleNetwork(): Promise<{
    sellers: WholesaleProfile[];
    buyers: WholesaleProfile[];
    cooperatives: number;
    totalMonthlyCapacity: number;
}> {
    const { data: profiles } = await supabase
        .from('wholesale_profiles')
        .select('*')
        .eq('is_wholesale_interested', true);

    const { count: coopCount } = await supabase
        .from('cooperatives')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

    const sellers = (profiles || [])
        .filter(p => p.wholesale_type === 'seller' || p.wholesale_type === 'both')
        .map(p => ({
            userId: p.user_id,
            isWholesaleInterested: true,
            wholesaleType: p.wholesale_type,
            categories: p.categories,
            monthlyCapacity: p.monthly_capacity,
            coverageAimags: p.coverage_aimags
        }));

    const buyers = (profiles || [])
        .filter(p => p.wholesale_type === 'buyer' || p.wholesale_type === 'both')
        .map(p => ({
            userId: p.user_id,
            isWholesaleInterested: true,
            wholesaleType: p.wholesale_type,
            categories: p.categories
        }));

    return {
        sellers: sellers as WholesaleProfile[],
        buyers: buyers as WholesaleProfile[],
        cooperatives: coopCount || 0,
        totalMonthlyCapacity: sellers.reduce((sum, s) => sum + (s.monthlyCapacity || 0), 0)
    };
}
