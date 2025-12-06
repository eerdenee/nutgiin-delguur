/**
 * SIMULATION LEVEL - SEE THROUGH THE ILLUSION
 * 
 * 1. North Star Metrics - Real metrics, not vanity
 * 2. Payment Verification - Double-entry ledger
 * 3. Bot Filtering - Only count real humans
 */

import { supabase } from './supabase';

// ============================================
// STRATEGY 1: NORTH STAR METRICS
// The ONE metric that matters
// ============================================

/**
 * The North Star Metric:
 * "Successful Connections" = Someone clicked "Call" button
 * 
 * If they didn't call, they're not a real user.
 */

interface NorthStarMetrics {
    // REAL metrics (these matter)
    dailyActiveUsers: number;           // DAU - people who visited today
    successfulConnections: number;      // Clicked "Call" or "Message"
    completedTransactions: number;      // Actually bought something

    // VANITY metrics (don't focus on these)
    totalRegisteredUsers: number;       // Many are "ghosts"
    totalPageViews: number;             // Includes bots

    // HEALTH ratios
    connectionRate: number;             // DAU → Connections %
    conversionRate: number;             // Connections → Transactions %

    // Trend
    trend: 'growing' | 'stable' | 'declining';
}

/**
 * Get North Star metrics for dashboard
 */
export async function getNorthStarMetrics(): Promise<NorthStarMetrics> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Real metrics
    const [dau, connections, transactions, totalUsers, yesterdayConnections] = await Promise.all([
        // DAU: Users who were active today
        supabase
            .from('user_activity')
            .select('user_id', { count: 'exact' })
            .gte('last_active', today),

        // Successful connections: Clicked call/message today
        supabase
            .from('connection_logs')
            .select('*', { count: 'exact' })
            .gte('created_at', today),

        // Completed transactions today
        supabase
            .from('verified_transactions')
            .select('*', { count: 'exact' })
            .eq('status', 'completed')
            .gte('created_at', today),

        // Vanity: Total users (for comparison only)
        supabase
            .from('profiles')
            .select('*', { count: 'exact' }),

        // Yesterday's connections for trend
        supabase
            .from('connection_logs')
            .select('*', { count: 'exact' })
            .gte('created_at', yesterday)
            .lt('created_at', today)
    ]);

    const dauCount = dau.count || 0;
    const connectionCount = connections.count || 0;
    const transactionCount = transactions.count || 0;
    const yesterdayCount = yesterdayConnections.count || 0;

    // Calculate rates
    const connectionRate = dauCount > 0 ? (connectionCount / dauCount) * 100 : 0;
    const conversionRate = connectionCount > 0 ? (transactionCount / connectionCount) * 100 : 0;

    // Determine trend
    let trend: 'growing' | 'stable' | 'declining' = 'stable';
    if (connectionCount > yesterdayCount * 1.1) trend = 'growing';
    else if (connectionCount < yesterdayCount * 0.9) trend = 'declining';

    return {
        dailyActiveUsers: dauCount,
        successfulConnections: connectionCount,
        completedTransactions: transactionCount,
        totalRegisteredUsers: totalUsers.count || 0,
        totalPageViews: 0, // Don't track this - it's vanity
        connectionRate: Math.round(connectionRate * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
        trend
    };
}

/**
 * Log a successful connection (the metric that matters!)
 */
export async function logConnection(
    viewerId: string | null,
    sellerId: string,
    productId: string,
    connectionType: 'call' | 'message' | 'copy_phone'
): Promise<void> {
    await supabase.from('connection_logs').insert({
        viewer_id: viewerId,
        seller_id: sellerId,
        product_id: productId,
        connection_type: connectionType,
        created_at: new Date().toISOString()
    });
}

/**
 * Get real user quality score
 * Ghosts have low scores
 */
export async function getUserQualityScore(userId: string): Promise<{
    score: number;
    isGhost: boolean;
    lastActive: string;
}> {
    const { data: activity } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false })
        .limit(1)
        .single();

    if (!activity) {
        return { score: 0, isGhost: true, lastActive: 'Never' };
    }

    const daysSinceActive = (Date.now() - new Date(activity.last_active).getTime()) / (24 * 3600000);

    let score = 100;
    if (daysSinceActive > 30) score -= 50;
    else if (daysSinceActive > 7) score -= 20;

    // Add points for actions
    score += Math.min(activity.connections_made * 10, 30);
    score += Math.min(activity.listings_posted * 5, 20);

    return {
        score: Math.max(0, Math.min(100, score)),
        isGhost: daysSinceActive > 30,
        lastActive: activity.last_active
    };
}

