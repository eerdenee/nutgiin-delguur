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

        console.log('Creating product for user:', user.id);
        console.log('Product input:', input);

        const insertData = {
            user_id: user.id,
            title: input.title,
            description: input.description || null,
            price: input.price,
            category: input.category,
            images: input.images,
            location: input.location,
            status: 'active',
        };

        console.log('Insert data:', insertData);

        const { data, error } = await (supabase
            .from('products') as any)
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('Create product error:', JSON.stringify(error, null, 2));
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error details:', error.details);
            console.error('Error hint:', error.hint);
            return { data: null, error: error.message || 'Database error' };
        }

        console.log('Product created successfully:', data);
        return { data, error: null };
    } catch (err: any) {
        console.error('Create product exception:', err);
        return { data: null, error: err?.message || 'Алдаа гарлаа' };
    }
}

/**
 * Get products with filters
 */
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
        let query = (supabase
            .from('products') as any)
            .select('*')
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
            console.error('Get products error:', error);
            return { data: [], error: error.message };
        }

        // Fetch seller info for each product
        if (data && data.length > 0) {
            const userIds = [...new Set(data.map((p: any) => p.user_id))];
            const { data: profiles } = await (supabase
                .from('profiles') as any)
                .select('id, name, phone, avatar_url, is_verified')
                .in('id', userIds);

            const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

            const productsWithSeller = data.map((p: any) => ({
                ...p,
                seller: profileMap.get(p.user_id) || null
            }));

            return { data: productsWithSeller, error: null };
        }

        return { data: data || [], error: null };
    } catch (err) {
        console.error('Get products exception:', err);
        return { data: [], error: 'Алдаа гарлаа' };
    }
}

/**
 * Get single product by ID
 */
export async function getProduct(id: string): Promise<{ data: Product | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        seller:profiles!products_user_id_fkey (
          id,
          name,
          phone,
          avatar_url,
          is_verified,
          bank_info
        )
      `)
            .eq('id', id)
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        // Increment view count
        await supabase.rpc('increment_product_views', { product_uuid: id });

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

/**
 * Update product
 */
export async function updateProduct(
    id: string,
    updates: Partial<ProductInput>
): Promise<{ success: boolean; error: string | null }> {
    try {
        const { error } = await supabase
            .from('products')
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
        const { error } = await supabase
            .from('products')
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
        const { data: existing } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();

        if (existing) {
            // Remove favorite
            await supabase
                .from('favorites')
                .delete()
                .eq('id', existing.id);

            // Decrement saves count
            await supabase
                .from('products')
                .update({ saves: supabase.rpc('decrement', { x: 1 }) })
                .eq('id', productId);

            return { isFavorite: false, error: null };
        } else {
            // Add favorite
            await supabase
                .from('favorites')
                .insert({ user_id: user.id, product_id: productId });

            // Increment saves count
            await supabase
                .from('products')
                .update({ saves: supabase.rpc('increment', { x: 1 }) })
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

        const { data, error } = await supabase
            .from('favorites')
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

        const products = data?.map(f => f.product).filter(Boolean) as Product[];
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

        await supabase.rpc('increment_column', {
            table_name: 'products',
            column_name: column,
            row_id: productId
        });
    } catch (err) {
        console.error('Track engagement error:', err);
    }
}
