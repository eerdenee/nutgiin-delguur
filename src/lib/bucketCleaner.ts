/**
 * R2 Bucket Cleaner
 * 
 * Problem: Users upload images but abandon the listing creation.
 *          Over time, R2 fills with "orphaned" files that cost money.
 * Solution: Daily cleanup job that compares R2 files with database records.
 */

import { supabase } from './supabase';

interface CleanupResult {
    totalFilesChecked: number;
    orphanedFilesDeleted: number;
    bytesReclaimed: number;
    errors: number;
}

/**
 * Cron job: Clean orphaned files from R2 (run daily at 3AM)
 */
export async function cleanOrphanedFiles(): Promise<CleanupResult> {
    const result: CleanupResult = {
        totalFilesChecked: 0,
        orphanedFilesDeleted: 0,
        bytesReclaimed: 0,
        errors: 0
    };

    try {
        const { S3Client, ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand } = await import('@aws-sdk/client-s3');

        const client = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            }
        });

        // 1. List all files in R2 bucket
        let continuationToken: string | undefined;
        const allFiles: { key: string; size: number; lastModified: Date }[] = [];

        do {
            const listResponse = await client.send(new ListObjectsV2Command({
                Bucket: process.env.R2_BUCKET_NAME,
                ContinuationToken: continuationToken,
                MaxKeys: 1000
            }));

            if (listResponse.Contents) {
                for (const obj of listResponse.Contents) {
                    if (obj.Key && obj.Size !== undefined) {
                        allFiles.push({
                            key: obj.Key,
                            size: obj.Size,
                            lastModified: obj.LastModified || new Date()
                        });
                    }
                }
            }

            continuationToken = listResponse.NextContinuationToken;
        } while (continuationToken);

        result.totalFilesChecked = allFiles.length;

        // 2. Get all image references from database
        const { data: products } = await supabase
            .from('products')
            .select('image, images');

        const { data: profiles } = await supabase
            .from('profiles')
            .select('avatar_url, company_logo');

        const { data: verifications } = await supabase
            .from('id_verifications')
            .select('id_card_image_key');

        // Build set of valid file keys
        const validKeys = new Set<string>();

        // Product images
        products?.forEach(p => {
            if (p.image) validKeys.add(extractKey(p.image));
            if (Array.isArray(p.images)) {
                p.images.forEach((img: string) => validKeys.add(extractKey(img)));
            }
        });

        // Profile images
        profiles?.forEach(p => {
            if (p.avatar_url) validKeys.add(extractKey(p.avatar_url));
            if (p.company_logo) validKeys.add(extractKey(p.company_logo));
        });

        // Verification images (only active ones)
        verifications?.forEach(v => {
            if (v.id_card_image_key) validKeys.add(v.id_card_image_key);
        });

        // 3. Find orphaned files (older than 24 hours to avoid race conditions)
        const orphanageThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

        for (const file of allFiles) {
            // Skip recent files (might be in-progress uploads)
            if (file.lastModified > orphanageThreshold) {
                continue;
            }

            // Check if file is referenced anywhere
            if (!validKeys.has(file.key)) {
                try {
                    // This is an orphan! Delete it.
                    await client.send(new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: file.key
                    }));

                    result.orphanedFilesDeleted++;
                    result.bytesReclaimed += file.size;

                    // Log cleanup
                    await logCleanup(file.key, file.size);

                } catch (deleteErr) {
                    result.errors++;
                    if (process.env.NODE_ENV === 'development') {
                        console.error(`Failed to delete orphan: ${file.key}`, deleteErr);
                    }
                }
            }
        }

    } catch (err) {
        result.errors++;
        if (process.env.NODE_ENV === 'development') {
            console.error('Bucket cleanup error:', err);
        }
    }

    return result;
}

/**
 * Extract R2 key from full URL
 */
function extractKey(url: string): string {
    if (!url) return '';

    // Handle full URLs (https://pub-xxx.r2.dev/path/to/file.jpg)
    try {
        const urlObj = new URL(url);
        return urlObj.pathname.replace(/^\//, '');
    } catch {
        // Already a key
        return url;
    }
}

/**
 * Log cleanup action for auditing
 */
async function logCleanup(fileKey: string, fileSize: number): Promise<void> {
    await supabase.from('storage_cleanup_logs').insert({
        file_key: fileKey,
        file_size: fileSize,
        action: 'deleted_orphan',
        cleaned_at: new Date().toISOString()
    });
}

/**
 * Get storage usage report
 */
export async function getStorageReport(): Promise<{
    totalFiles: number;
    totalSizeBytes: number;
    totalSizeMB: number;
    estimatedMonthlyCost: number;
}> {
    try {
        const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');

        const client = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            }
        });

        let totalFiles = 0;
        let totalSizeBytes = 0;
        let continuationToken: string | undefined;

        do {
            const response = await client.send(new ListObjectsV2Command({
                Bucket: process.env.R2_BUCKET_NAME,
                ContinuationToken: continuationToken
            }));

            if (response.Contents) {
                totalFiles += response.Contents.length;
                totalSizeBytes += response.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
            }

            continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        const totalSizeMB = totalSizeBytes / (1024 * 1024);

        // Cloudflare R2 pricing: $0.015 per GB per month
        const totalSizeGB = totalSizeMB / 1024;
        const estimatedMonthlyCost = totalSizeGB * 0.015;

        return {
            totalFiles,
            totalSizeBytes,
            totalSizeMB: Math.round(totalSizeMB * 100) / 100,
            estimatedMonthlyCost: Math.round(estimatedMonthlyCost * 100) / 100
        };

    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Storage report error:', err);
        }
        return {
            totalFiles: 0,
            totalSizeBytes: 0,
            totalSizeMB: 0,
            estimatedMonthlyCost: 0
        };
    }
}
