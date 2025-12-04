/**
 * Content Moderation System
 * Контент модерацийн систем
 */

import { STORAGE_KEYS, EVENTS, MS_PER_DAY, APPEAL_DEADLINE_DAYS, REPORT_THRESHOLD_HIDE, REPORT_THRESHOLD_DELETE } from './constants';

// Зөрчлийн төрлүүд
export type ViolationType =
    | 'foreign_product'      // Гадаадын бараа
    | 'counterfeit'          // Хуурамч бараа
    | 'illegal_content'      // Хууль бус контент
    | 'spam'                 // Спам
    | 'scam'                 // Залилан
    | 'wrong_category'       // Буруу категори
    | 'low_quality'          // Чанар муу
    | 'duplicate'            // Давхардсан
    | 'other';               // Бусад

// Зөрчлийн ноцтой байдал
export type ViolationSeverity = 'critical' | 'major' | 'minor';

// Шийдвэрийн төрөл
export type ModerationAction =
    | 'delete'               // Устгах
    | 'suspend'              // Түр хаах
    | 'warn'                 // Анхааруулах
    | 'request_edit'         // Засах хүсэлт
    | 'approve';             // Зөвшөөрөх

// Буцаалтын төрөл
export type RefundType =
    | 'none'                 // Буцаалт байхгүй
    | 'full'                 // Бүрэн буцаалт
    | 'partial'              // Хэсэгчилсэн
    | 'credit';              // Кредит (дараагийн сард)

// Зөрчлийн тодорхойлолт
export interface ViolationRule {
    type: ViolationType;
    severity: ViolationSeverity;
    action: ModerationAction;
    refund: RefundType;
    refundPercent?: number;
    appealAllowed: boolean;
    description: string;
    descriptionMn: string;
}

// Зөрчлийн дүрмүүд
export const VIOLATION_RULES: Record<ViolationType, ViolationRule> = {
    foreign_product: {
        type: 'foreign_product',
        severity: 'critical',
        action: 'delete',
        refund: 'none',
        appealAllowed: true,
        description: 'Foreign manufactured products are not allowed',
        descriptionMn: 'Гадаадын үйлдвэрийн бүтээгдэхүүн оруулах хориотой'
    },
    counterfeit: {
        type: 'counterfeit',
        severity: 'critical',
        action: 'delete',
        refund: 'none',
        appealAllowed: false,
        description: 'Counterfeit/fake products are strictly prohibited',
        descriptionMn: 'Хуурамч бараа оруулах хатуу хориотой'
    },
    illegal_content: {
        type: 'illegal_content',
        severity: 'critical',
        action: 'delete',
        refund: 'none',
        appealAllowed: false,
        description: 'Illegal content is strictly prohibited',
        descriptionMn: 'Хууль бус контент хатуу хориотой'
    },
    spam: {
        type: 'spam',
        severity: 'major',
        action: 'delete',
        refund: 'none',
        appealAllowed: true,
        description: 'Spam content detected',
        descriptionMn: 'Спам контент илэрсэн'
    },
    scam: {
        type: 'scam',
        severity: 'critical',
        action: 'delete',
        refund: 'none',
        appealAllowed: false,
        description: 'Fraudulent/scam listing',
        descriptionMn: 'Залилангийн шинжтэй зар'
    },
    wrong_category: {
        type: 'wrong_category',
        severity: 'minor',
        action: 'request_edit',
        refund: 'none',
        appealAllowed: true,
        description: 'Wrong category selected',
        descriptionMn: 'Буруу категори сонгосон байна'
    },
    low_quality: {
        type: 'low_quality',
        severity: 'minor',
        action: 'request_edit',
        refund: 'none',
        appealAllowed: true,
        description: 'Image/content quality is too low',
        descriptionMn: 'Зураг/контентын чанар хангалтгүй'
    },
    duplicate: {
        type: 'duplicate',
        severity: 'minor',
        action: 'warn',
        refund: 'none',
        appealAllowed: true,
        description: 'Duplicate listing detected',
        descriptionMn: 'Давхардсан зар илэрсэн'
    },
    other: {
        type: 'other',
        severity: 'minor',
        action: 'warn',
        refund: 'none',
        appealAllowed: true,
        description: 'Other policy violation',
        descriptionMn: 'Бусад дүрмийн зөрчил'
    }
};

