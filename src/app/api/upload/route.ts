import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

// Image sizes for different use cases
const IMAGE_SIZES = {
    thumbnail: { width: 150, quality: 70 },   // Жижиг preview
    medium: { width: 400, quality: 80 },      // Product card
    large: { width: 800, quality: 85 },       // Detail page
};

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") || "";

        // Check if it's a direct image upload (multipart) or presigned URL request
        if (contentType.includes("multipart/form-data")) {
            // Direct upload with optimization
            const formData = await request.formData();
            const file = formData.get("file") as File;
            const folder = (formData.get("folder") as string) || "products";

            if (!file) {
                return NextResponse.json({ error: "No file provided" }, { status: 400 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const fileId = uuidv4();

            // Process and upload multiple sizes
            const uploadedUrls: Record<string, string> = {};

            for (const [sizeName, config] of Object.entries(IMAGE_SIZES)) {
                // Resize and convert to WebP
                const optimizedBuffer = await sharp(buffer)
                    .resize(config.width, null, {
                        withoutEnlargement: true,
                        fit: 'inside'
                    })
                    .webp({ quality: config.quality })
                    .toBuffer();

                const fileName = `${folder}/${fileId}_${sizeName}.webp`;

                // Upload to R2
                await r2.send(new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: fileName,
                    Body: optimizedBuffer,
                    ContentType: "image/webp",
                    CacheControl: "public, max-age=31536000", // 1 year cache
                }));

                uploadedUrls[sizeName] = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`;
            }

            // Also upload original (but still optimized)
            const originalBuffer = await sharp(buffer)
                .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
                .webp({ quality: 90 })
                .toBuffer();

            const originalFileName = `${folder}/${fileId}_original.webp`;
            await r2.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: originalFileName,
                Body: originalBuffer,
                ContentType: "image/webp",
                CacheControl: "public, max-age=31536000",
            }));

            uploadedUrls.original = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${originalFileName}`;

            return NextResponse.json({
                success: true,
                urls: uploadedUrls,
                // Default URL for backward compatibility
                publicUrl: uploadedUrls.large,
            });

        } else {
            // Presigned URL request (existing logic for client-side upload)
            const { fileType, folder = "products" } = await request.json();

            const fileExtension = "webp"; // Always use webp
            const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

            const putObjectCommand = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                ContentType: "image/webp",
                CacheControl: "public, max-age=31536000",
            });

            const signedUrl = await getSignedUrl(r2, putObjectCommand, { expiresIn: 3600 });

            return NextResponse.json({
                url: signedUrl,
                key: fileName,
                publicUrl: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`,
            });
        }
    } catch (error) {
        console.error("Error in upload:", error);
        return NextResponse.json({ error: "Error processing upload" }, { status: 500 });
    }
}

// Increase body size limit for image uploads
export const config = {
    api: {
        bodyParser: {
            sizeLimit: "10mb",
        },
    },
};
