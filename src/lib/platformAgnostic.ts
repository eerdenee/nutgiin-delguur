/**
 * PLATFORM AGNOSTICISM - Headless Content Strategy
 * 
 * Problem: Tomorrow people might only use Telegram or TikTok.
 *          If tied to "website", business dies.
 * Solution: Your VALUE is the DATABASE, not the website.
 *           Export to any platform: Telegram Bot, SMS, API.
 */

import { supabase } from './supabase';

// ============================================
// MULTI-CHANNEL EXPORT
// ============================================

interface ExportFormat {
    format: 'json' | 'csv' | 'telegram' | 'sms';
    data: any;
}

/**
 * Export products for any platform
 */
export async function exportProducts(
    filters: {
        aimag?: string;
        soum?: string;
        category?: string;
        limit?: number;
    },
    format: 'json' | 'csv' | 'telegram' | 'sms' = 'json'
): Promise<ExportFormat> {
    let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (filters.aimag) query = query.eq('location_aimag', filters.aimag);
    if (filters.soum) query = query.eq('location_soum', filters.soum);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.limit) query = query.limit(filters.limit);

    const { data } = await query;

    switch (format) {
        case 'telegram':
            return {
                format: 'telegram',
                data: (data || []).map(p => formatForTelegram(p))
            };
        case 'sms':
            return {
                format: 'sms',
                data: (data || []).map(p => formatForSMS(p))
            };
        case 'csv':
            return {
                format: 'csv',
                data: convertToCSV(data || [])
            };
        default:
            return { format: 'json', data };
    }
}

/**
 * Format product for Telegram Bot
 */
function formatForTelegram(product: any): string {
    const price = formatPrice(product.price);
    const location = product.location_soum
        ? `${product.location_aimag}, ${product.location_soum}`
        : product.location_aimag;

    return `
📦 *${escapeMarkdown(product.title)}*

💰 ${price}
📍 ${location}
📞 ${product.seller_phone || 'Холбоо барих'}

${escapeMarkdown(product.description?.slice(0, 200) || '')}

🔗 [Дэлгэрэнгүй](https://nutgiindelguur.mn/product/${product.id})
`.trim();
}

/**
 * Format product for SMS (160 char limit)
 */
function formatForSMS(product: any): string {
    const price = formatPrice(product.price);
    const title = product.title?.slice(0, 30) || 'Зар';

    return `${title} - ${price}. Утас: ${product.seller_phone || 'N/A'}`.slice(0, 160);
}

/**
 * Convert to CSV format
 */
