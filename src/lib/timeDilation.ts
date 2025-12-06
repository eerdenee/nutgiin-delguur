/**
 * TIME DILATION STRATEGIES
 * 
 * 1. Dopamine Loop - Instant gratification notifications
 * 2. Seasonal Velocity - Dynamic homepage by Mongolian seasons
 * 3. Freshness Illusion - Relative time + repost refreshing
 */

import { supabase } from './supabase';

// ============================================
// STRATEGY 1: DOPAMINE LOOP
// Instant gratification notifications
// ============================================

interface InstantMetrics {
    viewsInArea: number;
    potentialBuyers: number;
    trendingProbability: number;
    competitiveness: 'low' | 'medium' | 'high';
    message: string;
}

/**
 * Generate instant gratification metrics after posting
 * Show within 1 minute of posting to keep user engaged
 */
export async function generateInstantMetrics(
    productId: string,
    productData: {
        category: string;
        location_aimag: string;
        location_soum?: string;
        price: number;
    }
): Promise<InstantMetrics> {
    // Get users in same area (for "X people will see this")
    const { count: usersInArea } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('location_aimag', productData.location_aimag);

    // Get similar products to estimate competition
    const { count: similarProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('category', productData.category)
        .eq('location_aimag', productData.location_aimag)
        .eq('status', 'active');

    // Calculate metrics
    const viewsInArea = Math.min(usersInArea || 10, 500);
    const competition = similarProducts || 0;

    let competitiveness: 'low' | 'medium' | 'high' = 'low';
    if (competition > 20) competitiveness = 'high';
    else if (competition > 5) competitiveness = 'medium';

    const trendingProbability = competitiveness === 'low' ? 85 :
        competitiveness === 'medium' ? 65 : 45;

    // Generate encouraging message
    const messages = [
        `Таны зарыг ${productData.location_aimag}-д ${viewsInArea} хүнд амжилттай харууллаа! 🎉`,
        `"Эрэлттэй" ангилалд орох магадлал ${trendingProbability}% байна! 📈`,
        `${productData.location_soum || productData.location_aimag}-д энэ категорийн өрсөлдөөн ${competitiveness === 'low' ? 'бага' : competitiveness === 'medium' ? 'дунд' : 'их'} байна.`,
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];

    // Schedule follow-up notifications
    await scheduleFollowUpNotifications(productId);

    return {
        viewsInArea,
        potentialBuyers: Math.floor(viewsInArea * 0.1),
        trendingProbability,
        competitiveness,
        message
    };
}

/**
 * Schedule follow-up dopamine hits
 */
async function scheduleFollowUpNotifications(productId: string): Promise<void> {
    // After 1 hour: "Your listing got X views"
    // After 24 hours: "Similar items sold for X price"
    // After 3 days: "Boost your listing?"

    const notifications = [
        {
            delay_hours: 1,
            message: 'Таны зар сүүлийн 1 цагт {{views}} удаа үзэгдлээ!',
            type: 'engagement'
        },
        {
            delay_hours: 24,
            message: 'Ижил төстэй бараанууд өчигдөр амжилттай зарагдсан байна. Үнээ шалгаарай!',
            type: 'social_proof'
        },
        {
            delay_hours: 72,
            message: 'Таны зарыг VIP болговол 5 дахин олон хүнд харагдана! 🚀',
            type: 'upsell'
        }
    ];

    for (const notif of notifications) {
        const sendAt = new Date(Date.now() + notif.delay_hours * 3600000);

        await supabase.from('scheduled_notifications').insert({
            product_id: productId,
            message_template: notif.message,
            notification_type: notif.type,
            scheduled_for: sendAt.toISOString(),
            status: 'pending'
        });
    }
}

// ============================================
// STRATEGY 2: SEASONAL VELOCITY
// Dynamic homepage by Mongolian seasons
// ============================================

interface SeasonalTheme {
    month: number;
    name: string;
    nameMn: string;
    categories: string[];
    bannerMessage: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
    featuredKeywords: string[];
}

export const MONGOLIAN_SEASONS: SeasonalTheme[] = [
    {
        month: 1,
        name: 'tsagaan_sar',
        nameMn: 'Цагаан сар',
        categories: ['gift', 'clothing', 'food'],
        bannerMessage: '🎊 Цагаан Сарын Бэлгүүд',
        colors: { primary: '#0066CC', secondary: '#FFFFFF', accent: '#FFD700' },
        featuredKeywords: ['бэлэг', 'хэвийн боов', 'дээл', 'цагаан сар']
    },
    {
        month: 2,
        name: 'winter_sale',
        nameMn: 'Өвлийн Хямдрал',
        categories: ['clothing', 'electronics'],
        bannerMessage: '❄️ Өвлийн Хямдралт Үнээр',
        colors: { primary: '#1E3A5F', secondary: '#87CEEB', accent: '#FFFFFF' },
        featuredKeywords: ['өвөлжин', 'куртик', 'дулаан хувцас']
    },
    {
        month: 3,
        name: 'spring',
        nameMn: 'Хаврын Эхлэл',
        categories: ['livestock', 'farm', 'seeds'],
        bannerMessage: '🌱 Хаврын Шинэ Эхлэл',
        colors: { primary: '#4CAF50', secondary: '#C8E6C9', accent: '#FF9800' },
        featuredKeywords: ['үр', 'тариа', 'мал', 'хавар']
    },
    {
        month: 4,
        name: 'spring_cleaning',
        nameMn: 'Гэр Цэвэрлэгээ',
        categories: ['furniture', 'home', 'electronics'],
        bannerMessage: '🏠 Гэрээ Шинэчлэ',
        colors: { primary: '#9C27B0', secondary: '#E1BEE7', accent: '#00BCD4' },
        featuredKeywords: ['тавилга', 'гэр ахуй', 'хуучин зар']
    },
    {
        month: 5,
        name: 'mothers_day',
        nameMn: 'Ээжийн Баяр',
        categories: ['gift', 'jewelry', 'flowers'],
        bannerMessage: '💐 Ээжийн Баярын Бэлгүүд',
        colors: { primary: '#E91E63', secondary: '#FCE4EC', accent: '#4CAF50' },
        featuredKeywords: ['бэлэг', 'цэцэг', 'эрдэнийн чулуу']
    },
    {
        month: 6,
        name: 'children_day',
        nameMn: 'Хүүхдийн Баяр',
        categories: ['toys', 'clothing', 'bikes'],
        bannerMessage: '🎈 Хүүхдийн Баярын Бэлгүүд',
        colors: { primary: '#FF5722', secondary: '#FFCCBC', accent: '#2196F3' },
        featuredKeywords: ['тоглоом', 'унадаг дугуй', 'хүүхдийн хувцас']
    },
    {
        month: 7,
        name: 'naadam',
        nameMn: 'Наадам',
        categories: ['clothing', 'sports', 'travel'],
        bannerMessage: '🏇 Наадамд Бэлэн Үү?',
        colors: { primary: '#C62828', secondary: '#FFCDD2', accent: '#1565C0' },
        featuredKeywords: ['дээл', 'гутал', 'морь', 'наадам']
    },
    {
        month: 8,
        name: 'back_to_school',
        nameMn: 'Хичээл Эхлэл',
        categories: ['stationery', 'clothing', 'electronics'],
        bannerMessage: '📚 Хичээлийн Шинэ Жил!',
        colors: { primary: '#3F51B5', secondary: '#C5CAE9', accent: '#FFC107' },
        featuredKeywords: ['дэвтэр', 'дүрэмт хувцас', 'цүнх', 'байр']
    },
    {
        month: 9,
        name: 'autumn',
        nameMn: 'Намрын Хурал',
        categories: ['clothing', 'food', 'livestock'],
        bannerMessage: '🍂 Намрын Хямдрал',
        colors: { primary: '#FF9800', secondary: '#FFE0B2', accent: '#795548' },
        featuredKeywords: ['куртик', 'өвөлжилт', 'идэш']
    },
    {
        month: 10,
        name: 'winter_prep',
        nameMn: 'Өвөлд Бэлтгэл',
        categories: ['clothing', 'heating', 'food'],
        bannerMessage: '🔥 Өвөлд Бэлэн Үү?',
        colors: { primary: '#607D8B', secondary: '#CFD8DC', accent: '#FF5722' },
        featuredKeywords: ['зуух', 'нүүрс', 'дулаан хувцас', 'идэш']
    },
    {
        month: 11,
        name: 'idesh',
        nameMn: 'Идэшний Улирал',
        categories: ['food', 'livestock', 'kitchen'],
        bannerMessage: '🥩 Идэшний Улирал Эхэллээ',
        colors: { primary: '#8D6E63', secondary: '#D7CCC8', accent: '#F44336' },
        featuredKeywords: ['мах', 'идэш', 'гурил', 'будаа']
    },
    {
        month: 12,
        name: 'new_year',
        nameMn: 'Шинэ Жил',
        categories: ['gift', 'electronics', 'clothing'],
        bannerMessage: '🎄 Шинэ Жилийн Бэлгүүд',
        colors: { primary: '#1B5E20', secondary: '#C8E6C9', accent: '#D32F2F' },
        featuredKeywords: ['бэлэг', 'гацуур', 'шинэ жил']
    }
];

/**
 * Get current seasonal theme
 */
export function getCurrentSeasonalTheme(): SeasonalTheme {
    const month = new Date().getMonth() + 1; // 1-12
    return MONGOLIAN_SEASONS.find(s => s.month === month) || MONGOLIAN_SEASONS[0];
}

/**
 * Get featured products for current season
 */
export async function getSeasonalProducts(limit: number = 10): Promise<any[]> {
    const theme = getCurrentSeasonalTheme();

    const { data } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .in('category', theme.categories)
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}

/**
 * Get seasonal banner for homepage
 */
export function getSeasonalBanner(): {
    message: string;
    colors: { primary: string; secondary: string; accent: string };
    categories: string[];
} {
    const theme = getCurrentSeasonalTheme();
    return {
        message: theme.bannerMessage,
        colors: theme.colors,
        categories: theme.categories
    };
}

// ============================================
// STRATEGY 3: FRESHNESS ILLUSION
// Relative time + repost refreshing
// ============================================

/**
 * Format time as relative, always making things feel fresh
 */
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Make everything feel fresh
    if (diffSeconds < 60) return '🔥 Дөнгөж сая';
    if (diffMinutes < 60) return `${diffMinutes} минутын өмнө`;
    if (diffHours < 3) return '🔥 Саяхан';
    if (diffHours < 12) return 'Өнөөдөр';
    if (diffHours < 24) return 'Өнөөдөр';
    if (diffDays === 1) return 'Өчигдөр';
    if (diffDays <= 3) return `${diffDays} өдрийн өмнө`;
    if (diffDays <= 7) return 'Энэ долоо хоногт';

    // For older items, be vague on purpose
    if (diffDays <= 14) return 'Саяхан';
    if (diffDays <= 30) return 'Энэ сард';

    return 'Хэсэг хугацааны өмнө';
}

