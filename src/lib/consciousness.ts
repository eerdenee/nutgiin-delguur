/**
 * CONSCIOUSNESS LEVEL - ETHICAL ALGORITHMS
 * 
 * 1. Robin Hood Algorithm - Support rural/handicraft for free
 * 2. Crisis Compassion - Free during disasters (Zud)
 * 3. Radical Transparency - Honest UI labels
 * 4. Ethical Dopamine - Help fast, not addict
 */

import { supabase } from './supabase';

// ============================================
// STRATEGY 1: ROBIN HOOD ALGORITHM
// Free boost for those who need it
// ============================================

// Categories that get free boost (national production)
const NATIONAL_PRODUCTION_CATEGORIES = [
    'handicraft',      // Гар урлал
    'dairy',           // Цагаан идээ
    'felt',            // Эсгий
    'wool',            // Ноос
    'cashmere',        // Ноолуур
    'leather',         // Арьс шир
    'traditional',     // Уламжлалт
    'organic',         // Органик
    'local_food'       // Орон нутгийн хүнс
];

// Remote soums that get extra visibility
const REMOTE_SOUMS = [
    // These would be populated with actual remote soums
    // For now, any non-capital gets some boost
];

interface RobinHoodBoost {
    shouldBoost: boolean;
    boostReason?: string;
    boostAmount: number;  // 0-100, added to engagement score
}

/**
 * Calculate Robin Hood boost for a listing
 */
export function calculateRobinHoodBoost(product: {
    category: string;
    location_aimag: string;
    location_soum?: string;
    seller_total_sales?: number;
}): RobinHoodBoost {
    let boostAmount = 0;
    const reasons: string[] = [];

    // 1. National production category boost
    if (NATIONAL_PRODUCTION_CATEGORIES.includes(product.category)) {
        boostAmount += 20;
        reasons.push('Үндэсний үйлдвэрлэл');
    }

    // 2. Rural location boost (non-UB)
    if (product.location_aimag !== 'Улаанбаатар') {
        boostAmount += 15;
        reasons.push('Орон нутгийн бараа');
    }

    // 3. New seller boost (first 5 sales)
    if ((product.seller_total_sales || 0) < 5) {
        boostAmount += 10;
        reasons.push('Шинэ борлуулагч');
    }

    // 4. Remote area extra boost
    if (product.location_soum && REMOTE_SOUMS.includes(product.location_soum)) {
        boostAmount += 10;
        reasons.push('Алслагдсан сум');
    }

    return {
        shouldBoost: boostAmount > 0,
        boostReason: reasons.join(', '),
        boostAmount
    };
}

/**
 * Apply Robin Hood boost to products
 */
export function applyRobinHoodBoost<T extends {
    id: string;
    category: string;
    location_aimag: string;
    location_soum?: string;
    seller_total_sales?: number;
    engagement_score?: number;
}>(products: T[]): T[] {
    return products.map(product => {
        const boost = calculateRobinHoodBoost(product);
        if (boost.shouldBoost) {
            return {
                ...product,
                engagement_score: (product.engagement_score || 0) + boost.boostAmount,
                _robinhoodBoost: boost.boostReason
            };
        }
        return product;
    });
}

// ============================================
// STRATEGY 2: CRISIS COMPASSION (Зудын Протокол)
// Free during disasters
// ============================================

export type CrisisType = 'zud' | 'flood' | 'fire' | 'earthquake' | 'pandemic' | 'none';

interface CrisisMode {
    active: boolean;
    type: CrisisType;
    affectedAimags: string[];
    freeCategories: string[];
    message: string;
    startDate: string;
    endDate?: string;
}

const CRISIS_CATEGORY_MAP: Record<CrisisType, string[]> = {
    zud: ['hay', 'fodder', 'livestock', 'fuel', 'coal', 'wood', 'animal_feed'],
    flood: ['shelter', 'clothing', 'food', 'medicine'],
    fire: ['shelter', 'clothing', 'food', 'medicine', 'construction'],
    earthquake: ['shelter', 'construction', 'food', 'medicine'],
    pandemic: ['medicine', 'masks', 'sanitizer', 'food'],
    none: []
};

/**
 * Get current crisis mode
 */
