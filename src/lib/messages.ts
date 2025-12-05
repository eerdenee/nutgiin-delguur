/**
 * Messages Library - Supabase Realtime Chat
 */

import { supabase } from './supabase';

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    product_id: string | null;
    content: string;
    is_read: boolean;
    created_at: string;
    sender?: {
        id: string;
        name: string;
        avatar_url: string;
    };
}

export interface Conversation {
    id: string;
    participant_id: string;
    participant_name: string;
    participant_avatar: string;
    product_id: string | null;
    product_title: string | null;
    product_image: string | null;
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

/**
 * Get all conversations for current user
 */
export async function getConversations(): Promise<{ data: Conversation[]; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: [], error: 'Нэвтэрнэ үү' };
        }

        // Get messages where user is sender or receiver
        const { data: messages, error } = await (supabase
            .from('messages') as any)
            .select(`
                id,
                sender_id,
                receiver_id,
                product_id,
                content,
                is_read,
                created_at,
                product:products (
                    id,
                    title,
                    images
                )
            `)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

        if (error) {
            return { data: [], error: error.message };
        }

        // Group messages into conversations
        const conversationMap = new Map<string, Conversation>();

        for (const msg of messages || []) {
            const participantId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            const key = `${participantId}_${msg.product_id || 'general'}`;

            if (!conversationMap.has(key)) {
                // Get participant info
                const { data: participant } = await (supabase
                    .from('profiles') as any)
                    .select('id, name, avatar_url')
                    .eq('id', participantId)
                    .single();

                conversationMap.set(key, {
                    id: key,
                    participant_id: participantId,
                    participant_name: participant?.name || 'Хэрэглэгч',
                    participant_avatar: participant?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participantId}`,
                    product_id: msg.product_id,
                    product_title: msg.product?.title || null,
                    product_image: msg.product?.images?.[0] || null,
                    last_message: msg.content,
                    last_message_at: msg.created_at,
                    unread_count: msg.is_read || msg.sender_id === user.id ? 0 : 1,
                });
            } else {
                // Update unread count
                const conv = conversationMap.get(key)!;
                if (!msg.is_read && msg.sender_id !== user.id) {
                    conv.unread_count++;
                }
            }
        }

        const conversations = Array.from(conversationMap.values())
            .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

        return { data: conversations, error: null };
    } catch (err) {
        return { data: [], error: 'Алдаа гарлаа' };
    }
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
    participantId: string,
    productId?: string
): Promise<{ data: Message[]; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: [], error: 'Нэвтэрнэ үү' };
        }

        let query = (supabase
            .from('messages') as any)
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey (
                    id,
                    name,
                    avatar_url
                )
            `)
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`);

        if (productId) {
            query = query.eq('product_id', productId);
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) {
            return { data: [], error: error.message };
        }

        // Mark messages as read
        await (supabase
            .from('messages') as any)
            .update({ is_read: true })
            .eq('receiver_id', user.id)
            .eq('sender_id', participantId);

        return { data: data || [], error: null };
    } catch (err) {
        return { data: [], error: 'Алдаа гарлаа' };
    }
}

/**
 * Send a message
 */
export async function sendMessage(
    receiverId: string,
    content: string,
    productId?: string
): Promise<{ data: Message | null; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Нэвтэрнэ үү' };
        }

        if (!content.trim()) {
            return { data: null, error: 'Мессеж хоосон байна' };
        }

        const { data, error } = await (supabase
            .from('messages') as any)
            .insert({
                sender_id: user.id,
                receiver_id: receiverId,
                product_id: productId || null,
                content: content.trim(),
            })
            .select()
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
 * Get unread message count
 */
export async function getUnreadCount(): Promise<number> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return 0;

        const { count } = await (supabase
            .from('messages') as any)
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('is_read', false);

        return count || 0;
    } catch {
        return 0;
    }
}

/**
 * Subscribe to new messages (Realtime)
 */
export function subscribeToMessages(
    userId: string,
    callback: (message: Message) => void
) {
    const channel = supabase
        .channel('messages')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${userId}`,
            },
            (payload) => {
                callback(payload.new as Message);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
