/**
 * Rate Limiter Utility
 * Simple in-memory rate limiter for API routes
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 30,  // 30 requests per minute
};

export function checkRateLimit(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetIn: number } {
    const { windowMs, maxRequests } = { ...DEFAULT_CONFIG, ...config };
    const now = Date.now();

    const entry = rateLimitStore.get(identifier);

    // If no entry or window expired, create new entry
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + windowMs
        });
        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetIn: windowMs
        };
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetTime - now
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(identifier, entry);

    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetIn: entry.resetTime - now
    };
}

// Cleanup old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (now > entry.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

// Helper to get client identifier from request
export function getClientIdentifier(request: Request): string {
    // Try to get IP from various headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    return cfConnectingIp || realIp || forwarded?.split(',')[0] || 'anonymous';
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
    upload: { windowMs: 60 * 1000, maxRequests: 10 },  // 10 uploads per minute
    auth: { windowMs: 60 * 1000, maxRequests: 5 },     // 5 auth attempts per minute
    report: { windowMs: 60 * 1000, maxRequests: 10 },  // 10 reports per minute
    messages: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 messages per minute
    default: { windowMs: 60 * 1000, maxRequests: 100 }  // 100 requests per minute
};
