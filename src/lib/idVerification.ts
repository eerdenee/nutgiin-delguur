/**
 * ID Verification Auto-Delete System
 * 
 * Purpose: Automatically delete sensitive ID card images after verification
 * Legal Requirement: "Хүний хувийн мэдээлэл хамгаалах хууль"
 * 
 * IMPORTANT: We store SHA-256 hash of ID images as cryptographic proof
 * that verification happened, even after the image is deleted.
 */

import { supabase } from './supabase';
import crypto from 'crypto';

const VERIFICATION_EXPIRY_HOURS = 24; // 24 цагийн дараа устгах

interface VerificationRecord {
    id: string;
    userId: string;
    idCardImageKey: string; // R2 key
    uploadedAt: Date;
    verifiedAt?: Date;
    status: 'pending' | 'approved' | 'rejected';
}

/**
 * Schedule ID card image for deletion after verification
 */
export async function scheduleIdImageDeletion(
    userId: string,
    imageKey: string,
    status: 'approved' | 'rejected'
): Promise<void> {
    // 1. Update verification record
    const { error } = await supabase
        .from('id_verifications')
        .update({
            verified_at: new Date().toISOString(),
            status: status,
            scheduled_deletion: new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', userId);

    if (error && process.env.NODE_ENV === 'development') {
        console.error('Failed to schedule deletion:', error);
    }

    // 2. Log for compliance audit
    await logComplianceAction({
        action: 'SCHEDULE_DELETION',
        userId,
        imageKey,
        reason: `Verification ${status}, scheduled for deletion in ${VERIFICATION_EXPIRY_HOURS}h`
    });
}

/**
 * Cron job: Delete expired ID images (run every hour)
 * IMPORTANT: Computes SHA-256 hash before deletion as legal proof
 */
export async function cleanupExpiredIdImages(): Promise<{ deleted: number; errors: number }> {
    let deleted = 0;
    let errors = 0;

    // 1. Get records scheduled for deletion
    const { data: records, error } = await supabase
        .from('id_verifications')
        .select('*')
        .lte('scheduled_deletion', new Date().toISOString())
        .not('id_card_image_key', 'is', null);

    if (error || !records) {
        return { deleted: 0, errors: 1 };
    }

    // 2. Delete each image from R2 (with hash preservation)
    for (const record of records) {
        try {
            // 2a. Download image from R2 to compute hash
            const imageBuffer = await downloadFromR2(record.id_card_image_key);

            // 2b. Compute SHA-256 hash (CRYPTOGRAPHIC PROOF)
            const imageHash = crypto
                .createHash('sha256')
                .update(imageBuffer)
                .digest('hex');

            // 2c. Delete from R2
            await deleteFromR2(record.id_card_image_key);

            // 2d. Update record - store hash, remove image reference
            await supabase
                .from('id_verifications')
                .update({
                    id_card_image_key: null,
                    image_hash_sha256: imageHash, // PROOF: "Энэ хүн шалгагдсан"
                    image_deleted_at: new Date().toISOString()
                })
                .eq('id', record.id);

            deleted++;

            // Compliance log
            await logComplianceAction({
                action: 'DELETE_ID_IMAGE_WITH_HASH',
                userId: record.user_id,
                imageKey: record.id_card_image_key,
                reason: `Hash preserved: ${imageHash.substring(0, 16)}...`
            });

        } catch (err) {
            errors++;
            if (process.env.NODE_ENV === 'development') {
                console.error('Failed to delete ID image:', err);
            }
        }
    }

    return { deleted, errors };
}

/**
 * Download file from R2 (to compute hash before deletion)
 */
async function downloadFromR2(key: string): Promise<Buffer> {
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        }
    });

    const response = await client.send(new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key
    }));

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

/**
 * Delete file from Cloudflare R2
 */
async function deleteFromR2(key: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        }
    });

    await client.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key
    }));
}

/**
 * Compliance audit logging
 */
async function logComplianceAction(log: {
    action: string;
    userId: string;
    imageKey: string;
    reason: string;
}): Promise<void> {
    await supabase.from('compliance_logs').insert({
        ...log,
        timestamp: new Date().toISOString(),
        ip_address: 'system'
    });
}

/**
 * Get user's verification status without exposing image
 */
export async function getUserVerificationStatus(userId: string): Promise<{
    isVerified: boolean;
    verifiedAt?: string;
    status: 'none' | 'pending' | 'approved' | 'rejected';
}> {
    const { data } = await supabase
        .from('id_verifications')
        .select('status, verified_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!data) {
        return { isVerified: false, status: 'none' };
    }

    return {
        isVerified: data.status === 'approved',
        verifiedAt: data.verified_at,
        status: data.status
    };
}
