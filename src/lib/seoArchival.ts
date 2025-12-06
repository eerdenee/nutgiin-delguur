/**
 * SEO-Safe Product Archival System
 * 
 * Problem: Expired/deleted products create 404 pages that hurt SEO.
 * Solution: Soft delete + redirect to similar products.
 */

import { supabase } from './supabase';

/**
 * Archive a product instead of deleting (SEO-safe)
 */
export async function archiveProduct(
    productId: string,
    reason: 'sold' | 'expired' | 'deleted_by_user' | 'moderated'
): Promise<{ success: boolean; message: string }> {

    const { error } = await supabase
        .from('products')
        .update({
            status: 'archived',
            archived_at: new Date().toISOString(),
            archive_reason: reason,
            // Keep SEO data for redirect purposes
            seo_redirect_active: true
        })
        .eq('id', productId);

    if (error) {
        return { success: false, message: 'Алдаа гарлаа.' };
    }

    return { success: true, message: 'Зар архивлагдлаа.' };
}

/**
 * Get archived product info for redirect page
 * Instead of 404, show "This item was sold" + similar items
 */
export async function getArchivedProductRedirect(productId: string): Promise<{
    found: boolean;
    originalProduct?: {
        title: string;
        category: string;
        location: { aimag: string; soum: string };
        archivedReason: string;
        archivedAt: string;
    };
    similarProducts?: any[];
    redirectMessage: string;
}> {
    // 1. Check if product exists in archive
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (!product) {
        return {
            found: false,
            redirectMessage: 'Бүтээгдэхүүн олдсонгүй.'
        };
    }

    // 2. If product is active, no redirect needed
    if (product.status === 'active') {
        return {
            found: true,
            redirectMessage: 'Бүтээгдэхүүн идэвхтэй байна.'
        };
    }

    // 3. Get reason-specific message
    let message = '';
    switch (product.archive_reason) {
        case 'sold':
            message = '🎉 Энэ бараа зарагдсан байна!';
            break;
        case 'expired':
            message = '⏰ Энэ зарын хугацаа дууссан байна.';
            break;
        case 'deleted_by_user':
            message = 'Худалдагч энэ зарыг устгасан байна.';
            break;
        case 'moderated':
            message = '⚠️ Энэ зар модераторын шийдвэрээр нуугдсан.';
            break;
        default:
            message = 'Энэ бараа одоогоор боломжгүй байна.';
    }

    // 4. Find similar products
    const { data: similar } = await supabase
        .from('products')
        .select('id, title, price, image, location')
        .eq('category', product.category)
        .eq('status', 'active')
        .eq('location_aimag', product.location_aimag)
        .neq('id', productId)
        .order('created_at', { ascending: false })
        .limit(6);

    // 5. If no similar in same location, try same category nationwide
    let similarProducts = similar || [];
    if (similarProducts.length < 3) {
        const { data: nationwideSimilar } = await supabase
            .from('products')
            .select('id, title, price, image, location')
            .eq('category', product.category)
            .eq('status', 'active')
            .neq('id', productId)
            .order('created_at', { ascending: false })
            .limit(6);

        similarProducts = nationwideSimilar || [];
    }

    return {
        found: true,
        originalProduct: {
            title: product.title,
            category: product.category,
            location: product.location,
            archivedReason: product.archive_reason,
            archivedAt: product.archived_at
        },
        similarProducts,
        redirectMessage: message
    };
}

/**
 * Generate sitemap excluding archived products
 * This helps Google know which pages to crawl
 */
export async function generateActiveSitemap(): Promise<string[]> {
    const { data: products } = await supabase
        .from('products')
        .select('id, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

    if (!products) return [];

    return products.map(p => `/product/${p.id}`);
}

/**
 * Notify search engines about page status changes
 * Uses HTTP 410 (Gone) or 301 (Redirect) headers
 */
export function getProductHttpStatus(productStatus: string): {
    statusCode: number;
    headers: Record<string, string>;
} {
    switch (productStatus) {
        case 'active':
            return {
                statusCode: 200,
                headers: {}
            };

        case 'sold':
        case 'archived':
            // 410 Gone - tells Google "this page is permanently gone, stop indexing"
            return {
                statusCode: 410,
                headers: {
                    'X-Robots-Tag': 'noindex'
                }
            };

        case 'expired':
            // 302 Found - temporary redirect to similar products
            return {
                statusCode: 302,
                headers: {
                    'X-Robots-Tag': 'noindex, nofollow'
                }
            };

        default:
            return {
                statusCode: 404,
                headers: {
                    'X-Robots-Tag': 'noindex'
                }
            };
    }
}

/**
 * Cleanup old archived products (after 90 days)
 * This is the final permanent deletion for GDPR compliance
 */
export async function purgeOldArchivedProducts(): Promise<number> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // First, get image keys to delete from R2
    const { data: oldProducts } = await supabase
        .from('products')
        .select('id, image, images')
        .eq('status', 'archived')
        .lte('archived_at', ninetyDaysAgo);

    if (!oldProducts || oldProducts.length === 0) {
        return 0;
    }

    // Permanently delete (GDPR Article 17)
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('status', 'archived')
        .lte('archived_at', ninetyDaysAgo);

    if (error) {
        return 0;
    }

    // Note: Images should be cleaned up by bucketCleaner.ts

    return oldProducts.length;
}
