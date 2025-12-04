/**
 * 🚦 ГЭРЛЭН ДОХИОНЫ СИСТЕМ (Traffic Light Verification)
 * Өсөлт дагасан баталгаажуулалт
 */

export type VerificationLevel = 'none' | 'phone' | 'id_card';
export type TierLevel = 'soum' | 'aimag' | 'national';

export interface VerificationStatus {
    level: VerificationLevel;
    isVerified: boolean;
    idCardFront?: string; // Base64 эсвэл URL
    idCardBack?: string;
    verifiedAt?: string;
    deniedReason?: string;
}

export interface TierUpgradeRequirement {
    currentTier: TierLevel;
    nextTier: TierLevel;
    requiredVerification: VerificationLevel;
    isMandatory: boolean; // ЗААВАЛ эсвэл санал болгох
    fee?: number; // Баталгаажуулалтын хураамж (Улсын түвшинд)
    message: string;
}

/**
 * 🟢 Сумын түвшин: SMS баталгаажуулалт хангалттай
 * 🟡 Аймгийн түвшин: Санал болгох (optional, гэхдээ encourage)
 * 🔴 Улсын түвшин: ЗААВАЛ (mandatory + 5,000₮ хураамж)
 */
export function getTierUpgradeRequirement(
    currentTier: TierLevel,
    nextTier: TierLevel
): TierUpgradeRequirement {
    // Сум → Аймаг: 🟡 Санал болгох
    if (currentTier === 'soum' && nextTier === 'aimag') {
        return {
            currentTier,
            nextTier,
            requiredVerification: 'id_card',
            isMandatory: false,
            message: `🎉 Баяр хүргэе!

Та Аймгийн түвшинд гарлаа. Борлуулалтаа нэмэгдүүлэхийн тулд Иргэний үнэмлэхээ баталгаажуулж 'Ногоон тэмдэг' авахыг зөвлөж байна.

✅ Баталгаажсан зар 3 дахин хурдан зарагддаг шүү!

Та одоо баталгаажуулах эсвэл дараа хийх боломжтой.`
        };
    }

    // Аймаг → Улс: 🔴 ЗААВАЛ
    if (currentTier === 'aimag' && nextTier === 'national') {
        return {
            currentTier,
            nextTier,
            requiredVerification: 'id_card',
            isMandatory: true,
            fee: 5000,
            message: `🚀 Та Үндэсний хэмжээний од боллоо!

Таны зар Улаанбаатар болон бусад 21 аймагт харагдах эрхийг авлаа.

⚠️ Гэхдээ Улсын түвшинд гарахын тулд бид таныг БОДИТ ХҮН мөн эсэхийг шалгах ёстой.

🔒 Шаардлага:
• Иргэний үнэмлэх баталгаажуулалт
• Баталгаажуулалтын хураамж: 5,000₮

Баталгаажуулсны дараа таны зар шууд Улс даяар цацагдана.`
        };
    }

    // Default
    return {
        currentTier,
        nextTier,
        requiredVerification: 'none',
        isMandatory: false,
        message: ''
    };
}

/**
 * Хэрэглэгч verification шаардлагатай эсэхийг шалгах
 */
export function needsVerification(
    currentTier: TierLevel,
    verificationStatus: VerificationStatus
): boolean {
    // Улсын түвшинд гарахад ЗААВАЛ баталгаажуулалт хэрэгтэй
    if (currentTier === 'national') {
        return verificationStatus.level !== 'id_card' || !verificationStatus.isVerified;
    }

    return false;
}

/**
 * Verification badge/icon авах
 */
export function getVerificationBadge(status: VerificationStatus): {
    icon: string;
    label: string;
    color: string;
} | null {
    if (status.level === 'id_card' && status.isVerified) {
        return {
            icon: '✅',
            label: 'Баталгаажсан',
            color: 'green'
        };
    }

    if (status.level === 'phone') {
        return {
            icon: '📱',
            label: 'Утас баталгаажсан',
            color: 'blue'
        };
    }

    return null;
}

/**
 * Зар түр зогсоох эсэхийг шалгах
 * (Улсын түвшинд гарсан гэхдээ баталгаажуулаагүй бол)
 */
export function shouldPauseAd(
    tier: TierLevel,
    verificationStatus: VerificationStatus
): boolean {
    return tier === 'national' && needsVerification(tier, verificationStatus);
}
