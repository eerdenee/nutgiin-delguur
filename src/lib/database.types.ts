/**
 * Supabase Database Types
 * Таны database schema-д тохирсон types
 */

// =============================================
// DATABASE TYPES
// =============================================

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    phone: string;
                    name: string | null;
                    avatar_url: string | null;
                    role: 'buyer' | 'producer' | 'admin';
                    is_verified: boolean;
                    subscription_tier: 'start' | 'active' | 'business';
                    subscription_expires_at: string | null;
                    location: LocationJson | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
            };

            products: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    description: string | null;
                    price: number;
                    currency: string;
                    category: string;
                    subcategory: string | null;
                    images: string[];
                    videos: string[] | null;
                    location: LocationJson;
                    tier: 'soum' | 'aimag' | 'national';
                    status: 'active' | 'hidden' | 'deleted' | 'suspended' | 'expired';
                    views: number;
                    saves: number;
                    calls: number;
                    chats: number;
                    created_at: string;
                    updated_at: string;
                    expires_at: string;
                };
                Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at' | 'views' | 'saves' | 'calls' | 'chats'> & {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    views?: number;
                    saves?: number;
                    calls?: number;
                    chats?: number;
                };
                Update: Partial<Database['public']['Tables']['products']['Insert']>;
            };

            favorites: {
                Row: {
                    id: string;
                    user_id: string;
                    product_id: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['favorites']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['favorites']['Insert']>;
            };

            conversations: {
                Row: {
                    id: string;
                    product_id: string;
                    buyer_id: string;
                    seller_id: string;
                    last_message: string | null;
                    last_message_at: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
            };

            messages: {
                Row: {
                    id: string;
                    conversation_id: string;
                    sender_id: string;
                    content: string;
                    is_read: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at' | 'is_read'>;
                Update: Partial<Database['public']['Tables']['messages']['Insert']>;
            };

            orders: {
                Row: {
                    id: string;
                    product_id: string;
                    buyer_id: string;
                    seller_id: string;
                    quantity: number;
                    total_price: number;
                    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
                    shipping_address: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['orders']['Insert']>;
            };

            reports: {
                Row: {
                    id: string;
                    product_id: string;
                    reporter_id: string;
                    reason: 'foreign_product' | 'counterfeit' | 'scam' | 'inappropriate' | 'wrong_info' | 'spam' | 'other';
                    description: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['reports']['Insert']>;
            };

            reviews: {
                Row: {
                    id: string;
                    product_id: string;
                    user_id: string;
                    rating: number;
                    comment: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
            };
        };
    };
}

// =============================================
// HELPER TYPES
// =============================================

export interface LocationJson {
    aimag: string;
    soum: string;
    address?: string;
}

// Table types shortcuts
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];
