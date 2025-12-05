/**
 * Cloudflare R2 Client Configuration
 */

import { S3Client } from "@aws-sdk/client-s3";

// Validate required environment variables
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (process.env.NODE_ENV === 'development') {
    if (!accountId) console.warn('⚠️ R2_ACCOUNT_ID not configured');
    if (!accessKeyId) console.warn('⚠️ R2_ACCESS_KEY_ID not configured');
    if (!secretAccessKey) console.warn('⚠️ R2_SECRET_ACCESS_KEY not configured');
}

/**
 * R2 S3-compatible client
 */
export const r2 = new S3Client({
    region: "auto",
    endpoint: accountId
        ? `https://${accountId}.r2.cloudflarestorage.com`
        : "https://placeholder.r2.cloudflarestorage.com",
    credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
    },
});

/**
 * Check if R2 is properly configured
 */
export const isR2Configured = (): boolean => {
    return !!(accountId && accessKeyId && secretAccessKey);
};

/**
 * Get public URL for a file
 */
export const getPublicUrl = (key: string): string => {
    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (!publicUrl) {
        throw new Error('NEXT_PUBLIC_R2_PUBLIC_URL not configured');
    }
    return `${publicUrl}/${key}`;
};
