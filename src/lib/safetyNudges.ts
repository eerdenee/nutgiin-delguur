/**
 * SUBCONSCIOUS NUDGING - Friction for Safety
 * 
 * Problem: When users rush or get greedy (cheap price), their brain turns off.
 *          That's when they get scammed.
 * Solution: Add deliberate friction to snap them back to reality.
 */

// Warning messages for different actions
export const SAFETY_NUDGES = {
    copyBankAccount: {
        title: '🛑 Түр хүлээ!',
        messages: [
            'Та бараагаа биечлэн шалгаж үзсэн үү?',
            'Урьдчилж мөнгө шилжүүлэх нь эрсдэлтэй!',
            'Луйвард өртсөн мөнгийг буцааж чадахгүй.'
        ],
        confirmText: 'Би ойлголоо, Хуулъя',
        cancelText: 'Болих'
    },

    makePayment: {
        title: '⚠️ Мөнгө шилжүүлэхийн өмнө',
        messages: [
            'Боломжтой бол биечлэн уулзаж төлөөрэй.',
            'Нэр таньж мэддэг хүндээ шилжүүлээрэй.',
            'Хэт хямд үнэ = Луйврын шинж тэмдэг.'
        ],
        confirmText: 'Ойлголоо',
        cancelText: 'Буцах'
    },

    contactSeller: {
        title: '📞 Холбоо барихын өмнө',
        messages: [
            'Өөрийн мэдээллийг хэт их өгөхгүй байна уу.',
            'Сэжигтэй санагдвал залгахаа болино уу.',
            'Энэ зар нь verified borluulagch биш.'
        ],
        confirmText: 'Ойлголоо',
        cancelText: 'Буцах',
        showForUnverified: true
    },

    suspiciouslyLowPrice: {
        title: '🚨 Үнэ хэт бага байна!',
        messages: [
            'Энэ үнэ бодит биш байж магадгүй.',
            'Луйварчид хямд үнээр хүнийг өөрийгөө татдаг.',
            'Маш болгоомжтой байна уу!'
        ],
        confirmText: 'Ойлголоо, үргэлжлүүлнэ',
        cancelText: 'Буцах'
    }
};

/**
 * Check if price is suspiciously low for category
 */
export function isPriceSuspiciouslyLow(
    price: number,
    category: string
): boolean {
    const suspiciousThresholds: Record<string, number> = {
        'electronics': 50000,    // Phone under 50k is suspicious
        'vehicles': 500000,      // Vehicle under 500k is suspicious
        'clothing': 5000,        // Under 5k for clothing is fine
        'livestock': 100000,     // Livestock under 100k
        'default': 10000
    };

    const threshold = suspiciousThresholds[category] || suspiciousThresholds['default'];
    return price < threshold;
}

/**
 * Get appropriate nudge for context
 */
export function getNudgeForAction(
    action: 'copyBankAccount' | 'makePayment' | 'contactSeller' | 'suspiciouslyLowPrice',
    context?: {
        isSellerVerified?: boolean;
        price?: number;
        category?: string;
    }
): typeof SAFETY_NUDGES[keyof typeof SAFETY_NUDGES] | null {
    // Skip nudge for verified sellers on contact action
    if (action === 'contactSeller' && context?.isSellerVerified) {
        return null;
    }

    // Add suspicious price nudge if applicable
    if (context?.price && context?.category) {
        if (isPriceSuspiciouslyLow(context.price, context.category)) {
            return SAFETY_NUDGES.suspiciouslyLowPrice;
        }
    }

    return SAFETY_NUDGES[action];
}

/**
 * React component props for NudgeModal
 */
export interface NudgeModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    messages: string[];
    confirmText: string;
    cancelText: string;
}

/**
 * Log that user saw and acknowledged warning
 * For legal protection: "We warned them"
 */
export async function logNudgeAcknowledgment(
    userId: string | null,
    action: string,
    productId?: string,
    sellerId?: string
): Promise<void> {
    // This could be stored in interaction_logs
    // For now, just a placeholder for the concept
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        // Could send to analytics
        console.log('Nudge acknowledged:', { userId, action, productId });
    }
}

// ============================================
// SCAM DETECTION SIGNALS
// ============================================

/**
 * Calculate scam risk score based on signals
 */
export function calculateScamRiskScore(product: {
    price: number;
    category: string;
    description: string;
    images: string[];
    seller: {
        isVerified: boolean;
        totalSales: number;
        averageRating: number;
        accountAge: number; // days
    };
}): {
    score: number; // 0-100 (higher = more risky)
    factors: string[];
    recommendation: 'safe' | 'caution' | 'warning' | 'danger';
} {
    let score = 0;
    const factors: string[] = [];

    // Price signals
    if (isPriceSuspiciouslyLow(product.price, product.category)) {
        score += 25;
        factors.push('Үнэ хэт бага');
    }

    // Seller signals
    if (!product.seller.isVerified) {
        score += 15;
        factors.push('Баталгаажаагүй борлуулагч');
    }

    if (product.seller.accountAge < 7) {
        score += 20;
        factors.push('Шинэ бүртгэл (7 хоногоос бага)');
    }

    if (product.seller.totalSales === 0) {
        score += 10;
        factors.push('Өмнө худалдаа хийгээгүй');
    }

    if (product.seller.averageRating < 3 && product.seller.totalSales > 0) {
        score += 15;
        factors.push('Үнэлгээ муу');
    }

    // Content signals
    if (product.images.length === 0) {
        score += 15;
        factors.push('Зураг байхгүй');
    }

    if (product.description.length < 50) {
        score += 10;
        factors.push('Тайлбар маш богино');
    }

    // Common scam keywords
    const scamKeywords = ['яаралтай', 'urgent', 'хямд', 'cheap', 'last chance', 'сүүлийн боломж'];
    const hasScamWords = scamKeywords.some(kw =>
        product.description.toLowerCase().includes(kw)
    );
    if (hasScamWords) {
        score += 10;
        factors.push('Яаралтай/Хямд гэсэн үг ашигласан');
    }

    // Cap score
    score = Math.min(100, score);

    // Recommendation
    let recommendation: 'safe' | 'caution' | 'warning' | 'danger' = 'safe';
    if (score >= 60) recommendation = 'danger';
    else if (score >= 40) recommendation = 'warning';
    else if (score >= 20) recommendation = 'caution';

    return { score, factors, recommendation };
}

/**
 * Get warning color for UI
 */
export function getWarningColor(recommendation: 'safe' | 'caution' | 'warning' | 'danger'): string {
    switch (recommendation) {
        case 'safe': return '#22c55e';      // green
        case 'caution': return '#eab308';   // yellow
        case 'warning': return '#f97316';   // orange
        case 'danger': return '#ef4444';    // red
    }
}
