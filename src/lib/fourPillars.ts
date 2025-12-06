/**
 * THE FOUR PILLARS OF TRUST
 * 
 * 1. Entry Barrier - Phone verification required
 * 2. Content Guard - Blacklist + 3-strike auto-hide
 * 3. Financial Hygiene - No payment, price caps
 * 4. Legal Disclaimer - User acceptance checkbox
 */

import { supabase } from './supabase';
import { containsBlacklistedKeywords, validateContent } from './blacklist';

// ============================================
// PILLAR 1: ENTRY BARRIER (Phone Verification)
// ============================================

const MONGOLIA_PHONE_REGEX = /^(\+976)?[89]\d{7}$/;

/**
 * Validate Mongolian phone number
 */
export function isValidMongolianPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s\-]/g, '');
    return MONGOLIA_PHONE_REGEX.test(cleaned);
}

/**
 * Check if user has verified phone before allowing post
 */
export async function canUserPost(userId: string): Promise<{
    canPost: boolean;
    reason?: string;
    requiresAction?: 'verify_phone' | 'accept_terms' | 'banned';
}> {
    const { data: profile } = await supabase
        .from('profiles')
        .select('phone, phone_verified, terms_accepted, is_banned')
        .eq('id', userId)
        .single();

    if (!profile) {
        return { canPost: false, reason: 'Профайл олдсонгүй', requiresAction: 'verify_phone' };
    }

    if (profile.is_banned) {
        return { canPost: false, reason: 'Таны эрх хаагдсан байна', requiresAction: 'banned' };
    }

    if (!profile.phone || !profile.phone_verified) {
        return {
            canPost: false,
            reason: 'Зар оруулахын тулд утасны дугаараа баталгаажуулна уу',
            requiresAction: 'verify_phone'
        };
    }

    if (!profile.terms_accepted) {
        return {
            canPost: false,
            reason: 'Үйлчилгээний нөхцөлийг зөвшөөрнө үү',
            requiresAction: 'accept_terms'
        };
    }

    return { canPost: true };
}

/**
 * Send SMS verification code (integration with SMS provider)
 */