/**
 * Repost/Refresh a listing (reset its timestamp)
 */
export async function repostListing(productId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    newExpiryDate?: string;
}> {
    // Verify ownership
    const { data: product } = await supabase
        .from('products')
        .select('seller_id, last_renewed_at')
        .eq('id', productId)
        .single();

    if (!product || product.seller_id !== userId) {
        return { success: false, message: 'Зөвхөн өөрийнхөө зар сунгах боломжтой' };
    }

    // Check if already refreshed recently (max once per 24h)
    const lastRenewed = new Date(product.last_renewed_at || 0);
    const hoursSinceRenewal = (Date.now() - lastRenewed.getTime()) / 3600000;

    if (hoursSinceRenewal < 24) {
        return {
            success: false,
            message: `${Math.ceil(24 - hoursSinceRenewal)} цагийн дараа дахин сунгах боломжтой`
        };
    }

    // Refresh the listing
    const newExpiry = new Date(Date.now() + 14 * 24 * 3600000); // +14 days

    await supabase
        .from('products')
        .update({
            last_renewed_at: new Date().toISOString(),
            created_at: new Date().toISOString(), // Reset creation time!
            expired_at: newExpiry.toISOString(),
            status: 'active'
        })
        .eq('id', productId);

    return {
        success: true,
        message: 'Таны зар амжилттай шинэчлэгдлээ! 🎉',
        newExpiryDate: newExpiry.toISOString()
    };
}

/**
 * Get freshness badge for a listing
 */
export function getFreshnessBadge(createdAt: Date | string): {
    show: boolean;
    text: string;
    color: string;
} | null {
    const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    const hoursOld = (Date.now() - d.getTime()) / 3600000;

    if (hoursOld < 1) {
        return { show: true, text: '🔥 Шинэ', color: '#FF4500' };
    }
    if (hoursOld < 24) {
        return { show: true, text: '✨ Өнөөдөр', color: '#4CAF50' };
    }
    if (hoursOld < 72) {
        return { show: true, text: '🆕 Саяхан', color: '#2196F3' };
    }

    return null;
}