// Модерацийн тэмдэглэл
export interface ModerationRecord {
    id: string;
    adId: string;
    adTitle: string;
    userId: string;
    violationType: ViolationType;
    action: ModerationAction;
    refundType: RefundType;
    refundAmount?: number;
    moderatorNote: string;
    createdAt: string;
    appealDeadline: string;    // 7 хоногийн дотор
    appealStatus?: 'pending' | 'approved' | 'rejected';
    appealNote?: string;
    appealResolvedAt?: string;
}

// Гомдол (Appeal)
export interface Appeal {
    id: string;
    moderationRecordId: string;
    userId: string;
    reason: string;
    evidence?: string[];       // Нотлох баримтын линкүүд
    submittedAt: string;
    status: 'pending' | 'reviewing' | 'approved' | 'rejected';
    reviewerNote?: string;
    resolvedAt?: string;
}

/**
 * Зар устгах + модерацийн бүртгэл үүсгэх
 */
export function moderateAd(
    adId: string,
    violationType: ViolationType,
    moderatorNote: string
): ModerationRecord | null {
    if (typeof window === 'undefined') return null;

    const rule = VIOLATION_RULES[violationType];
    const ads = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_ADS) || '[]');
    const adIndex = ads.findIndex((a: any) => a.id === adId);

    if (adIndex === -1) return null;

    const ad = ads[adIndex];

    // Модерацийн бүртгэл үүсгэх
    const record: ModerationRecord = {
        id: `mod_${Date.now()}`,
        adId,
        adTitle: ad.title,
        userId: ad.seller?.id || 'unknown',
        violationType,
        action: rule.action,
        refundType: rule.refund,
        moderatorNote,
        createdAt: new Date().toISOString(),
        appealDeadline: new Date(Date.now() + APPEAL_DEADLINE_DAYS * MS_PER_DAY).toISOString(),
    };

    // Зар устгах эсвэл шинэчлэх
    if (rule.action === 'delete') {
        ads[adIndex] = {
            ...ad,
            status: 'deleted',
            deletedAt: new Date().toISOString(),
            deletionReason: violationType,
            moderationRecord: record.id
        };
    } else if (rule.action === 'suspend') {
        ads[adIndex] = {
            ...ad,
            status: 'suspended',
            suspendedAt: new Date().toISOString(),
            moderationRecord: record.id
        };
    } else if (rule.action === 'warn' || rule.action === 'request_edit') {
        ads[adIndex] = {
            ...ad,
            warnings: [...(ad.warnings || []), record.id],
            needsEdit: rule.action === 'request_edit'
        };
    }

    localStorage.setItem(STORAGE_KEYS.MY_ADS, JSON.stringify(ads));

    // Модерацийн түүх хадгалах
    const moderationHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.MODERATION_HISTORY) || '[]');
    moderationHistory.push(record);
    localStorage.setItem(STORAGE_KEYS.MODERATION_HISTORY, JSON.stringify(moderationHistory));

    // Event dispatch
    window.dispatchEvent(new CustomEvent(EVENTS.ADS_UPDATED));
    window.dispatchEvent(new CustomEvent(EVENTS.MODERATION_ACTION, { detail: record }));

    return record;
}

/**
 * Гомдол гаргах
 */
