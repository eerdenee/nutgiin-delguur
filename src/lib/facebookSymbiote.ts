/**
 * FACEBOOK SYMBIOTE - Auto-Generate Shareable Cards
 * 
 * Problem: Mongolians live in Facebook groups. Can't compete with FB.
 * Solution: Make your site a TOOL for Facebook - auto-generate beautiful 
 *           image cards with your logo that users share on Facebook.
 */

interface ProductCardData {
    title: string;
    price: number;
    description: string;
    imageUrl: string;
    sellerName: string;
    sellerPhone: string;
    location: { aimag: string; soum: string };
    productUrl: string;
}

/**
 * Generate HTML for a shareable product card
 * This can be rendered to canvas and downloaded as image
 */
export function generateShareableCardHTML(product: ProductCardData): string {
    const formattedPrice = formatPrice(product.price);
    const locationText = product.location.soum
        ? `${product.location.aimag}, ${product.location.soum}`
        : product.location.aimag;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .card {
            width: 600px;
            height: 800px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            font-family: 'Segoe UI', Arial, sans-serif;
            color: white;
            position: relative;
            overflow: hidden;
        }
        .product-image {
            width: 100%;
            height: 400px;
            object-fit: cover;
        }
        .content {
            padding: 24px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 12px;
            line-height: 1.3;
        }
        .price {
            font-size: 36px;
            font-weight: bold;
            color: #00d9ff;
            margin-bottom: 16px;
        }
        .description {
            font-size: 16px;
            color: #b0b0b0;
            margin-bottom: 20px;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .info-row {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 18px;
        }
        .info-icon {
            width: 24px;
            margin-right: 12px;
        }
        .location {
            color: #ffd93d;
        }
        .phone {
            color: #6bcb77;
            font-size: 24px;
            font-weight: bold;
        }
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.5);
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .logo {
            font-size: 20px;
            font-weight: bold;
            color: #00d9ff;
        }
        .logo span {
            color: white;
        }
        .qr-hint {
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="card">
        <img class="product-image" src="${product.imageUrl}" alt="${product.title}">
        <div class="content">
            <h1 class="title">${product.title}</h1>
            <div class="price">${formattedPrice}</div>
            <p class="description">${product.description}</p>
            <div class="info-row">
                <span class="info-icon">📍</span>
                <span class="location">${locationText}</span>
            </div>
            <div class="info-row">
                <span class="info-icon">📞</span>
                <span class="phone">${product.sellerPhone}</span>
            </div>
        </div>
        <div class="footer">
            <div class="logo">Нутгийн<span>Дэлгүүр</span>.mn</div>
            <div class="qr-hint">nutgiindelguur.mn дээр нэмэлт зар үзнэ үү</div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate card as canvas (for download)
 * Returns data URL for the image
 */
export async function generateShareableCardImage(
    product: ProductCardData
): Promise<string> {
    // This would typically use html2canvas or a server-side renderer
    // For now, return the HTML that can be rendered

    // In a real implementation:
    // 1. Use html2canvas on client side
    // 2. Or use Puppeteer/Playwright on server side
    // 3. Or use a service like Cloudinary transformations

    const html = generateShareableCardHTML(product);

    // Placeholder: In production, convert to image
    return html;
}

/**
 * Generate simple text version for copy-paste
 */
export function generateShareableText(product: ProductCardData): string {
    const locationText = product.location.soum
        ? `${product.location.aimag}, ${product.location.soum}`
        : product.location.aimag;

    return `🛒 ${product.title}

💰 Үнэ: ${formatPrice(product.price)}

📍 Байршил: ${locationText}

📞 Утас: ${product.sellerPhone}

${product.description.slice(0, 200)}${product.description.length > 200 ? '...' : ''}

🔗 Дэлгэрэнгүй: ${product.productUrl}

----
Нутгийн Дэлгүүр | nutgiindelguur.mn`;
}

/**
 * Generate Open Graph meta tags for rich link preview
 */
export function generateOGMetaTags(product: ProductCardData): Record<string, string> {
    return {
        'og:title': product.title,
        'og:description': `${formatPrice(product.price)} - ${product.location.aimag}`,
        'og:image': product.imageUrl,
        'og:url': product.productUrl,
        'og:type': 'product',
        'og:site_name': 'Нутгийн Дэлгүүр',
        'og:locale': 'mn_MN',
        // Twitter cards
        'twitter:card': 'summary_large_image',
        'twitter:title': product.title,
        'twitter:description': `${formatPrice(product.price)} - ${product.location.aimag}`,
        'twitter:image': product.imageUrl,
        // Product specific
        'product:price:amount': product.price.toString(),
        'product:price:currency': 'MNT'
    };
}

function formatPrice(price: number): string {
    if (price >= 1000000) {
        return `${(price / 1000000).toFixed(1)} сая ₮`;
    }
    return `${price.toLocaleString('mn-MN')}₮`;
}

/**
 * Track shares for analytics
 */
export async function trackShare(
    productId: string,
    platform: 'facebook' | 'messenger' | 'copy' | 'download',
    userId?: string
): Promise<void> {
    // Import supabase dynamically to avoid circular deps
    const { supabase } = await import('./supabase');

    await supabase.from('share_tracking').insert({
        product_id: productId,
        user_id: userId,
        platform,
        created_at: new Date().toISOString()
    });

    // Increment share count on product
    await supabase.rpc('increment_product_stat', {
        p_product_id: productId,
        p_column: 'shares',
        p_amount: 1
    });
}
