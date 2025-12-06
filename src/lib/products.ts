/**
 * Products Database Operations
 * Uses Supabase for backend storage
 */

import { supabase } from './supabase';

export interface ProductInput {
    title: string;
    description?: string;
    price: number;
    currency?: string;
    category: string;
    images: string[];
    videoLinks?: string[];
    location: {
        aimag: string;
        soum: string;
    };
    tier?: 'soum' | 'aimag' | 'national';
    bankInfo?: {
        bankName: string;
        accountNumber: string;
        iban?: string;
    };
}

export interface Product {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    price: number;
    currency: string;
    category: string;
    images: string[];
    video_links: string[];
    location: {
        aimag: string;
        soum: string;
    };
    tier: string;
    status: string;
    views: number;
    saves: number;
    call_clicks: number;
    chat_clicks: number;
    shares: number;
    created_at: string;
    updated_at: string;
    expires_at: string | null;
    // Joined data
    seller?: {
        id: string;
        name: string;
        phone: string;
        avatar_url: string;
        is_verified: boolean;
    };
}

/**
 * Create a new product
 */
export async function createProduct(input: ProductInput): Promise<{ data: Product | null; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Нэвтэрнэ үү' };
        }

        // Sanitize inputs
        const sanitizedTitle = input.title.replace(/<[^>]*>/g, '').trim().slice(0, 200);

        // ✅ Validate description length
        const MAX_DESCRIPTION_LENGTH = 5000;
        if (input.description && input.description.length > MAX_DESCRIPTION_LENGTH) {
            return {
                data: null,
                error: `Тайлбар хэт урт байна. Хамгийн ихдээ ${MAX_DESCRIPTION_LENGTH} тэмдэгт байх ёстой.`
            };
        }

        const sanitizedDescription = input.description?.replace(/<[^>]*>/g, '').trim().slice(0, MAX_DESCRIPTION_LENGTH);

        const insertData = {
            user_id: user.id,
            title: sanitizedTitle,
            description: sanitizedDescription || null,
            price: Math.max(0, Math.floor(input.price)), // Ensure positive integer
            category: input.category,
            images: input.images.slice(0, 10), // Max 10 images
            location: input.location,
            status: 'active',
        };

        const { data, error } = await (supabase
            .from('products') as any)
            .insert(insertData)
            .select()
            .single();

        if (error) {
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
                console.error('Create product error:', error.message);
            }
            return { data: null, error: error.message || 'Database error' };
        }

        return { data, error: null };
    } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Create product exception:', err);
        }
        return { data: null, error: err?.message || 'Алдаа гарлаа' };
    }
}

export async function getProducts(options?: {
    category?: string;
    aimag?: string;
    soum?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
}): Promise<{ data: Product[]; error: string | null }> {
    try {
        // ✅ OPTIMIZED: Use JOIN to fetch seller info in single query
        let query = (supabase
            .from('products') as any)
            .select(`
                *,
                seller:profiles!products_user_id_fkey (
                    id,
                    name,
                    phone,
                    avatar_url,
                    is_verified
                )
            `)
            .eq('status', 'active');

        // Category filter
        if (options?.category && options.category !== 'all') {
            query = query.eq('category', options.category);
        }

        // Location filter
        if (options?.aimag) {
            query = query.eq('location->>aimag', options.aimag);
        }
        if (options?.soum && options.soum !== 'all') {
            query = query.eq('location->>soum', options.soum);
        }

        // Search
        if (options?.search) {
            query = query.textSearch('search_vector', options.search);
        }

        // Sorting
        switch (options?.sortBy) {
            case 'price_asc':
                query = query.order('price', { ascending: true });
                break;
            case 'price_desc':
                query = query.order('price', { ascending: false });
                break;
            case 'popular':
                query = query.order('views', { ascending: false });
                break;
            default:
                query = query.order('created_at', { ascending: false });
        }

        // Pagination
        if (options?.limit) {
            query = query.limit(options.limit);
        }
        if (options?.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
        }

        const { data, error } = await query;

        if (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('[getProducts] Database error:', error);
            }
            return { data: [], error: error.message };
        }

        // Data already includes seller info from JOIN
        return { data: data || [], error: null };
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[getProducts] Exception:', err);
        }
        return { data: [], error: 'Бараа ачаалахад алдаа гарлаа. Дахин оролдоно уу.' };
    }
}