export function submitAppeal(
    moderationRecordId: string,
    reason: string,
    evidence?: string[]
): Appeal | null {
    if (typeof window === 'undefined') return null;

    const moderationHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.MODERATION_HISTORY) || '[]');
    const record = moderationHistory.find((r: ModerationRecord) => r.id === moderationRecordId);

    if (!record) return null;

    // Хугацаа шалгах
    if (new Date() > new Date(record.appealDeadline)) {
        console.error('Appeal deadline passed');
        return null;
    }

    // Appeal зөвшөөрөгдсөн эсэх
    const rule = VIOLATION_RULES[record.violationType as ViolationType];
    if (!rule.appealAllowed) {
        console.error('Appeals not allowed for this violation type');
        return null;
    }

    const appeal: Appeal = {
        id: `appeal_${Date.now()}`,
        moderationRecordId,
        userId: record.userId,
        reason,
        evidence,
        submittedAt: new Date().toISOString(),
        status: 'pending'
    };

    // Гомдлын түүх хадгалах
    const appeals = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPEALS) || '[]');
    appeals.push(appeal);
    localStorage.setItem(STORAGE_KEYS.APPEALS, JSON.stringify(appeals));

    // Модерацийн бүртгэлд холбох
    const recordIndex = moderationHistory.findIndex((r: ModerationRecord) => r.id === moderationRecordId);
    if (recordIndex !== -1) {
        moderationHistory[recordIndex].appealStatus = 'pending';
        localStorage.setItem(STORAGE_KEYS.MODERATION_HISTORY, JSON.stringify(moderationHistory));
    }

    return appeal;
}

/**
 * Гомдол шийдвэрлэх (Admin)
 */
export function resolveAppeal(
    appealId: string,
    approved: boolean,
    reviewerNote: string
): boolean {
    if (typeof window === 'undefined') return false;

    const appeals = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPEALS) || '[]');
    const appealIndex = appeals.findIndex((a: Appeal) => a.id === appealId);

    if (appealIndex === -1) return false;

    const appeal = appeals[appealIndex];

    // Appeal шинэчлэх
    appeals[appealIndex] = {
        ...appeal,
        status: approved ? 'approved' : 'rejected',
        reviewerNote,
        resolvedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.APPEALS, JSON.stringify(appeals));

    // Модерацийн бүртгэл шинэчлэх
    const moderationHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.MODERATION_HISTORY) || '[]');
    const recordIndex = moderationHistory.findIndex((r: ModerationRecord) => r.id === appeal.moderationRecordId);

    if (recordIndex !== -1) {
        moderationHistory[recordIndex].appealStatus = approved ? 'approved' : 'rejected';
        moderationHistory[recordIndex].appealNote = reviewerNote;
        moderationHistory[recordIndex].appealResolvedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.MODERATION_HISTORY, JSON.stringify(moderationHistory));
    }

    // Хэрэв зөвшөөрөгдсөн бол зар сэргээх
    if (approved) {
        const ads = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_ADS) || '[]');
        const adIndex = ads.findIndex((a: any) => a.moderationRecord === appeal.moderationRecordId);

        if (adIndex !== -1) {
            const { status, deletedAt, suspendedAt, deletionReason, ...cleanAd } = ads[adIndex];
            ads[adIndex] = {
                ...cleanAd,
                status: 'active',
                restoredAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEYS.MY_ADS, JSON.stringify(ads));
            window.dispatchEvent(new CustomEvent(EVENTS.ADS_UPDATED));
        }
    }

    return true;
}

/**
 * Буцаалт тооцоолох
 */
export function calculateRefund(
    subscriptionPrice: number,
    daysUsed: number,
    totalDays: number,
    refundType: RefundType,
    refundPercent?: number
): number {
    switch (refundType) {
        case 'full':
            return subscriptionPrice;
        case 'partial':
            const unusedDays = totalDays - daysUsed;
            return Math.round((subscriptionPrice / totalDays) * unusedDays);
        case 'credit':
            return Math.round(subscriptionPrice * (refundPercent || 50) / 100);
        default:
            return 0;
    }
}

/**
 * Гадаадын бараа эсэхийг шалгах (энгийн keyword-based)
 */