export async function getCrisisMode(): Promise<CrisisMode> {
    const { data } = await supabase
        .from('crisis_mode')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!data) {
        return {
            active: false,
            type: 'none',
            affectedAimags: [],
            freeCategories: [],
            message: '',
            startDate: ''
        };
    }

    return {
        active: true,
        type: data.type,
        affectedAimags: data.affected_aimags || [],
        freeCategories: CRISIS_CATEGORY_MAP[data.type as CrisisType] || [],
        message: data.message,
        startDate: data.start_date,
        endDate: data.end_date
    };
}

/**
 * Activate crisis mode (Admin only)
 */
export async function activateCrisisMode(
    adminId: string,
    type: CrisisType,
    affectedAimags: string[],
    message: string
): Promise<{ success: boolean }> {
    // Deactivate previous crisis modes
    await supabase
        .from('crisis_mode')
        .update({ active: false })
        .eq('active', true);

    // Activate new one
    await supabase.from('crisis_mode').insert({
        type,
        affected_aimags: affectedAimags,
        message,
        active: true,
        activated_by: adminId,
        start_date: new Date().toISOString()
    });

    return { success: true };
}

/**
 * Check if listing is free during crisis
 */
export async function isListingFreeDuringCrisis(
    category: string,
    aimag: string
): Promise<{ isFree: boolean; reason?: string }> {
    const crisis = await getCrisisMode();

    if (!crisis.active) {
        return { isFree: false };
    }

    // Check if category is in free list
    const categoryFree = crisis.freeCategories.some(c =>
        category.toLowerCase().includes(c)
    );

    // Check if aimag is affected
    const aimagAffected = crisis.affectedAimags.length === 0 || // All aimags
        crisis.affectedAimags.includes(aimag);

    if (categoryFree && aimagAffected) {
        return {
            isFree: true,
            reason: `${crisis.message} - Энэ категорийн зар үнэгүй`
        };
    }

    return { isFree: false };
}

/**
 * Get crisis banner for homepage
 */
export async function getCrisisBanner(): Promise<{
    show: boolean;
    message: string;
    categories: string[];
    color: string;
} | null> {
    const crisis = await getCrisisMode();

    if (!crisis.active) return null;

    return {
        show: true,
        message: crisis.message,
        categories: crisis.freeCategories,
        color: '#DC2626' // Red for crisis
    };
}

// ============================================
// STRATEGY 3: RADICAL TRANSPARENCY
// Honest UI labels
// ============================================

export interface TransparencyLabel {
    type: 'sponsored' | 'boosted' | 'algorithmic' | 'new' | 'local';
    text: string;
    tooltip: string;
    color: string;
}

/**
 * Get transparency labels for a product
 */
export function getTransparencyLabels(product: {
    is_vip?: boolean;
    is_boosted?: boolean;
    _robinhoodBoost?: string;
    created_at: string;
    location_aimag: string;
}, userLocation?: string): TransparencyLabel[] {
    const labels: TransparencyLabel[] = [];

    // Sponsored/VIP label
    if (product.is_vip) {
        labels.push({
            type: 'sponsored',
            text: 'Сурталчилгаа',
            tooltip: 'Энэ зарын эзэн төлбөр төлж харагдалтаа нэмэгдүүлсэн',
            color: '#F59E0B'
        });
    }

    // Robin Hood boost label
    if (product._robinhoodBoost) {
        labels.push({
            type: 'boosted',
            text: '🌿 Орон нутаг',
            tooltip: `Бид ${product._robinhoodBoost} заруудыг үнэгүй дэмждэг`,
            color: '#10B981'
        });
    }

    // New listing label
    const hoursOld = (Date.now() - new Date(product.created_at).getTime()) / 3600000;
    if (hoursOld < 24) {
        labels.push({
            type: 'new',
            text: '🆕 Шинэ',
            tooltip: 'Сүүлийн 24 цагт нийтлэгдсэн',
            color: '#3B82F6'
        });
    }

    // Local label
    if (userLocation && product.location_aimag === userLocation) {
        labels.push({
            type: 'local',
            text: '📍 Ойролцоо',
            tooltip: 'Таны байршилтай ойр',
            color: '#8B5CF6'
        });
    }

    return labels;
}

/**
 * Generate "Why am I seeing this?" explanation
 */
