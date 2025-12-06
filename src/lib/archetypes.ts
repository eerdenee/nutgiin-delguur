/**
 * ARCHETYPE LEVEL - PSYCHOLOGICAL PATTERNS
 * 
 * 1. The Marketplace (Talbar) - Noise & Buzz, activity feed
 * 2. The Hunter-Gatherer - Serendipity, rare finds
 * 3. The Wise Elder - Community Justice, public accountability
 */

import { supabase } from './supabase';

// ============================================
// ARCHETYPE 1: THE MARKETPLACE (ТАЛБАЙ)
// Noise & Buzz - Make it feel alive
// ============================================

interface ActivityFeedItem {
    id: string;
    type: 'new_listing' | 'sold' | 'viewing' | 'search' | 'join';
    message: string;
    timestamp: Date;
    location?: string;
    icon: string;
}

/**
 * Get live activity feed for homepage ticker
 */
export async function getActivityFeed(limit: number = 10): Promise<ActivityFeedItem[]> {
    const activities: ActivityFeedItem[] = [];
    const now = Date.now();

    // Recent listings (real data)
    const { data: recentListings } = await supabase
        .from('products')
        .select('title, location_soum, location_aimag, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

    for (const listing of (recentListings as any[]) || []) {
        const location = listing.location_soum || listing.location_aimag;
        activities.push({
            id: `listing_${now}_${Math.random()}`,
            type: 'new_listing',
            message: `${location}-д "${listing.title.slice(0, 20)}..." зар нэмэгдлээ`,
            timestamp: new Date(listing.created_at),
            location,
            icon: '📦'
        });
    }

    // Recent users (real data)
    const { data: recentUsers } = await supabase
        .from('profiles')
        .select('location_aimag, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

    for (const user of (recentUsers as any[]) || []) {
        activities.push({
            id: `user_${now}_${Math.random()}`,
            type: 'join',
            message: `${user.location_aimag || 'Хэрэглэгч'}-аас шинэ гишүүн нэгдлээ`,
            timestamp: new Date(user.created_at),
            location: user.location_aimag,
            icon: '👋'
        });
    }

    // Simulated live viewing activity (creates buzz)
    const { count: activeViewers } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

    if (activeViewers) {
        activities.push({
            id: `viewing_${now}`,
            type: 'viewing',
            message: `Яг одоо ${Math.floor(Math.random() * 50) + 10} хүн зар үзэж байна`,
            timestamp: new Date(),
            icon: '👀'
        });
    }

    // Sort by timestamp and return
    return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
}

/**
 * Get "happening now" stats for header
 */
export async function getLiveStats(): Promise<{
    activeViewers: number;
    listingsToday: number;
    soldToday: number;
    onlineNow: string;
}> {
    const today = new Date().toISOString().split('T')[0];

    const [listings, transactions] = await Promise.all([
        supabase
            .from('products')
            .select('*', { count: 'exact' })
            .gte('created_at', today),
        supabase
            .from('verified_transactions')
            .select('*', { count: 'exact' })
            .gte('created_at', today)
    ]);

    // Simulated active viewers (in production, use WebSocket/presence)
    const activeViewers = Math.floor(Math.random() * 100) + 20;

    return {
        activeViewers,
        listingsToday: listings.count || 0,
        soldToday: transactions.count || 0,
        onlineNow: activeViewers > 50 ? '🔥 Идэвхтэй' : '✨ Амьд'
    };
}

/**
 * Format ticker message
 */
export function formatTickerMessage(item: ActivityFeedItem): string {
    const timeAgo = getTimeAgo(item.timestamp);
    return `${item.icon} ${item.message} • ${timeAgo}`;
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Дөнгөж сая';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} цаг`;
    return `${Math.floor(seconds / 86400)} өдөр`;
}

// ============================================
// ARCHETYPE 2: THE HUNTER-GATHERER
// Serendipity - Unexpected discoveries
// ============================================

interface RareFind {
    id: string;
    title: string;
    description: string;
    price: number;
    imageUrl?: string;
    location: string;
    rarity: 'rare' | 'unique' | 'vintage' | 'handmade';
    discoveryMessage: string;
}

/**
 * Get rare/interesting items for serendipity section
 */
export async function getRareFinds(userAimag?: string): Promise<RareFind[]> {
    // Look for items with rare keywords
    const rareKeywords = ['эртний', 'ховор', 'collector', 'гар урлал', 'эсгий', 'уламжлалт', 'vintage', 'antique'];

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .or(rareKeywords.map(k => `title.ilike.%${k}%`).join(','))
        .order('created_at', { ascending: false })
        .limit(10);

    const discoveries: string[] = [
        '🏺 Энэ ховор эд олдлоо!',
        '✨ Та үүнийг сонирхож магадгүй...',
        '🎯 Цөөхөнд л байдаг бараа',
        '🌟 Өвөрмөц олдвор',
        '🏆 Collector\'s item'
    ];

    return ((products as any[]) || []).map((p, i) => ({
        id: p.id,
        title: p.title,
        description: p.description?.slice(0, 100) || '',
        price: p.price,
        imageUrl: p.images?.[0],
        location: p.location_soum || p.location_aimag,
        rarity: detectRarity(p.title, p.description || ''),
        discoveryMessage: discoveries[i % discoveries.length]
    }));
}

/**
 * Detect item rarity from title/description
 */
function detectRarity(title: string, description: string): 'rare' | 'unique' | 'vintage' | 'handmade' {
    const text = (title + ' ' + description).toLowerCase();

    if (text.includes('эртний') || text.includes('vintage') || text.includes('antique')) {
        return 'vintage';
    }
    if (text.includes('гар урлал') || text.includes('handmade') || text.includes('эсгий')) {
        return 'handmade';
    }
    if (text.includes('ховор') || text.includes('rare') || text.includes('collector')) {
        return 'rare';
    }
    return 'unique';
}

/**
 * Get "You might also like" suggestions
 * Shows unexpected but interesting items
 */
export async function getSerendipitySuggestions(
    currentCategory?: string,
    currentAimag?: string
): Promise<any[]> {
    // Get items from DIFFERENT category but SAME location
    // This creates unexpected discoveries

    const { data: localDifferent } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .eq('location_aimag', currentAimag)
        .neq('category', currentCategory)
        .order('engagement_score', { ascending: false })
        .limit(3);

    // Get items from SAME category but DIFFERENT location (rare)
    const { data: distantSimilar } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .eq('category', currentCategory)
        .neq('location_aimag', currentAimag)
        .neq('location_aimag', 'Улаанбаатар') // Skip UB for uniqueness
        .order('created_at', { ascending: false })
        .limit(2);

    return [...(localDifferent || []), ...(distantSimilar || [])];
}

/**
 * Get random "treasure" item for gamification
 */
export async function getDailyTreasure(userId: string): Promise<{
    item: any;
    message: string;
    isNew: boolean;
} | null> {
    // Check if user already saw today's treasure
    const today = new Date().toISOString().split('T')[0];
    const { data: seen } = await supabase
        .from('treasure_views')
        .select('*')
        .eq('user_id', userId)
        .eq('view_date', today)
        .single();

    if (seen) {
        return { item: seen.product_data, message: 'Өнөөдрийн эрдэнэс', isNew: false };
    }

    // Find a random interesting item
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .gt('engagement_score', 50)
        .limit(100);

    if (!products || products.length === 0) return null;

    const randomItem = products[Math.floor(Math.random() * products.length)];

    // Record view
    await supabase.from('treasure_views').insert({
        user_id: userId,
        product_id: randomItem.id,
        product_data: randomItem,
        view_date: today
    });

    return {
        item: randomItem,
        message: '🎁 Өнөөдрийн эрдэнэс олдлоо!',
        isNew: true
    };
}

// ============================================
// ARCHETYPE 3: THE WISE ELDER
// Community Justice - Public accountability
// ============================================

interface PublicJudgment {
    id: string;
    type: 'ban' | 'warning' | 'restore';
    targetUserId: string;
    targetName: string;
    reason: string;
    reportCount: number;
    communityMessage: string;
    timestamp: Date;
}

/**
 * Get public community judgments for transparency
 */
export async function getPublicJudgments(limit: number = 5): Promise<PublicJudgment[]> {
    const { data: bans } = await supabase
        .from('profiles')
        .select('id, name, ban_reason, banned_at')
        .eq('is_banned', true)
        .order('banned_at', { ascending: false })
        .limit(limit);

    // Get report counts for banned users
    const judgments: PublicJudgment[] = [];

    for (const user of bans || []) {
        const { count } = await supabase
            .from('reports')
            .select('*', { count: 'exact' })
            .eq('reported_user_id', user.id);

        judgments.push({
            id: user.id,
            type: 'ban',
            targetUserId: user.id,
            targetName: maskName(user.name || 'Хэрэглэгч'),
            reason: user.ban_reason || 'Дүрэм зөрчсөн',
            reportCount: count || 0,
            communityMessage: generateCommunityMessage(count || 0, 'ban'),
            timestamp: new Date(user.banned_at || Date.now())
        });
    }

    return judgments;
}

/**
 * Mask name for privacy (show first letter only)
 */
function maskName(name: string): string {
    if (name.length <= 2) return name[0] + '***';
    return name[0] + '***' + name[name.length - 1];
}

/**
 * Generate community message based on action
 */
function generateCommunityMessage(reportCount: number, action: 'ban' | 'warning' | 'restore'): string {
    if (action === 'ban') {
        if (reportCount >= 50) {
            return `Олон нийт ${reportCount} удаа мэдэгдсэн тул овгоос хөөгдлөө`;
        }
        return `${reportCount} хүний мэдэгдлээр бүртгэл хаагдлаа`;
    }
    if (action === 'warning') {
        return `Олны шүүмжлэлийг хүлээж авснаар сануулга авлаа`;
    }
    return `Олон нийтийн шийдвэрээр эрхээ сэргээлээ`;
}

/**
 * Check if action should be public
 */
export function shouldMakePublic(reportCount: number, severity: string): boolean {
    // Make public if many reports
    if (reportCount >= 10) return true;

    // Make public if severe
    if (severity === 'scam' || severity === 'illegal') return true;

    return false;
}

/**
 * Create public announcement for community action
 */
export async function createCommunityAnnouncement(
    action: 'ban' | 'warning' | 'policy_change',
    details: {
        targetUserId?: string;
        reason: string;
        reportCount?: number;
    }
): Promise<void> {
    const message = action === 'ban'
        ? `⚖️ Олон нийтийн ${details.reportCount}+ мэдэгдлээр нэг бүртгэл хаагдлаа. Шалтгаан: ${details.reason}`
        : action === 'warning'
            ? `⚠️ Дүрэм зөрчсөн хэрэглэгчид сануулга өгөгдлөө`
            : `📢 ${details.reason}`;

    await supabase.from('community_announcements').insert({
        type: action,
        message,
        target_user_id: details.targetUserId,
        created_at: new Date().toISOString()
    });
}

/**
 * Get community trust score for a user
 * Based on reports, ratings, and community standing
 */
export async function getCommunityTrustScore(userId: string): Promise<{
    score: number;
    level: 'trusted' | 'normal' | 'watched' | 'banned';
    badges: string[];
}> {
    const [
        { data: profile },
        { count: reportCount },
        { count: endorsementCount }
    ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('reports').select('*', { count: 'exact' }).eq('reported_user_id', userId),
        supabase.from('seller_endorsements').select('*', { count: 'exact' }).eq('seller_id', userId)
    ]);

    if (!profile) {
        return { score: 0, level: 'normal', badges: [] };
    }

    if (profile.is_banned) {
        return { score: 0, level: 'banned', badges: ['🚫 Хориотой'] };
    }

    let score = 50; // Base score
    const badges: string[] = [];

    // Endorsements boost
    score += Math.min((endorsementCount || 0) * 5, 30);
    if ((endorsementCount || 0) >= 10) badges.push('👍 Олны итгэлтэй');

    // Rating boost
    const rating = profile.average_rating || 0;
    score += rating * 5;
    if (rating >= 4.5) badges.push('⭐ Өндөр үнэлгээтэй');

    // Account age boost
    const ageDays = (Date.now() - new Date(profile.created_at).getTime()) / (24 * 3600000);
    if (ageDays >= 365) {
        score += 10;
        badges.push('🏆 Ахмад гишүүн');
    }

    // Report penalty
    score -= Math.min((reportCount || 0) * 10, 40);

    // Verified bonus
    if (profile.phone_verified) {
        score += 10;
        badges.push('✅ Баталгаажсан');
    }

    // Determine level
    let level: 'trusted' | 'normal' | 'watched' | 'banned' = 'normal';
    if (score >= 80) level = 'trusted';
    else if (score >= 50) level = 'normal';
    else level = 'watched';

    return { score: Math.max(0, Math.min(100, score)), level, badges };
}
