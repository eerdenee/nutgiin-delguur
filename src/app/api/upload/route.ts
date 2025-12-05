import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

// ============================================
// CONFIGURATION
// ============================================

const IMAGE_SIZES = {
    thumbnail: { width: 150, quality: 70 },
    medium: { width: 400, quality: 80 },
    large: { width: 800, quality: 85 },
};

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 4096; // 4096x4096 max

// Simple in-memory rate limiting (use Upstash for production scale)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check rate limit for a user
 */
function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (userLimit.count >= RATE_LIMIT) {
        return false;
    }

    userLimit.count++;
    return true;
}

/**
 * Validate file type using magic bytes
 */
async function validateFileType(buffer: Buffer): Promise<string | null> {
    // Check magic bytes for common image formats
    const magicBytes = buffer.slice(0, 12);

    // JPEG: FF D8 FF
    if (magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && magicBytes[2] === 0xFF) {
        return "image/jpeg";
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4E && magicBytes[3] === 0x47) {
        return "image/png";
    }

    // WebP: 52 49 46 46 ... 57 45 42 50
    if (magicBytes[0] === 0x52 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && magicBytes[3] === 0x46) {
        if (magicBytes[8] === 0x57 && magicBytes[9] === 0x45 && magicBytes[10] === 0x42 && magicBytes[11] === 0x50) {
            return "image/webp";
        }
    }

    // GIF: 47 49 46 38
    if (magicBytes[0] === 0x47 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && magicBytes[3] === 0x38) {
        return "image/gif";
    }

    return null;
}

/**
 * Upload with retry logic
 */
async function uploadWithRetry(command: PutObjectCommand, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
        try {
            await r2.send(command);
            return;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

/**
 * Delete uploaded files (for cleanup on failure)
 */
async function deleteUploadedFiles(keys: string[]): Promise<void> {
    for (const key of keys) {
        try {
            await r2.send(new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
            }));
        } catch {
            // Ignore cleanup errors
        }
    }
}

/**
 * Sanitize input string
 */
function sanitizeInput(input: string): string {
    return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>'"]/g, '') // Remove potential XSS characters
        .trim()
        .slice(0, 500); // Limit length
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: NextRequest) {
    const uploadedKeys: string[] = [];

    try {
        // 1. Authentication check
        const authHeader = request.headers.get("authorization");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Get user from Supabase
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader || "" } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Rate limiting
        if (!checkRateLimit(user.id)) {
            return NextResponse.json({
                error: "Too many requests. Please wait a minute."
            }, { status: 429 });
        }

        const contentType = request.headers.get("content-type") || "";

        // ============================================
        // MULTIPART FORM DATA (Direct Upload)
        // ============================================
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            const file = formData.get("file") as File;
            const folder = sanitizeInput((formData.get("folder") as string) || "products");

            if (!file) {
                return NextResponse.json({ error: "No file provided" }, { status: 400 });
            }

            // 3. File size check
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json({
                    error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
                }, { status: 400 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());

            // 4. Magic bytes validation
            const detectedType = await validateFileType(buffer);
            if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType)) {
                return NextResponse.json({
                    error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed."
                }, { status: 400 });
            }

            // 5. Image dimension check
            const metadata = await sharp(buffer).metadata();
            if (!metadata.width || !metadata.height) {
                return NextResponse.json({ error: "Could not read image dimensions" }, { status: 400 });
            }

            if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
                return NextResponse.json({
                    error: `Image dimensions too large. Maximum is ${MAX_DIMENSION}x${MAX_DIMENSION}px`
                }, { status: 400 });
            }

            const fileId = uuidv4();
            const uploadedUrls: Record<string, string> = {};

            // 6. Process and upload multiple sizes with retry
            for (const [sizeName, config] of Object.entries(IMAGE_SIZES)) {
                const optimizedBuffer = await sharp(Buffer.from(buffer))
                    .resize(config.width, null, {
                        withoutEnlargement: true,
                        fit: 'inside'
                    })
                    .webp({ quality: config.quality })
                    .toBuffer();

                const fileName = `${folder}/${fileId}_${sizeName}.webp`;
                uploadedKeys.push(fileName);

                await uploadWithRetry(new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: fileName,
                    Body: optimizedBuffer,
                    ContentType: "image/webp",
                    CacheControl: "public, max-age=31536000, immutable",
                }));

                uploadedUrls[sizeName] = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`;
            }

            // Upload original (optimized)
            const originalBuffer = await sharp(Buffer.from(buffer))
                .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
                .webp({ quality: 90 })
                .toBuffer();

            const originalFileName = `${folder}/${fileId}_original.webp`;
            uploadedKeys.push(originalFileName);

            await uploadWithRetry(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: originalFileName,
                Body: originalBuffer,
                ContentType: "image/webp",
                CacheControl: "public, max-age=31536000, immutable",
            }));

            uploadedUrls.original = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${originalFileName}`;

            return NextResponse.json({
                success: true,
                urls: uploadedUrls,
                publicUrl: uploadedUrls.large,
            });

        }
        // ============================================
        // JSON REQUEST (Presigned URL)
        // ============================================
        else {
            const body = await request.json();
            const folder = sanitizeInput(body.folder || "products");

            const fileName = `${folder}/${uuidv4()}.webp`;

            const putObjectCommand = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                ContentType: "image/webp",
                CacheControl: "public, max-age=31536000, immutable",
            });

            const signedUrl = await getSignedUrl(r2, putObjectCommand, { expiresIn: 3600 });

            return NextResponse.json({
                url: signedUrl,
                key: fileName,
                publicUrl: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`,
            });
        }
    } catch (error) {
        // 7. Cleanup on failure
        if (uploadedKeys.length > 0) {
            await deleteUploadedFiles(uploadedKeys);
        }

        // Log error to Sentry (will be captured automatically)
        if (process.env.NODE_ENV === "development") {
            console.error("Upload error:", error);
        }

        return NextResponse.json({
            error: "Error processing upload. Please try again."
        }, { status: 500 });
    }
}

// Vercel serverless function config
export const maxDuration = 30;