export function generateWhySeeing(product: {
    is_vip?: boolean;
    category: string;
    location_aimag: string;
    _robinhoodBoost?: string;
}, userContext: {
    recentCategories?: string[];
    location?: string;
    searchQuery?: string;
}): string[] {
    const reasons: string[] = [];

    // Sponsored
    if (product.is_vip) {
        reasons.push('• Энэ бол төлбөртэй сурталчилгаа');
    }

    // Category match
    if (userContext.recentCategories?.includes(product.category)) {
        reasons.push(`• Та өмнө нь "${product.category}" категори үзсэн`);
    }

    // Location match
    if (userContext.location === product.location_aimag) {
        reasons.push('• Таны байршилтай ойр');
    }

    // Search relevance
    if (userContext.searchQuery) {
        reasons.push(`• "${userContext.searchQuery}" хайлттай холбоотой`);
    }

    // Robin Hood
    if (product._robinhoodBoost) {
        reasons.push(`• Бид орон нутгийн үйлдвэрлэлийг дэмждэг`);
    }

    if (reasons.length === 0) {
        reasons.push('• Таны сонирхолд тохирсон байж болзошгүй');
    }

    return reasons;
}

// ============================================
// STRATEGY 4: ETHICAL DOPAMINE
// Help fast, don't addict
// ============================================

/**
 * Wellness messages after completing actions
 */
export const WELLNESS_MESSAGES = {
    afterPosting: [
        '✅ Зар амжилттай! Одоо утасаа тавиад амраарай 🌿',
        '✅ Зар нийтлэгдлээ! Гэр бүлдээ цаг гаргах цаг боллоо 💚',
        '✅ Амжилттай! Бүтээмжтэй өдөр өнгөрүүлээрэй 🌟'
    ],
    afterPurchaseIntent: [
        '💡 Бодож үзээрэй: Энэ чамд үнэхээр хэрэгтэй юу?',
        '💡 Санамж: Яарах хэрэггүй, сайн бодоорой',
    ],
    afterLongSession: [
        '⏰ Та 30 минут үзэж байна. Завсарлага авах уу?',
        '🌿 Нүдээ амраах цаг боллоо',
    ],
    achievementUnlocked: [
        '🎉 Та эхний зараа амжилттай зарлаа!',
        '🏆 Та 10 зар нийтэллээ - Идэвхтэй борлуулагч!'
    ]
};

/**
 * Get contextual wellness message
 */
export function getWellnessMessage(
    context: 'afterPosting' | 'afterPurchaseIntent' | 'afterLongSession' | 'achievementUnlocked'
): string {
    const messages = WELLNESS_MESSAGES[context];
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Track session time for wellness reminders
 */
export function shouldShowWellnessReminder(sessionStartTime: Date): boolean {
    const minutesSpent = (Date.now() - sessionStartTime.getTime()) / 60000;
    return minutesSpent >= 30; // After 30 minutes
}

/**
 * Goal-oriented design: Suggest next action
 */
export function getSuggestedNextAction(userState: {
    hasPostedRecently?: boolean;
    isSearching?: boolean;
    hasPendingChats?: boolean;
}): {
    action: string;
    message: string;
    icon: string;
} {
    if (userState.hasPendingChats) {
        return {
            action: 'check_chats',
            message: 'Танд хариу хүлээж буй чат байна',
            icon: '💬'
        };
    }

    if (userState.hasPostedRecently) {
        return {
            action: 'take_break',
            message: 'Зарыг идэвхжүүлсэн. Дараа нь шалгаарай!',
            icon: '🌿'
        };
    }

    if (userState.isSearching) {
        return {
            action: 'refine_search',
            message: 'Хайлтаа нарийвчлах уу?',
            icon: '🔍'
        };
    }

    return {
        action: 'explore',
        message: 'Шинэ зарууд үзэх үү?',
        icon: '✨'
    };
}

/**
 * Anti-doom-scroll: Should we pause the feed?
 */
export function shouldPauseFeed(
    itemsViewed: number,
    minutesSpent: number
): { pause: boolean; message?: string } {
    // After viewing 50 items without action
    if (itemsViewed > 50) {
        return {
            pause: true,
            message: 'Олон зар үзчихлээ. Хайлтаа өөрчлөх үү?'
        };
    }

    // After 20 minutes of scrolling
    if (minutesSpent > 20) {
        return {
            pause: true,
            message: 'Нүдээ амраах цаг боллоо. Завсарлага авах уу?'
        };
    }

    return { pause: false };
}
