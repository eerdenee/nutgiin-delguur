/**
 * Application Constants
 * Planck-level optimization: All magic numbers and strings centralized
 */

// Time constants (milliseconds)
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = MS_PER_SECOND * 60;
export const MS_PER_HOUR = MS_PER_MINUTE * 60;
export const MS_PER_DAY = MS_PER_HOUR * 24;

// Subscription tier IDs (must match everywhere)
export const TIER_IDS = {
    START: 'start',
    ACTIVE: 'active',
    BUSINESS: 'business',
} as const;

// Subscription tier names (Mongolian)
export const TIER_NAMES = {
    [TIER_IDS.START]: 'ЭХЛЭЛ',
    [TIER_IDS.ACTIVE]: 'ИДЭВХТЭЙ',
    [TIER_IDS.BUSINESS]: 'БИЗНЕС',
} as const;

// Subscription prices (MNT)
export const TIER_PRICES = {
    [TIER_IDS.START]: 0,
    [TIER_IDS.ACTIVE]: 9900,
    [TIER_IDS.BUSINESS]: 49000,
} as const;

// Formatted prices (for display)
export const TIER_PRICES_FORMATTED = {
    [TIER_IDS.START]: '0₮',
    [TIER_IDS.ACTIVE]: '9,900₮',
    [TIER_IDS.BUSINESS]: '49,000₮',
} as const;

// Subscription limits
export const SUBSCRIPTION_LIMITS = {
    [TIER_IDS.START]: {
        adsPerMonth: 3,
        imagesPerAd: 3,
        videosPerAd: 0,
        adDurationDays: 7,
    },
    [TIER_IDS.ACTIVE]: {
        adsPerMonth: 10,
        imagesPerAd: 5,
        videosPerAd: 1,
        adDurationDays: 14,
    },
    [TIER_IDS.BUSINESS]: {
        adsPerMonth: 100,
        imagesPerAd: 10,
        videosPerAd: 2,
        adDurationDays: 30,
    },
} as const;

// localStorage keys (centralized to prevent typos)
export const STORAGE_KEYS = {
    USER_SUBSCRIPTION: 'userSubscription',
    MY_ADS: 'my_ads',
    FAVORITES: 'favorites',
    USER_PROFILE: 'userProfile',
    USER_ROLE: 'userRole',
    CONVERSATIONS: 'conversations',
    ORDERS: 'orders',
    // Moderation
    MODERATION_HISTORY: 'moderation_history',
    APPEALS: 'appeals',
    REPORTS: 'product_reports',
} as const;

// Custom event names (centralized)
export const EVENTS = {
    FAVORITES_UPDATED: 'favoritesUpdated',
    ADS_UPDATED: 'adsUpdated',
    PROFILE_UPDATED: 'profileUpdated',
    ROLE_UPDATED: 'roleUpdated',
    CHAT_UPDATED: 'chatUpdated',
    ORDERS_UPDATED: 'ordersUpdated',
    STORAGE_QUOTA_EXCEEDED: 'storage-quota-exceeded',
    // Moderation
    MODERATION_ACTION: 'moderationAction',
    REPORT_SUBMITTED: 'reportSubmitted',
} as const;

// Appeal deadline in days
export const APPEAL_DEADLINE_DAYS = 7;

// Report thresholds
export const REPORT_THRESHOLD_HIDE = 15;      // Auto-hide at this many reports
export const REPORT_THRESHOLD_DELETE = 30;    // Auto-delete at this many reports

// Video platforms regex patterns
export const VIDEO_PATTERNS = {
    YOUTUBE: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/,
    TIKTOK: /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
} as const;

// Helper function to calculate days from milliseconds
export function msToDays(ms: number): number {
    return Math.ceil(ms / MS_PER_DAY);
}

// Helper function to get days between dates
export function daysBetween(date1: Date, date2: Date): number {
    return msToDays(Math.abs(date2.getTime() - date1.getTime()));
}

// Type exports
export type TierId = typeof TIER_IDS[keyof typeof TIER_IDS];
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type EventName = typeof EVENTS[keyof typeof EVENTS];
