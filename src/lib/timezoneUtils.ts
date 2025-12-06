/**
 * Time Zone Safe Operations
 * 
 * Problem: Server is UTC, User is UTC+8, Database is UTC.
 *          User pays at 23:59 local time, system thinks it's next day UTC.
 *          Product expires "unexpectedly".
 * 
 * Solution: Always use UTC + Grace Periods
 */

// Mongolia timezone offset (UTC+8)
const MONGOLIA_OFFSET_HOURS = 8;

// Grace period for all time-sensitive operations
const GRACE_PERIOD_HOURS = 24;

/**
 * Get current time in Mongolia timezone
 */
export function getMongoliaTime(): Date {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcTime + (MONGOLIA_OFFSET_HOURS * 3600000));
}

/**
 * Convert any date to Mongolia timezone
 */
export function toMongoliaTime(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    const utcTime = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utcTime + (MONGOLIA_OFFSET_HOURS * 3600000));
}

/**
 * Format date for display in Mongolia timezone
 */
export function formatMongoliaDate(
    date: Date | string,
    format: 'full' | 'date' | 'time' | 'relative' = 'full'
): string {
    const d = toMongoliaTime(date);

    switch (format) {
        case 'date':
            return d.toLocaleDateString('mn-MN');
        case 'time':
            return d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
        case 'relative':
            return getRelativeTime(d);
        default:
            return d.toLocaleString('mn-MN');
    }
}

/**
 * Get relative time string (e.g., "2 цагийн өмнө")
 */
function getRelativeTime(date: Date): string {
    const now = getMongoliaTime();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'Саяхан';
    if (diffMinutes < 60) return `${diffMinutes} минутын өмнө`;
    if (diffHours < 24) return `${diffHours} цагийн өмнө`;
    if (diffDays < 30) return `${diffDays} өдрийн өмнө`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} сарын өмнө`;
    return `${Math.floor(diffDays / 365)} жилийн өмнө`;
}

/**
 * Check if a listing has expired WITH grace period
 */
export function isListingExpired(
    expiryDate: Date | string,
    includeGracePeriod: boolean = true
): { expired: boolean; inGracePeriod: boolean; expiresAt: Date; graceEndsAt: Date } {
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    const now = new Date();

    // Add grace period
    const graceEnd = new Date(expiry.getTime() + (GRACE_PERIOD_HOURS * 3600000));

    const expired = now > expiry;
    const inGracePeriod = expired && now <= graceEnd && includeGracePeriod;

    return {
        expired: includeGracePeriod ? now > graceEnd : now > expiry,
        inGracePeriod,
        expiresAt: expiry,
        graceEndsAt: graceEnd
    };
}

/**
 * Get user-friendly expiry message
 */
export function getExpiryMessage(expiryDate: Date | string): {
    status: 'active' | 'expiring_soon' | 'in_grace' | 'expired';
    message: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
} {
    const { expired, inGracePeriod, expiresAt, graceEndsAt } = isListingExpired(expiryDate);
    const now = new Date();

    if (expired && !inGracePeriod) {
        return {
            status: 'expired',
            message: 'Таны зарын хугацаа дууссан байна.',
            urgency: 'critical'
        };
    }

    if (inGracePeriod) {
        const hoursLeft = Math.ceil((graceEndsAt.getTime() - now.getTime()) / 3600000);
        return {
            status: 'in_grace',
            message: `Таны зарын хугацаа дууссан! ${hoursLeft} цагийн дотор сунгана уу.`,
            urgency: 'critical'
        };
    }

    const hoursUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / 3600000);

    if (hoursUntilExpiry <= 24) {
        return {
            status: 'expiring_soon',
            message: `Таны зар ${hoursUntilExpiry} цагийн дараа дуусна.`,
            urgency: 'high'
        };
    }

    if (hoursUntilExpiry <= 72) {
        const daysLeft = Math.ceil(hoursUntilExpiry / 24);
        return {
            status: 'expiring_soon',
            message: `Таны зар ${daysLeft} хоногийн дараа дуусна.`,
            urgency: 'medium'
        };
    }

    return {
        status: 'active',
        message: 'Таны зар идэвхтэй байна.',
        urgency: 'low'
    };
}

/**
 * Calculate safe expiry time (always favorable to user)
 */
export function calculateSafeExpiry(
    startDate: Date = new Date(),
    durationDays: number = 14
): {
    startAt: string;
    expiresAt: string;
    graceEndsAt: string;
    displayExpiry: string;
} {
    // Start at beginning of day in user's timezone
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    // Expire at END of day (23:59:59)
    const expiry = new Date(start.getTime() + (durationDays * 24 * 3600000));
    expiry.setHours(23, 59, 59, 999);

    // Grace period ends at end of next day
    const grace = new Date(expiry.getTime() + (GRACE_PERIOD_HOURS * 3600000));

    return {
        startAt: start.toISOString(),
        expiresAt: expiry.toISOString(),
        graceEndsAt: grace.toISOString(),
        displayExpiry: formatMongoliaDate(expiry, 'date')
    };
}

/**
 * Validate that a date operation won't cause timezone issues
 */
export function validateDateOperation(
    dateStr: string,
    operation: 'create' | 'expire' | 'renew'
): { valid: boolean; warning?: string; normalizedDate: string } {
    try {
        const date = new Date(dateStr);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return {
                valid: false,
                warning: 'Хүчингүй огноо',
                normalizedDate: new Date().toISOString()
            };
        }

        // Check if date is in reasonable range
        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 3600000);
        const oneYearAhead = new Date(now.getTime() + 365 * 24 * 3600000);

        if (date < oneYearAgo || date > oneYearAhead) {
            return {
                valid: false,
                warning: 'Огноо хэт хол байна',
                normalizedDate: now.toISOString()
            };
        }

        return {
            valid: true,
            normalizedDate: date.toISOString()
        };
    } catch {
        return {
            valid: false,
            warning: 'Огноо боловсруулахад алдаа',
            normalizedDate: new Date().toISOString()
        };
    }
}
