/**
 * Cloudflare R2 Image Upload Integration
 * 
 * Setup:
 * 1. Create R2 bucket in Cloudflare Dashboard
 * 2. Get API credentials (Account ID, Access Key ID, Secret Access Key)
 * 3. Set environment variables
 */

// Environment variables needed:
// NEXT_PUBLIC_R2_PUBLIC_URL - Public bucket URL (e.g., https://images.nutgiindelguur.mn)
// R2_ACCOUNT_ID
// R2_ACCESS_KEY_ID
// R2_SECRET_ACCESS_KEY
// R2_BUCKET_NAME

export interface ImageVariants {
    original: string;
    large: string;    // 1200px
    medium: string;   // 600px
    thumbnail: string; // 150px
}

export interface UploadResult {
    success: boolean;
    url?: string;
    variants?: ImageVariants;
    error?: string;
}

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

/**
 * Generate image URL with optional resize parameters
 * Uses Cloudflare Image Resizing
 */
export function getImageUrl(path: string, width?: number): string {
    if (!path) return '/placeholder.jpg';

    // If already a full URL, use as-is
    if (path.startsWith('http')) {
        if (width && path.includes(R2_PUBLIC_URL)) {
            // Add resize parameter for R2 images
            return `${path}?w=${width}&f=webp&q=85`;
        }
        return path;
    }

    // Construct R2 URL
    const baseUrl = R2_PUBLIC_URL || '';
    const url = `${baseUrl}/${path}`;

    if (width) {
        return `${url}?w=${width}&f=webp&q=85`;
    }

    return url;
}

/**
 * Get all image variants
 */
export function getImageVariants(path: string): ImageVariants {
    return {
        original: getImageUrl(path),
        large: getImageUrl(path, 1200),
        medium: getImageUrl(path, 600),
        thumbnail: getImageUrl(path, 150),
    };
}

/**
 * Compress image on client-side before upload
 */
export async function compressImage(
    file: File,
    maxWidth: number = 1600,
    quality: number = 0.85
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if needed
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/webp',
                    quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

/**
 * Upload image to R2 via API route
 */
export async function uploadImage(file: File, folder: string = 'products'): Promise<UploadResult> {
    try {
        // Compress image first
        const compressedBlob = await compressImage(file);

        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const filename = `${folder}/${timestamp}-${randomId}.webp`;

        // Create form data
        const formData = new FormData();
        formData.append('file', compressedBlob, filename);
        formData.append('folder', folder);

        // Upload via API route
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.message || 'Upload failed' };
        }

        const data = await response.json();

        return {
            success: true,
            url: data.url,
            variants: getImageVariants(data.path),
        };
    } catch (error) {
        console.error('Upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Upload multiple images
 */
export async function uploadImages(files: File[], folder: string = 'products'): Promise<string[]> {
    const results = await Promise.all(
        files.map(file => uploadImage(file, folder))
    );

    return results
        .filter(r => r.success && r.url)
        .map(r => r.url as string);
}

/**
 * Delete image from R2
 */
export async function deleteImage(url: string): Promise<boolean> {
    try {
        const response = await fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        return response.ok;
    } catch (error) {
        console.error('Delete error:', error);
        return false;
    }
}

// Fallback: Use base64 for development
export async function imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}