export async function sendPhoneVerificationCode(
    userId: string,
    phone: string
): Promise<{ success: boolean; message: string }> {
    if (!isValidMongolianPhone(phone)) {
        return { success: false, message: 'Монгол утасны дугаар оруулна уу (+976)' };
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code in database
    await supabase.from('phone_verifications').upsert({
        user_id: userId,
        phone: phone,
        code: code,
        expires_at: expiresAt.toISOString(),
        attempts: 0
    });

    // TODO: Integrate with SMS provider (Message Pro, etc.)
    // await smsProvider.send(phone, `Таны баталгаажуулах код: ${code}`);

    if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Verification code for ${phone}: ${code}`);
    }

    return {
        success: true,
        message: 'Баталгаажуулах код илгээгдлээ'
    };
}

/**
 * Verify phone with code
 */
export async function verifyPhoneCode(
    userId: string,
    code: string
): Promise<{ success: boolean; message: string }> {
    const { data: verification } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (!verification) {
        return { success: false, message: 'Баталгаажуулах хүсэлт олдсонгүй' };
    }

    if (new Date(verification.expires_at) < new Date()) {
        return { success: false, message: 'Код хугацаа нь дууссан. Дахин илгээнэ үү.' };
    }

    if (verification.attempts >= 5) {
        return { success: false, message: 'Хэт олон удаа оролдсон. 30 минутын дараа дахин оролдоно уу.' };
    }

    if (verification.code !== code) {
        // Increment attempts
        await supabase
            .from('phone_verifications')
            .update({ attempts: verification.attempts + 1 })
            .eq('user_id', userId);

        return { success: false, message: 'Буруу код' };
    }

    // Mark phone as verified
    await supabase
        .from('profiles')
        .update({
            phone: verification.phone,
            phone_verified: true,
            phone_verified_at: new Date().toISOString()
        })
        .eq('id', userId);

    // Clean up
    await supabase
        .from('phone_verifications')
        .delete()
        .eq('user_id', userId);

    return { success: true, message: 'Утас амжилттай баталгаажлаа!' };
}

// ============================================
// PILLAR 2: CONTENT GUARD (Auto-hide after 3 reports)
// ============================================

const AUTO_HIDE_THRESHOLD = 3;

/**
 * Process a report and auto-hide if threshold reached
 */
export async function processReport(
    productId: string,
    reporterId: string,
    reason: string,
    description?: string
): Promise<{ success: boolean; message: string; autoHidden?: boolean }> {
    // Check if already reported by this user
    const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq('product_id', productId)
        .eq('reporter_id', reporterId)
        .single();

    if (existingReport) {
        return { success: false, message: 'Та энэ зарыг аль хэдийн мэдэгдсэн байна' };
    }

    // Create report
    await supabase.from('reports').insert({
        product_id: productId,
        reporter_id: reporterId,
        reason,
        description,
        status: 'pending'
    });

    // Count total reports
    const { count } = await supabase
        .from('reports')
        .select('*', { count: 'exact' })
        .eq('product_id', productId);

    // Auto-hide if threshold reached
    if ((count || 0) >= AUTO_HIDE_THRESHOLD) {
        await supabase
            .from('products')
            .update({
                status: 'hidden',
                hidden_reason: 'auto_reported',
                hidden_at: new Date().toISOString()
            })
            .eq('id', productId);

        // Notify admin
        await supabase.from('admin_alerts').insert({
            type: 'AUTO_HIDDEN',
            product_id: productId,
            reason: `${count} хүн мэдэгдсэн тул автоматаар нуугдлаа`,
            severity: 'high'
        });

        return {
            success: true,
            message: 'Мэдэгдэл амжилттай. Зар шалгагдана.',
            autoHidden: true
        };
    }

    return { success: true, message: 'Мэдэгдэл амжилттай илгээгдлээ' };
}

// ============================================
// PILLAR 3: FINANCIAL HYGIENE (Price Caps)
// ============================================

// Max prices by category (in MNT)
const CATEGORY_PRICE_CAPS: Record<string, number> = {
    'clothing': 5000000,      // 5 сая
    'electronics': 20000000,  // 20 сая
    'vehicles': 500000000,    // 500 сая
    'property': 5000000000,   // 5 тэрбум
    'food': 500000,           // 500 мянга
    'handicraft': 10000000,   // 10 сая
    'livestock': 50000000,    // 50 сая
    'other': 10000000         // 10 сая (default)
};

/**
 * Validate price is within reasonable limits
 */
export function validatePrice(
    price: number,
    category: string
): { valid: boolean; message?: string; maxPrice?: number } {
    if (price <= 0) {
        return { valid: false, message: 'Үнэ 0-ээс их байх ёстой' };
    }

    const maxPrice = CATEGORY_PRICE_CAPS[category] || CATEGORY_PRICE_CAPS['other'];

    if (price > maxPrice) {
        return {
            valid: false,
            message: `Энэ ангилалд дээд үнэ ${formatPrice(maxPrice)} байна`,
            maxPrice
        };
    }

    // Suspicious low price warning (might be scam)
    if (price < 1000) {
        return {
            valid: true, // Allow but warn
            message: 'Анхааруулга: Үнэ хэт бага байна. Зөв оруулсан эсэхээ шалгана уу.'
        };
    }

    return { valid: true };
}

/**
 * Format price for display
 */
function formatPrice(price: number): string {
    if (price >= 1000000000) return `${price / 1000000000} тэрбум`;
    if (price >= 1000000) return `${price / 1000000} сая`;
    if (price >= 1000) return `${price / 1000} мянга`;
    return `${price}₮`;
}

// ============================================
// PILLAR 4: LEGAL DISCLAIMER
// ============================================

export const LEGAL_DISCLAIMER_TEXT = `
Би оруулж буй зар, барааны чанар, гарал үүсэлд ӨӨРӨӨ БҮРЭН ХАРИУЦЛАГА хүлээнэ.
Нутгийн Дэлгүүр платформ нь зөвхөн мэдээлэл түгээх үүрэгтэй бөгөөд 
худалдагч, худалдан авагчийн хоорондын гүйлгээнд хариуцлага хүлээхгүй болохыг 
хүлээн зөвшөөрч байна.
`.trim();

/**
 * Record user's acceptance of terms
 */
export async function acceptTerms(userId: string): Promise<{ success: boolean }> {
    const { error } = await supabase
        .from('profiles')
        .update({
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString()
        })
        .eq('id', userId);

    return { success: !error };
}

// ============================================
// COMBINED VALIDATION (All Pillars)
// ============================================

export async function validateProductSubmission(
    userId: string,
    product: {
        title: string;
        description: string;
        price: number;
        category: string;
    }
): Promise<{
    valid: boolean;
    errors: string[];
    requiresAction?: 'verify_phone' | 'accept_terms';
}> {
    const errors: string[] = [];

    // Pillar 1: Check user can post
    const canPost = await canUserPost(userId);
    if (!canPost.canPost) {
        return {
            valid: false,
            errors: [canPost.reason || 'Зар оруулах эрхгүй'],
            requiresAction: canPost.requiresAction as any
        };
    }

    // Pillar 2: Check content
    const contentCheck = validateContent(product.title, product.description);
    if (!contentCheck.isValid) {
        errors.push(`Хориотой үг агуулсан байна: ${contentCheck.foundWords.join(', ')}`);
    }

    // Pillar 3: Check price
    const priceCheck = validatePrice(product.price, product.category);
    if (!priceCheck.valid) {
        errors.push(priceCheck.message || 'Үнэ буруу байна');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
