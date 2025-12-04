/**
 * Subscription Plans & Limits
 * Багцын хязгаарлалт болон тохиргоо
 */

import { MS_PER_DAY, STORAGE_KEYS } from './constants';

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    limits: {
        adsPerMonth: number;
        imagesPerAd: number;
        videosPerAd: number;
        adDurationDays: number;
    };
    features: {
        companyLogo: boolean;
        companyName: boolean;
        featuredDesign: boolean;
        topPlacement: boolean;
        statistics: boolean;
        analytics: boolean;
        autoRenew: boolean;
        support24_7: boolean;
    };
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
    start: {
        id: 'start',
        name: 'ЭХЛЭЛ',
        price: 0,
        limits: {
            adsPerMonth: 3,
            imagesPerAd: 3,
            videosPerAd: 0,
            adDurationDays: 7,
        },
        features: {
            companyLogo: false,
            companyName: false,
            featuredDesign: false,
            topPlacement: false,
            statistics: false,
            analytics: false,
            autoRenew: false,
            support24_7: false,
        }
    },
    active: {
        id: 'active',
        name: 'ИДЭВХТЭЙ',
        price: 9900,
        limits: {
            adsPerMonth: 10,
            imagesPerAd: 5,
            videosPerAd: 1,
            adDurationDays: 14,
        },
        features: {
            companyLogo: false,
            companyName: false,
            featuredDesign: false,
            topPlacement: false,
            statistics: true,
            analytics: false,
            autoRenew: true,
            support24_7: false,
        }
    },
    business: {
        id: 'business',
        name: 'БИЗНЕС',
        price: 49000,
        limits: {
            adsPerMonth: 100,
            imagesPerAd: 10,
            videosPerAd: 2,
            adDurationDays: 30,
        },
        features: {
            companyLogo: true,
            companyName: true,
            featuredDesign: true,
            topPlacement: true,
            statistics: true,
            analytics: true,
            autoRenew: true,
            support24_7: true,
        }
    }
};

/**
 * Get user's current subscription from localStorage
 * ✅ ЧУХАЛ: paid flag шалгадаг
 */
export function getUserSubscription(): { plan: SubscriptionPlan; isActive: boolean; daysLeft: number; isPaid: boolean } {
    if (typeof window === 'undefined') {
        return { plan: SUBSCRIPTION_PLANS.start, isActive: true, daysLeft: 999, isPaid: false };
    }

    const stored = localStorage.getItem(STORAGE_KEYS.USER_SUBSCRIPTION);
    if (!stored) {
        return { plan: SUBSCRIPTION_PLANS.start, isActive: true, daysLeft: 999, isPaid: false };
    }

    try {
        const subscription = JSON.parse(stored);

        // ✅ ЧУХАЛ: Төлбөр төлсөн эсэхийг шалгах
        if (!subscription.paid) {
            return { plan: SUBSCRIPTION_PLANS.start, isActive: true, daysLeft: 999, isPaid: false };
        }

        const plan = SUBSCRIPTION_PLANS[subscription.tier] || SUBSCRIPTION_PLANS.start;

        // Check if subscription is still active
        const endDate = new Date(subscription.endDate);
        const now = new Date();
        const isActive = endDate > now;
        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / MS_PER_DAY));

        // Хугацаа дууссан бол START руу буцах
        if (!isActive) {
            return { plan: SUBSCRIPTION_PLANS.start, isActive: false, daysLeft: 0, isPaid: true };
        }

        return { plan, isActive, daysLeft, isPaid: true };
    } catch {
        return { plan: SUBSCRIPTION_PLANS.start, isActive: true, daysLeft: 999, isPaid: false };
    }
}

/**
 * Get user's ad count for current month
 */
export function getUserMonthlyAdCount(): number {
    if (typeof window === 'undefined') return 0;

    const ads: Array<{ createdAt?: string }> = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_ADS) || '[]');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return ads.filter((ad) => {
        if (!ad.createdAt) return false;
        const adDate = new Date(ad.createdAt);
        return adDate >= startOfMonth;
    }).length;
}

/**
 * Check if user can post more ads
 */
export function canPostMoreAds(): { allowed: boolean; remaining: number; limit: number } {
    const { plan } = getUserSubscription();
    const currentCount = getUserMonthlyAdCount();
    const remaining = Math.max(0, plan.limits.adsPerMonth - currentCount);

    return {
        allowed: remaining > 0,
        remaining,
        limit: plan.limits.adsPerMonth
    };
}

/**
 * Check if ad is expired
 */
export function isAdExpired(createdAt: string, tierAtCreation?: string): boolean {
    const plan = SUBSCRIPTION_PLANS[tierAtCreation || 'start'] || SUBSCRIPTION_PLANS.start;
    const createdDate = new Date(createdAt);
    const expirationDate = new Date(createdDate.getTime() + plan.limits.adDurationDays * MS_PER_DAY);

    return new Date() > expirationDate;
}

/**
 * Get days until ad expires
 */
export function getDaysUntilExpiration(createdAt: string, tierAtCreation?: string): number {
    const plan = SUBSCRIPTION_PLANS[tierAtCreation || 'start'] || SUBSCRIPTION_PLANS.start;
    const createdDate = new Date(createdAt);
    const expirationDate = new Date(createdDate.getTime() + plan.limits.adDurationDays * MS_PER_DAY);
    const now = new Date();

    return Math.max(0, Math.ceil((expirationDate.getTime() - now.getTime()) / MS_PER_DAY));
}

/**
 * Format remaining time
 */
export function formatTimeRemaining(createdAt: string, tierAtCreation?: string): string {
    const days = getDaysUntilExpiration(createdAt, tierAtCreation);

    if (days === 0) return 'Өнөөдөр дуусна';
    if (days === 1) return 'Маргааш дуусна';
    if (days <= 3) return `${days} хоногийн дараа дуусна`;
    return `${days} хоног үлдсэн`;
}
