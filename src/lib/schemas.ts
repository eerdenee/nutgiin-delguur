/**
 * Runtime Data Validation with Zod
 * 
 * Problem: Schema changes over time. Old data may not have new fields.
 *          Frontend tries to access undefined fields -> White Screen of Death.
 * Solution: Validate all data at runtime with safe defaults.
 */

import { z } from 'zod';

// ============================================
// PRODUCT SCHEMA
// ============================================

export const LocationSchema = z.object({
    aimag: z.string().default('Улаанбаатар'),
    soum: z.string().default('')
}).default({ aimag: 'Улаанбаатар', soum: '' });

export const SellerSchema = z.object({
    name: z.string().default('Борлуулагч'),
    phone: z.string().default(''),
    image: z.string().optional(),
    isVerified: z.boolean().default(false),
    isBusiness: z.boolean().default(false),
    companyName: z.string().optional(),
    companyLogo: z.string().optional(),
    bankAccount: z.string().optional(),
    bankName: z.string().optional(),
    bankIBAN: z.string().optional()
}).default({
    name: 'Борлуулагч',
    phone: '',
    isVerified: false,
    isBusiness: false
});

export const ProductSchema = z.object({
    id: z.string(),
    title: z.string().default('Нэргүй бараа'),
    description: z.string().default(''),
    price: z.number().default(0),
    currency: z.string().default('MNT'),
    category: z.string().default('other'),
    location: LocationSchema,
    image: z.string().default('/placeholder.jpg'),
    images: z.array(z.string()).default([]),
    seller: SellerSchema,

    // Optional fields with defaults
    status: z.enum(['active', 'sold', 'expired', 'archived', 'hidden']).default('active'),
    tier: z.enum(['soum', 'aimag', 'national']).default('soum'),
    views: z.number().default(0),
    likes: z.number().default(0),
    shares: z.number().default(0),
    chatClicks: z.number().default(0),
    callClicks: z.number().default(0),
    saves: z.number().default(0),
    engagementScore: z.number().default(0),
    stock: z.number().default(1),

    // VIP fields
    isVip: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    vipExpiresAt: z.string().nullable().optional(),

    // Timestamps
    createdAt: z.string().default(new Date().toISOString()),
    updatedAt: z.string().optional(),
    lastRenewedAt: z.string().optional(),
    archivedAt: z.string().nullable().optional(),
    archiveReason: z.string().nullable().optional()
});

export type Product = z.infer<typeof ProductSchema>;

// ============================================
// USER/PROFILE SCHEMA
// ============================================

export const ProfileSchema = z.object({
    id: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    name: z.string().default('Хэрэглэгч'),
    avatarUrl: z.string().optional(),
    role: z.enum(['user', 'producer', 'admin', 'super_admin']).default('user'),

    // Business fields
    isBusiness: z.boolean().default(false),
    companyName: z.string().optional(),
    companyLogo: z.string().optional(),
    isVerified: z.boolean().default(false),

    // Ratings
    averageRating: z.number().default(0),
    totalReviews: z.number().default(0),

    // Location
    location: LocationSchema.optional(),

    // Timestamps
    createdAt: z.string().default(new Date().toISOString()),
    updatedAt: z.string().optional()
});

export type Profile = z.infer<typeof ProfileSchema>;

// ============================================
// REVIEW SCHEMA
// ============================================

export const ReviewSchema = z.object({
    id: z.string(),
    userId: z.string(),
    productId: z.string(),
    sellerId: z.string(),
    rating: z.number().min(1).max(5),
    review: z.string().default(''),
    isVerified: z.boolean().default(false),
    createdAt: z.string().default(new Date().toISOString())
});

export type Review = z.infer<typeof ReviewSchema>;

// ============================================
// NOTIFICATION SCHEMA
// ============================================

export const NotificationSchema = z.object({
    id: z.string(),
    userId: z.string(),
    type: z.string(),
    title: z.string(),
    message: z.string(),
    productId: z.string().optional(),
    read: z.boolean().default(false),
    readAt: z.string().optional(),
    createdAt: z.string().default(new Date().toISOString())
});

export type Notification = z.infer<typeof NotificationSchema>;

// ============================================
// SAFE PARSERS (Never throws, always returns safe value)
// ============================================

/**
 * Safely parse a product from database
 * Returns valid product or null (never crashes)
 */
export function safeParseProduct(data: unknown): Product | null {
    try {
        return ProductSchema.parse(data);
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('Product validation failed:', err);
        }
        return null;
    }
}

/**
 * Safely parse products array with fallback to empty array
 */
export function safeParseProducts(data: unknown): Product[] {
    if (!Array.isArray(data)) return [];

    return data
        .map(item => safeParseProduct(item))
        .filter((p): p is Product => p !== null);
}

/**
 * Safely parse profile
 */
export function safeParseProfile(data: unknown): Profile | null {
    try {
        return ProfileSchema.parse(data);
    } catch {
        return null;
    }
}

/**
 * Safely parse with fallback value
 */
export function safeParseWithDefault<T>(
    schema: z.ZodType<T>,
    data: unknown,
    defaultValue: T
): T {
    try {
        return schema.parse(data);
    } catch {
        return defaultValue;
    }
}

// ============================================
// FIELD EXTRACTORS (Safe access to nested fields)
// ============================================

/**
 * Safely get product price (never undefined)
 */
export function getProductPrice(product: unknown): number {
    const parsed = safeParseProduct(product);
    return parsed?.price ?? 0;
}

/**
 * Safely get product location string
 */
export function getProductLocation(product: unknown): string {
    const parsed = safeParseProduct(product);
    if (!parsed) return 'Байршил тодорхойгүй';
    return `${parsed.location.aimag}${parsed.location.soum ? ', ' + parsed.location.soum : ''}`;
}

/**
 * Safely get seller name
 */
export function getSellerName(product: unknown): string {
    const parsed = safeParseProduct(product);
    return parsed?.seller.name ?? 'Борлуулагч';
}