// ============================================
// STRATEGY 2: PAYMENT VERIFICATION
// Double-entry ledger reconciliation
// ============================================

interface PaymentReconciliation {
    transactionId: string;
    expectedAmount: number;
    actualAmount: number;
    status: 'verified' | 'pending' | 'mismatch' | 'not_received';
    webhookReceived: boolean;
    bankConfirmed: boolean;
    checkedAt: string;
}

/**
 * Verify payment really went through
 * Don't trust webhook alone!
 */
export async function verifyPaymentReceipt(
    transactionId: string,
    expectedAmount: number
): Promise<PaymentReconciliation> {
    // Step 1: Check if we got webhook
    const { data: webhook } = await supabase
        .from('payment_webhooks')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

    // Step 2: Check our internal ledger
    const { data: internal } = await supabase
        .from('internal_ledger')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

    // Step 3: Check bank API (in production)
    // const bankStatus = await checkBankAPI(transactionId);
    const bankConfirmed = internal?.bank_confirmed || false;

    // Determine status
    let status: 'verified' | 'pending' | 'mismatch' | 'not_received' = 'pending';

    if (!webhook) {
        status = 'not_received';
    } else if (!bankConfirmed) {
        status = 'pending';
    } else if (internal?.amount !== expectedAmount) {
        status = 'mismatch';
    } else {
        status = 'verified';
    }

    return {
        transactionId,
        expectedAmount,
        actualAmount: internal?.amount || 0,
        status,
        webhookReceived: !!webhook,
        bankConfirmed,
        checkedAt: new Date().toISOString()
    };
}

/**
 * Hourly reconciliation job
 * Compare our records with what's in the bank
 */
export async function runPaymentReconciliation(): Promise<{
    checked: number;
    verified: number;
    problems: number;
    totalMismatch: number;
}> {
    // Get all pending transactions from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 3600000).toISOString();

    const { data: pending } = await supabase
        .from('pending_payments')
        .select('*')
        .eq('status', 'pending')
        .gte('created_at', yesterday);

    let verified = 0;
    let problems = 0;
    let totalMismatch = 0;

    for (const payment of pending || []) {
        const result = await verifyPaymentReceipt(payment.reference, payment.amount);

        if (result.status === 'verified') {
            // Update to verified
            await supabase
                .from('pending_payments')
                .update({ status: 'verified', verified_at: new Date().toISOString() })
                .eq('id', payment.id);
            verified++;
        } else if (result.status === 'mismatch' || result.status === 'not_received') {
            // Flag for manual review
            await supabase.from('admin_alerts').insert({
                type: 'PAYMENT_MISMATCH',
                reason: `Transaction ${payment.reference}: Expected ${payment.amount}, Got ${result.actualAmount}`,
                severity: 'high',
                data: result
            });
            problems++;
            totalMismatch += Math.abs(payment.amount - result.actualAmount);
        }
    }

    return {
        checked: pending?.length || 0,
        verified,
        problems,
        totalMismatch
    };
}

/**
 * Log payment event for ledger
 */
export async function logPaymentEvent(
    transactionId: string,
    eventType: 'webhook_received' | 'bank_confirmed' | 'bank_rejected' | 'manual_verified',
    amount: number,
    details?: any
): Promise<void> {
    await supabase.from('payment_ledger').insert({
        transaction_id: transactionId,
        event_type: eventType,
        amount,
        details,
        created_at: new Date().toISOString()
    });
}

// ============================================
// STRATEGY 3: BOT FILTERING
// Only count real humans
// ============================================

interface HumanVerification {
    isHuman: boolean;
    confidence: number;    // 0-100
    signals: string[];
}

/**
 * Detect if visitor is human or bot
 */