export function checkForeignProduct(title: string, description?: string): boolean {
    const foreignKeywords = [
        // Хятад
        'чайна', 'china', '中国', 'хятад', 'made in china', 'ali', 'alibaba', 'taobao', 'wish',
        // Солонгос
        'korea', 'солонгос', '한국', 'korean',
        // Бусад
        'import', 'импорт', 'imported', 'foreign', 'гадаад',
        // Брэндүүд
        'nike', 'adidas', 'gucci', 'louis vuitton', 'chanel', 'prada', 'samsung', 'apple', 'iphone',
        'xiaomi', 'huawei', 'oppo', 'vivo', 'realme'
    ];

    const text = `${title} ${description || ''}`.toLowerCase();

    return foreignKeywords.some(keyword => text.includes(keyword.toLowerCase()));
}

// =============================================
// REPORT SYSTEM - Хэрэглэгчдийн report
// =============================================

// Report-ийн шалтгаанууд
export type ReportReason =
    | 'foreign_product'      // Гадаадын бараа
    | 'counterfeit'          // Хуурамч
    | 'scam'                 // Залилан
    | 'inappropriate'        // Зохисгүй контент
    | 'wrong_info'           // Буруу мэдээлэл
    | 'spam'                 // Спам
    | 'other';               // Бусад

// Report шалтгааны тодорхойлолт
export const REPORT_REASONS: Record<ReportReason, { label: string; labelMn: string }> = {
    foreign_product: { label: 'Foreign product', labelMn: 'Гадаадын бараа' },
    counterfeit: { label: 'Counterfeit/Fake', labelMn: 'Хуурамч бараа' },
    scam: { label: 'Scam/Fraud', labelMn: 'Залилан' },
    inappropriate: { label: 'Inappropriate content', labelMn: 'Зохисгүй контент' },
    wrong_info: { label: 'Wrong information', labelMn: 'Буруу мэдээлэл' },
    spam: { label: 'Spam', labelMn: 'Спам' },
    other: { label: 'Other', labelMn: 'Бусад' }
};

// Report interface
export interface ProductReport {
    id: string;
    productId: string;
    reporterId: string;          // Хэн report хийсэн
    reason: ReportReason;
    description?: string;
    createdAt: string;
}

// Бүтээгдэхүүний report-ийн түүх
export interface ProductReportSummary {
    productId: string;
    reports: ProductReport[];
    totalReports: number;
    status: 'active' | 'hidden' | 'deleted';  // Одоогийн төлөв
    hiddenAt?: string;
    reviewedAt?: string;
    adminDecision?: 'show' | 'delete';
}

/**
 * Бүтээгдэхүүн report хийх
 */
export function reportProduct(
    productId: string,
    reason: ReportReason,
    description?: string
): { success: boolean; message: string; summary?: ProductReportSummary } {
    if (typeof window === 'undefined') {
        return { success: false, message: 'Server-side not supported' };
    }

    // Get reporter ID (from profile or generate)
    const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || '{}');
    const reporterId = profile.id || `anon_${Date.now()}`;

    // Load existing reports
    const allReports: Record<string, ProductReportSummary> =
        JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '{}');

    // Initialize summary for this product if not exists
    if (!allReports[productId]) {
        allReports[productId] = {
            productId,
            reports: [],
            totalReports: 0,
            status: 'active'
        };
    }

    const summary = allReports[productId];

    // Check if user already reported this product
    const alreadyReported = summary.reports.some(r => r.reporterId === reporterId);
    if (alreadyReported) {
        return { success: false, message: 'Та энэ бүтээгдэхүүнийг аль хэдийн report хийсэн байна' };
    }

    // Create new report
    const report: ProductReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId,
        reporterId,
        reason,
        description,
        createdAt: new Date().toISOString()
    };

    // Add report
    summary.reports.push(report);
    summary.totalReports = summary.reports.length;

    // Check thresholds
    let statusChanged = false;
    if (summary.totalReports >= REPORT_THRESHOLD_DELETE && summary.status !== 'deleted') {
        // Auto-delete at 30 reports
        summary.status = 'deleted';
        statusChanged = true;

        // Also update the ad status
        updateAdStatus(productId, 'deleted', 'auto_reported');
    } else if (summary.totalReports >= REPORT_THRESHOLD_HIDE && summary.status === 'active') {
        // Auto-hide at 15 reports
        summary.status = 'hidden';
        summary.hiddenAt = new Date().toISOString();
        statusChanged = true;

        // Update the ad status
        updateAdStatus(productId, 'hidden', 'auto_reported');
    }

    // Save
    allReports[productId] = summary;
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(allReports));

    // Dispatch events
    window.dispatchEvent(new CustomEvent(EVENTS.REPORT_SUBMITTED, { detail: { productId, summary } }));
    if (statusChanged) {
        window.dispatchEvent(new CustomEvent(EVENTS.ADS_UPDATED));
    }

    return {
        success: true,
        message: statusChanged
            ? `Report хүлээн авлаа. Энэ бүтээгдэхүүн ${summary.status === 'deleted' ? 'устгагдлаа' : 'нуугдлаа'}.`
            : 'Report амжилттай илгээгдлээ. Баярлалаа!',
        summary
    };
}