/**
 * Get single product by ID
 */
export async function getProduct(id: string): Promise<{ data: Product | null; error: string | null }> {
    try {
        const { data, error } = await (supabase
            .from('products') as any)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (err) {
        return { data: null, error: 'Алдаа гарлаа' };
    }
}

/**
 * Get user's own products
 */
export async function getMyProducts(): Promise<{ data: Product[]; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: [], error: 'Нэвтэрнэ үү' };
        }

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return { data: [], error: error.message };
        }

        return { data: data || [], error: null };
    } catch (err) {
        return { data: [], error: 'Алдаа гарлаа' };
    }
}

// Alias for backward compatibility
export const getUserProducts = getMyProducts;

/**
 * Update product
 */
export async function updateProduct(
    id: string,
    updates: Partial<ProductInput>
): Promise<{ success: boolean; error: string | null }> {
    try {
        const { error } = await (supabase
            .from('products') as any)
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err) {
        return { success: false, error: 'Алдаа гарлаа' };
    }
}

/**
 * Delete product (soft delete)
 */
export async function deleteProduct(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const { error } = await (supabase
            .from('products') as any)
            .update({ status: 'deleted' })
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err) {
        return { success: false, error: 'Алдаа гарлаа' };
    }
}

/**
 * Toggle favorite
 */
export async function toggleFavorite(productId: string): Promise<{ isFavorite: boolean; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { isFavorite: false, error: 'Нэвтэрнэ үү' };
        }

        // Check if already favorited
        const { data: existing } = await (supabase
            .from('favorites') as any)
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();

        if (existing) {
            // Remove favorite
            await (supabase
                .from('favorites') as any)
                .delete()
                .eq('id', existing.id);

            // Decrement saves count
            await (supabase
                .from('products') as any)
                .update({ saves: (supabase as any).rpc('decrement', { x: 1 }) })
                .eq('id', productId);

            return { isFavorite: false, error: null };
        } else {
            // Add favorite
            await (supabase
                .from('favorites') as any)
                .insert({ user_id: user.id, product_id: productId });

            // Increment saves count
            await (supabase
                .from('products') as any)
                .update({ saves: (supabase as any).rpc('increment', { x: 1 }) })
                .eq('id', productId);

            return { isFavorite: true, error: null };
        }
    } catch (err) {
        return { isFavorite: false, error: 'Алдаа гарлаа' };
    }
}

/**
 * Get user's favorites
 */
export async function getFavorites(): Promise<{ data: Product[]; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: [], error: 'Нэвтэрнэ үү' };
        }

        const { data, error } = await (supabase
            .from('favorites') as any)
            .select(`
        product:products (
          *,
          seller:profiles!products_user_id_fkey (
            id,
            name,
            avatar_url,
            is_verified
          )
        )
      `)
            .eq('user_id', user.id);

        if (error) {
            return { data: [], error: error.message };
        }

        const products = data?.map((f: any) => f.product).filter(Boolean) as Product[];
        return { data: products, error: null };
    } catch (err) {
        return { data: [], error: 'Алдаа гарлаа' };
    }
}

/**
 * Track engagement
 */
export async function trackEngagement(
    productId: string,
    type: 'call_click' | 'chat_click' | 'share'
): Promise<void> {
    try {
        const column = type === 'call_click' ? 'call_clicks'
            : type === 'chat_click' ? 'chat_clicks'
                : 'shares';

        await (supabase.rpc as any)('increment_column', {
            table_name: 'products',
            column_name: column,
            row_id: productId
        });
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Track engagement error:', err);
        }
    }
}

// Alias for backward compatibility
export const getUserFavorites = getFavorites;

