/**
 * QUALITY FLOOR ALGORITHM
 * 
 * Problem: First 10 listings with bad photos infect the entire platform.
 *          New users think "oh this is how it's done here" and post garbage too.
 * Solution: Enforce minimum quality standards before posting.
 */

// Minimum quality thresholds
const QUALITY_THRESHOLDS = {
    minImageWidth: 400,           // Minimum image width in pixels
    minImageHeight: 300,          // Minimum image height in pixels
    minDescriptionLength: 20,     // Minimum description characters
    maxDescriptionLength: 5000,   // Maximum description characters
    minTitleLength: 5,            // Minimum title characters
    maxTitleLength: 100,          // Maximum title characters
    minPrice: 100,                // Minimum price (not free, not 1₮)
    requireImage: true            // At least one image required
};

interface QualityCheckResult {
    passed: boolean;
    errors: string[];
    warnings: string[];
    score: number; // 0-100
}

/**
 * Main quality validation function
 */
export function validateListingQuality(listing: {
    title: string;
    description: string;
    price: number;
    images: { width: number; height: number; url: string }[];
    category: string;
}): QualityCheckResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // 1. Title validation
    if (!listing.title || listing.title.trim().length < QUALITY_THRESHOLDS.minTitleLength) {
        errors.push(`Гарчиг дор хаяж ${QUALITY_THRESHOLDS.minTitleLength} тэмдэгт байх ёстой`);
        score -= 20;
    }
    if (listing.title && listing.title.length > QUALITY_THRESHOLDS.maxTitleLength) {
        errors.push(`Гарчиг ${QUALITY_THRESHOLDS.maxTitleLength} тэмдэгтээс хэтрэхгүй байх ёстой`);
        score -= 10;
    }
    // Check for lazy titles
    const lazyTitles = ['зарна', 'зарах', 'худалдана', 'авна', 'хүсч байна'];
    if (lazyTitles.includes(listing.title?.toLowerCase().trim())) {
        errors.push('Гарчиг дэлгэрэнгүй бичнэ үү. "Зарна" гэхэд хангалтгүй.');
        score -= 15;
    }

    // 2. Description validation
    if (!listing.description || listing.description.trim().length < QUALITY_THRESHOLDS.minDescriptionLength) {
        errors.push(`Тайлбар дор хаяж ${QUALITY_THRESHOLDS.minDescriptionLength} тэмдэгт байх ёстой. Дэлгэрэнгүй бичнэ үү.`);
        score -= 25;
    }
    if (listing.description && listing.description.length > QUALITY_THRESHOLDS.maxDescriptionLength) {
        errors.push(`Тайлбар ${QUALITY_THRESHOLDS.maxDescriptionLength} тэмдэгтээс хэтрэхгүй байх ёстой`);
        score -= 5;
    }
    // Bonus for detailed descriptions
    if (listing.description && listing.description.length > 100) {
        score += 5;
    }
    if (listing.description && listing.description.length > 300) {
        score += 5;
    }

    // 3. Price validation
    if (listing.price <= 0) {
        errors.push('Бодит үнэ оруулна уу (0-ээс их)');
        score -= 30;
    } else if (listing.price < QUALITY_THRESHOLDS.minPrice) {
        errors.push(`Үнэ дор хаяж ${QUALITY_THRESHOLDS.minPrice}₮ байх ёстой`);
        score -= 20;
    }
    // Suspicious price warning
    if (listing.price === 1 || listing.price === 10 || listing.price === 100) {
        warnings.push('Анхааруулга: Үнэ зөв эсэхийг шалгана уу');
    }

    // 4. Image validation
    if (QUALITY_THRESHOLDS.requireImage && (!listing.images || listing.images.length === 0)) {
        errors.push('Дор хаяж нэг зураг оруулна уу');
        score -= 30;
    }

    if (listing.images && listing.images.length > 0) {
        for (let i = 0; i < listing.images.length; i++) {
            const img = listing.images[i];
            if (img.width < QUALITY_THRESHOLDS.minImageWidth || img.height < QUALITY_THRESHOLDS.minImageHeight) {
                errors.push(`Зураг ${i + 1} хэт жижиг байна. Дор хаяж ${QUALITY_THRESHOLDS.minImageWidth}x${QUALITY_THRESHOLDS.minImageHeight}px байх ёстой.`);
                score -= 15;
            }
        }
        // Bonus for multiple images
        if (listing.images.length >= 3) score += 5;
        if (listing.images.length >= 5) score += 5;
    }

    // Cap score
    score = Math.max(0, Math.min(100, score));

    return {
        passed: errors.length === 0,
        errors,
        warnings,
        score
    };
}

/**
 * Check image dimensions before upload
 */
export function validateImageDimensions(
    file: File
): Promise<{ valid: boolean; width: number; height: number; error?: string }> {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            if (img.width < QUALITY_THRESHOLDS.minImageWidth ||
                img.height < QUALITY_THRESHOLDS.minImageHeight) {
                resolve({
                    valid: false,
                    width: img.width,
                    height: img.height,
                    error: `Зураг хэт жижиг (${img.width}x${img.height}). Дор хаяж ${QUALITY_THRESHOLDS.minImageWidth}x${QUALITY_THRESHOLDS.minImageHeight}px шаардлагатай.`
                });
            } else {
                resolve({
                    valid: true,
                    width: img.width,
                    height: img.height
                });
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({
                valid: false,
                width: 0,
                height: 0,
                error: 'Зураг уншигдсангүй. Зөв формат (JPG, PNG, WebP) байх ёстой.'
            });
        };

        img.src = url;
    });
}

/**
 * Real-time validation feedback for form
 */
export function getFieldStatus(
    field: 'title' | 'description' | 'price',
    value: string | number
): { status: 'empty' | 'error' | 'warning' | 'valid'; message?: string } {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return { status: 'empty' };
    }

    switch (field) {
        case 'title':
            const titleLen = (value as string).trim().length;
            if (titleLen < QUALITY_THRESHOLDS.minTitleLength) {
                return {
                    status: 'error',
                    message: `${QUALITY_THRESHOLDS.minTitleLength - titleLen} тэмдэгт дутуу`
                };
            }
            if (lazyTitleCheck(value as string)) {
                return { status: 'warning', message: 'Илүү тодорхой бичээрэй' };
            }
            return { status: 'valid' };

        case 'description':
            const descLen = (value as string).trim().length;
            if (descLen < QUALITY_THRESHOLDS.minDescriptionLength) {
                return {
                    status: 'error',
                    message: `${QUALITY_THRESHOLDS.minDescriptionLength - descLen} тэмдэгт дутуу`
                };
            }
            if (descLen < 50) {
                return { status: 'warning', message: 'Илүү дэлгэрэнгүй бичвэл сайн' };
            }
            return { status: 'valid' };

        case 'price':
            const priceNum = typeof value === 'number' ? value : parseInt(value as string);
            if (isNaN(priceNum) || priceNum <= 0) {
                return { status: 'error', message: 'Бодит үнэ оруулна уу' };
            }
            if (priceNum < QUALITY_THRESHOLDS.minPrice) {
                return { status: 'error', message: `Дор хаяж ${QUALITY_THRESHOLDS.minPrice}₮` };
            }
            if ([1, 10, 100].includes(priceNum)) {
                return { status: 'warning', message: 'Үнэ зөв үү?' };
            }
            return { status: 'valid' };
    }
}

function lazyTitleCheck(title: string): boolean {
    const lazy = ['зарна', 'зарах', 'худалдана', 'авна', 'хүсч байна', 'for sale', 'sell'];
    return lazy.includes(title.toLowerCase().trim());
}
