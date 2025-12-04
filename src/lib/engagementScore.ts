/**
 * Engagement-Based Ranking System
 * "Хандалт"-аар жагсаах - P2P данснаас данс системд борлуулалт хянагдахгүй
 */

export interface EngagementStats {
    views: number;           // Үзэлт
    saves: number;           // Хадгалах
    callClicks: number;      // Залгах товч даралт
    chatClicks: number;      // Чатлах товч даралт
    shares: number;          // Хуваалцах
    createdAt: string;
}

export interface EngagementScore {
    score: number;
    level: 'newbie' | 'rising_star' | 'soum_top' | 'aimag_top' | 'national';
    badge?: string;
    tier: 'soum' | 'aimag' | 'national'; // Visibility tier
}

/**
 * Engagement Score Formula (New Algorithm - No Sales Tracking)
 * 
 * Views: 1 оноо
 * Saves: 3 оноо
 * Call/Chat clicks (Lead): 10 оноо (Худалдан авах сонирхлын дохио)
 * Shares: 5 оноо (Сайтын хандалт нэмэгдэнэ)
 */
export function calculateEngagementScore(stats: EngagementStats): number {
    const {
        views = 0,
        saves = 0,
        callClicks = 0,
        chatClicks = 0,
        shares = 0,
        createdAt
    } = stats;

    const rawScore =
        views * 1 +
        saves * 3 +
        (callClicks + chatClicks) * 10 +
        shares * 5;

    // Time Decay Factor:
    // Шинэ зар (0 хоног) -> 100% оноо
    // 90 хоногтой зар -> 50% оноо
    // 180 хоногтой зар -> 33% оноо
    // Энэ нь хуучин "Од" заруудыг мөнхөд байлгахаас сэргийлж, шинэ заруудад боломж олгоно.

    const daysSinceCreation = createdAt
        ? Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    const decayFactor = 1 + (daysSinceCreation / 90);

    return Math.round(rawScore / decayFactor);
}

/**
 * Шатлалт систем: Сум → Аймаг → Улс
 * 
 * Логик:
 * - Сумандаа TOP 5 → Аймагт харагдах эрх (+notification)
 * - Аймагтаа TOP 5 → Улсад харагдах эрх (+notification)
 */
export function getProductTier(
    stats: EngagementStats,
    isTopInSoum: boolean = false,
    isTopInAimag: boolean = false
): EngagementScore {
    const score = calculateEngagementScore(stats);
    const daysSinceCreation = Math.floor(
        (Date.now() - new Date(stats.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // National Level: Аймагтаа TOP 5
    if (isTopInAimag) {
        return {
            score,
            level: 'national',
            badge: '🇲🇳 УЛСАД ХАРАГДАЖ БАЙНА',
            tier: 'national'
        };
    }

    // Aimag Level: Сумандаа TOP 5
    if (isTopInSoum) {
        return {
            score,
            level: 'aimag_top',
            badge: '🏆 АЙМАГТ ХАРАГДАЖ БАЙНА',
            tier: 'aimag'
        };
    }

    // Soum Level: Default
    return {
        score,
        level: 'newbie',
        badge: undefined,
        tier: 'soum'
    };
}

/**
 * Бүтээгдэхүүний visibility-г тодорхойлох
 * 
 * @param productLocation - Бүтээгдэхүүний байршил (aimag, soum)
 * @param userLocation - Хэрэглэгчийн сонгосон байршил
 * @param tier - Бүтээгдэхүүний tier (soum/aimag/national)
 */
export function isProductVisible(
    productLocation: { aimag: string; soum: string },
    userLocation: { aimag?: string; soum?: string },
    tier: 'soum' | 'aimag' | 'national'
): boolean {
    // National tier: Хаана ч харагдана
    if (tier === 'national') return true;

    // Aimag tier: Тухайн аймагт харагдана
    if (tier === 'aimag') {
        return productLocation.aimag === userLocation.aimag;
    }

    // Soum tier: Зөвхөн тухайн сумдаа харагдана
    return (
        productLocation.aimag === userLocation.aimag &&
        productLocation.soum === userLocation.soum
    );
}

/**
 * TOP 5 бүтээгдэхүүнийг олох (Сум эсвэл Аймаг түвшинд)
 */
/**
 * TOP 5 бүтээгдэхүүнийг олох (Сум эсвэл Аймаг түвшинд)
 * 
 * Шудрага байдлын үүднээс босго оноо (threshold) тавина:
 * - Сумын TOP 5: Доод тал нь 50 оноотой байх ёстой.
 * - Аймгийн TOP 5: Доод тал нь 200 оноотой байх ёстой.
 */
export function getTop5Products<T extends EngagementStats & { location: { aimag: string; soum: string } }>(
    products: T[],
    aimag: string,
    soum?: string
): Set<string> {
    const threshold = soum ? 50 : 200; // Сум: 50, Аймаг: 200

    const filtered = soum
        ? products.filter(p => p.location.aimag === aimag && p.location.soum === soum)
        : products.filter(p => p.location.aimag === aimag);

    const sorted = filtered
        .map(p => ({
            ...p,
            _score: calculateEngagementScore(p)
        }))
        .filter(p => p._score >= threshold) // Босго оноо давсан байх ёстой
        .sort((a, b) => b._score - a._score)
        .slice(0, 5);

    return new Set(sorted.map((p: any) => p.id));
}

/**
 * Notification мессэж үүсгэх
 */
export function getTierUpgradeNotification(
    productTitle: string,
    location: { aimag: string; soum: string },
    newTier: 'aimag' | 'national'
): string {
    if (newTier === 'aimag') {
        return `🎉 Баяр хүргэе!\n\nТаны "${productTitle}" зар ${location.soum} сумандаа хамгийн их хандалт авч TOP 5-д багтлаа.\n\n🚀 Шагнал: Таны зар одооноос ${location.aimag.toUpperCase()} АЙМАГ ДАЯАР харагдаж эхэллээ.\n\n⚠️ Санамж: Аймгийн төвөөс захиалга ирвэл та унаанд дайх эсвэл шуудангаар явуулах бэлтгэлээ хангаарай.`;
    }

    return `🇲🇳 ОНЦГОЙ БАЯР!\n\nТаны "${productTitle}" зар ${location.aimag} аймагтаа хамгийн их хандалт авч TOP 5-д багтлаа.\n\n🚀 Шагнал: Таны зар одооноос МОНГОЛ УЛС ДАЯАР харагдаж эхэллээ.\n\n⚠️ Санамж: Улаанбаатараас захиалга ирвэл хүргэлтээ зохицуулах бэлтгэлээ хангаарай.`;
}