function convertToCSV(products: any[]): string {
    if (products.length === 0) return '';

    const headers = ['id', 'title', 'price', 'category', 'aimag', 'soum', 'phone', 'created_at'];
    const rows = products.map(p => [
        p.id,
        `"${(p.title || '').replace(/"/g, '""')}"`,
        p.price,
        p.category,
        p.location_aimag,
        p.location_soum,
        p.seller_phone,
        p.created_at
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
}

/**
 * Escape Telegram Markdown characters
 */
function escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

function formatPrice(price: number): string {
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)} сая ₮`;
    return `${price.toLocaleString('mn-MN')}₮`;
}

// ============================================
// TELEGRAM BOT WEBHOOK HANDLER
// ============================================

interface TelegramUpdate {
    message?: {
        chat: { id: number };
        text?: string;
        from?: { id: number; first_name: string };
    };
}

/**
 * Handle Telegram bot webhook
 * Commands: /start, /search <query>, /soum <name>, /help
 */
export async function handleTelegramWebhook(update: TelegramUpdate): Promise<{
    chat_id: number;
    text: string;
    parse_mode?: string;
}> {
    if (!update.message?.text) {
        return { chat_id: 0, text: '' };
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();

    // /start command
    if (text === '/start') {
        return {
            chat_id: chatId,
            text: `🏡 *Нутгийн Дэлгүүр Bot*-д тавтай морил!

Командууд:
/search <хайлт> - Зар хайх
/soum <сумын нэр> - Сумын зар харах
/new - Шинэ зарууд
/help - Тусламж

Жишээ: /search Айраг`,
            parse_mode: 'Markdown'
        };
    }

    // /search command
    if (text.startsWith('/search ')) {
        const query = text.replace('/search ', '').trim();
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active')
            .ilike('title', `%${query}%`)
            .limit(5);

        if (!data || data.length === 0) {
            return {
                chat_id: chatId,
                text: `"${query}" хайлтаар зар олдсонгүй.`
            };
        }

        const results = data.map(p => formatForTelegram(p)).join('\n\n---\n\n');
        return {
            chat_id: chatId,
            text: `🔍 *"${query}" хайлтын үр дүн:*\n\n${results}`,
            parse_mode: 'Markdown'
        };
    }

    // /soum command
    if (text.startsWith('/soum ')) {
        const soum = text.replace('/soum ', '').trim();
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active')
            .ilike('location_soum', `%${soum}%`)
            .limit(5);

        if (!data || data.length === 0) {
            return {
                chat_id: chatId,
                text: `${soum} сумд зар олдсонгүй.`
            };
        }

        const results = data.map(p => formatForTelegram(p)).join('\n\n---\n\n');
        return {
            chat_id: chatId,
            text: `📍 *${soum} сумын зарууд:*\n\n${results}`,
            parse_mode: 'Markdown'
        };
    }

    // /new command
    if (text === '/new') {
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(5);

        if (!data || data.length === 0) {
            return { chat_id: chatId, text: 'Шинэ зар байхгүй байна.' };
        }

        const results = data.map(p => formatForTelegram(p)).join('\n\n---\n\n');
        return {
            chat_id: chatId,
            text: `🆕 *Шинэ зарууд:*\n\n${results}`,
            parse_mode: 'Markdown'
        };
    }

    // /help command
    if (text === '/help') {
        return {
            chat_id: chatId,
            text: `📖 *Тусламж*

/search <хайлт> - Зар хайх
/soum <сумын нэр> - Сумын зар
/new - Шинэ зарууд

🌐 Вэб: nutgiindelguur.mn`,
            parse_mode: 'Markdown'
        };
    }

    // Unknown command
    return {
        chat_id: chatId,
        text: 'Тушаал ойлгосонгүй. /help гэж бичээрэй.'
    };
}

// ============================================
// SMS GATEWAY INTERFACE
// ============================================

interface SMSRequest {
    phone: string;
    type: 'new_listing_notification' | 'price_drop' | 'listing_expiring';
    data: any;
}

/**
 * Generate SMS message for different scenarios
 */
export function generateSMSMessage(request: SMSRequest): string {
    switch (request.type) {
        case 'new_listing_notification':
            return `Шинэ зар: ${request.data.title?.slice(0, 20)} - ${formatPrice(request.data.price)}. nutgiindelguur.mn`;

        case 'price_drop':
            return `Үнэ буурлаа! ${request.data.title?.slice(0, 15)}: ${formatPrice(request.data.oldPrice)} → ${formatPrice(request.data.newPrice)}`;

        case 'listing_expiring':
            return `Таны "${request.data.title?.slice(0, 15)}" зарын хугацаа дуусах гэж байна. nutgiindelguur.mn`;

        default:
            return 'Нутгийн Дэлгүүр - nutgiindelguur.mn';
    }
}

// ============================================
// API KEY MANAGEMENT
// ============================================

/**
 * Generate API key for external integrations
 */
export async function generateApiKey(
    userId: string,
    name: string,
    permissions: string[]
): Promise<{ key: string; expiresAt: string }> {
    const key = `nd_${generateRandomString(32)}`;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year validity

    await supabase.from('api_keys').insert({
        user_id: userId,
        key_hash: hashString(key), // Store hash, not key
        name,
        permissions,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
    });

    return { key, expiresAt: expiresAt.toISOString() };
}

function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