/**
 * Бүтээгдэхүүний төлөв шинэчлэх (internal helper)
 */
function updateAdStatus(productId: string, status: 'hidden' | 'deleted', reason: string) {
    const ads = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_ADS) || '[]');
    const adIndex = ads.findIndex((a: any) => a.id === productId);

    if (adIndex !== -1) {
        ads[adIndex] = {
            ...ads[adIndex],
            status,
            statusReason: reason,
            statusChangedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.MY_ADS, JSON.stringify(ads));
    }
}

/**
 * Бүтээгдэхүүний report-ийн түүх авах
 */
export function getProductReports(productId: string): ProductReportSummary | null {
    if (typeof window === 'undefined') return null;

    const allReports: Record<string, ProductReportSummary> =
        JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '{}');

    return allReports[productId] || null;
}

/**
 * Бүх report-тэй бүтээгдэхүүнүүдийг авах (Admin)
 */
export function getAllReportedProducts(): ProductReportSummary[] {
    if (typeof window === 'undefined') return [];

    const allReports: Record<string, ProductReportSummary> =
        JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '{}');

    return Object.values(allReports).sort((a, b) => b.totalReports - a.totalReports);
}

/**
 * Admin шийдвэр гаргах
 */
export function adminReviewReport(
    productId: string,
    decision: 'show' | 'delete'
): boolean {
    if (typeof window === 'undefined') return false;

    const allReports: Record<string, ProductReportSummary> =
        JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '{}');

    if (!allReports[productId]) return false;

    allReports[productId].reviewedAt = new Date().toISOString();
    allReports[productId].adminDecision = decision;

    if (decision === 'show') {
        allReports[productId].status = 'active';

        // Restore ad
        const ads = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_ADS) || '[]');
        const adIndex = ads.findIndex((a: any) => a.id === productId);
        if (adIndex !== -1) {
            const { status, statusReason, statusChangedAt, ...cleanAd } = ads[adIndex];
            ads[adIndex] = { ...cleanAd, status: 'active' };
            localStorage.setItem(STORAGE_KEYS.MY_ADS, JSON.stringify(ads));
        }
    } else {
        allReports[productId].status = 'deleted';
        updateAdStatus(productId, 'deleted', 'admin_decision');
    }

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(allReports));
    window.dispatchEvent(new CustomEvent(EVENTS.ADS_UPDATED));

    return true;
}

/**
 * Бүтээгдэхүүн харагдах эсэхийг шалгах
 */
export function isProductVisible(productId: string): boolean {
    if (typeof window === 'undefined') return true;

    const allReports: Record<string, ProductReportSummary> =
        JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '{}');

    const summary = allReports[productId];
    if (!summary) return true;

    return summary.status === 'active';
}

/**
 * Хэрэглэгч report хийсэн эсэхийг шалгах
 */
export function hasUserReported(productId: string): boolean {
    if (typeof window === 'undefined') return false;

    const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || '{}');
    const reporterId = profile.id;
    if (!reporterId) return false;

    const allReports: Record<string, ProductReportSummary> =
        JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '{}');

    const summary = allReports[productId];
    if (!summary) return false;

    return summary.reports.some(r => r.reporterId === reporterId);
}