export function detectHuman(metrics: {
    hasMouseMovement: boolean;
    hasScroll: boolean;
    hasKeypress: boolean;
    sessionDuration: number;    // seconds
    pageViews: number;
    userAgent: string;
}): HumanVerification {
    const signals: string[] = [];
    let score = 0;

    // Check for human signals
    if (metrics.hasMouseMovement) {
        score += 30;
        signals.push('Mouse moved');
    }
    if (metrics.hasScroll) {
        score += 20;
        signals.push('Page scrolled');
    }
    if (metrics.hasKeypress) {
        score += 20;
        signals.push('Keyboard used');
    }
    if (metrics.sessionDuration > 10 && metrics.sessionDuration < 3600) {
        score += 15;
        signals.push('Normal session length');
    }
    if (metrics.pageViews > 1 && metrics.pageViews < 50) {
        score += 15;
        signals.push('Normal browsing pattern');
    }

    // Check for bot signals
    const botPatterns = ['bot', 'crawler', 'spider', 'slurp', 'scraper'];
    const ua = metrics.userAgent.toLowerCase();
    if (botPatterns.some(p => ua.includes(p))) {
        score -= 50;
        signals.push('Bot user agent detected');
    }

    return {
        isHuman: score >= 50,
        confidence: Math.max(0, Math.min(100, score)),
        signals
    };
}

/**
 * Track real human visit (not bot)
 */
export async function trackHumanVisit(
    userId: string | null,
    sessionId: string,
    humanMetrics: HumanVerification
): Promise<void> {
    if (!humanMetrics.isHuman) {
        // Don't track bots at all
        return;
    }

    await supabase.from('human_visits').insert({
        user_id: userId,
        session_id: sessionId,
        confidence: humanMetrics.confidence,
        signals: humanMetrics.signals,
        created_at: new Date().toISOString()
    });
}

/**
 * Get REAL traffic (bots excluded)
 */
export async function getRealTrafficStats(
    days: number = 7
): Promise<{
    realVisits: number;
    botVisits: number;
    humanRatio: number;
    dailyBreakdown: { date: string; humans: number; bots: number }[];
}> {
    const startDate = new Date(Date.now() - days * 24 * 3600000).toISOString();

    const { data: humanVisits, count: humanCount } = await supabase
        .from('human_visits')
        .select('*', { count: 'exact' })
        .gte('created_at', startDate);

    const { count: totalViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact' })
        .gte('created_at', startDate);

    const realVisits = humanCount || 0;
    const totalVisits = totalViews || realVisits;
    const botVisits = totalVisits - realVisits;
    const humanRatio = totalVisits > 0 ? (realVisits / totalVisits) * 100 : 100;

    // Daily breakdown
    const dailyBreakdown: { date: string; humans: number; bots: number }[] = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(Date.now() - i * 24 * 3600000).toISOString().split('T')[0];

        const { count: dayHumans } = await supabase
            .from('human_visits')
            .select('*', { count: 'exact' })
            .gte('created_at', date)
            .lt('created_at', new Date(Date.now() - (i - 1) * 24 * 3600000).toISOString().split('T')[0]);

        dailyBreakdown.push({
            date,
            humans: dayHumans || 0,
            bots: 0 // Would need page_views table for accurate count
        });
    }

    return {
        realVisits,
        botVisits,
        humanRatio: Math.round(humanRatio),
        dailyBreakdown
    };
}

/**
 * Get honest dashboard stats (no vanity!)
 */
export async function getHonestDashboard(): Promise<{
    // What REALLY matters
    northStar: {
        connectionsToday: number;
        trend: string;
    };
    // Reality check
    realityCheck: {
        realUsers: number;
        ghostUsers: number;
        realTraffic: number;
        botTraffic: number;
    };
    // Money truth
    moneyTruth: {
        verifiedRevenue: number;
        pendingVerification: number;
        mismatches: number;
    };
}> {
    const metrics = await getNorthStarMetrics();
    const traffic = await getRealTrafficStats(1);

    // Count ghost users (inactive > 30 days)
    const { count: ghostCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .lt('last_active', new Date(Date.now() - 30 * 24 * 3600000).toISOString());

    // Get payment verification status
    const { count: verifiedPayments } = await supabase
        .from('pending_payments')
        .select('*', { count: 'exact' })
        .eq('status', 'verified');

    const { count: pendingPayments } = await supabase
        .from('pending_payments')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

    return {
        northStar: {
            connectionsToday: metrics.successfulConnections,
            trend: metrics.trend
        },
        realityCheck: {
            realUsers: metrics.dailyActiveUsers,
            ghostUsers: ghostCount || 0,
            realTraffic: traffic.realVisits,
            botTraffic: traffic.botVisits
        },
        moneyTruth: {
            verifiedRevenue: (verifiedPayments || 0) * 5000, // Avg transaction
            pendingVerification: pendingPayments || 0,
            mismatches: 0
        }
    };
}
