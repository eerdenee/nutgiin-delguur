/**
 * Vendor Escape Hatch - Database Backup System
 * 
 * Problem: 100% dependency on Supabase. If they go down, raise prices, 
 *          or ban your account - your business is DEAD.
 * Solution: Daily automated backups to independent storage (R2/S3).
 */

import { supabase } from './supabase';

const CRITICAL_TABLES = [
    'profiles',
    'products',
    'verified_transactions',
    'reviews',
    'reports',
    'vip_purchases',
    'id_verifications', // Note: Only metadata, images are deleted
    'notifications'
];

interface BackupResult {
    success: boolean;
    tablesBackedUp: number;
    totalRows: number;
    sizeBytes: number;
    backupKey: string;
    timestamp: string;
    errors: string[];
}

/**
 * Create a full database backup (run daily at 2AM)
 */
export async function createDatabaseBackup(): Promise<BackupResult> {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const backupKey = `backups/db_backup_${timestamp}.json`;
    const errors: string[] = [];
    let totalRows = 0;

    const backupData: Record<string, any[]> = {};

    // 1. Export each critical table
    for (const table of CRITICAL_TABLES) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact' });

            if (error) {
                errors.push(`${table}: ${error.message}`);
                continue;
            }

            backupData[table] = data || [];
            totalRows += count || 0;

        } catch (err) {
            errors.push(`${table}: Failed to export`);
        }
    }

    // 2. Create backup metadata
    const backup = {
        version: '1.0',
        created_at: new Date().toISOString(),
        source: 'supabase',
        project_id: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].replace('https://', ''),
        tables: backupData,
        row_counts: Object.fromEntries(
            Object.entries(backupData).map(([k, v]) => [k, v.length])
        ),
        checksum: generateChecksum(JSON.stringify(backupData))
    };

    // 3. Upload to R2 (independent from Supabase)
    const backupJson = JSON.stringify(backup, null, 2);
    const sizeBytes = new TextEncoder().encode(backupJson).length;

    try {
        await uploadBackupToR2(backupKey, backupJson);
    } catch (err) {
        errors.push(`R2 upload failed: ${err}`);
        return {
            success: false,
            tablesBackedUp: Object.keys(backupData).length,
            totalRows,
            sizeBytes,
            backupKey,
            timestamp,
            errors
        };
    }

    // 4. Log backup for audit
    await supabase.from('backup_logs').insert({
        backup_key: backupKey,
        tables_backed_up: Object.keys(backupData).length,
        total_rows: totalRows,
        size_bytes: sizeBytes,
        status: errors.length > 0 ? 'partial' : 'success',
        errors: errors.length > 0 ? errors : null,
        created_at: new Date().toISOString()
    });

    return {
        success: errors.length === 0,
        tablesBackedUp: Object.keys(backupData).length,
        totalRows,
        sizeBytes,
        backupKey,
        timestamp,
        errors
    };
}

/**
 * Upload backup to Cloudflare R2
 */
async function uploadBackupToR2(key: string, content: string): Promise<void> {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        }
    });

    await client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: 'application/json'
    }));
}

/**
 * Generate simple checksum for data integrity verification
 */
function generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

/**
 * List available backups
 */
export async function listBackups(): Promise<{ key: string; date: string; size: number }[]> {
    const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        }
    });

    const response = await client.send(new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        Prefix: 'backups/'
    }));

    return (response.Contents || []).map(obj => ({
        key: obj.Key || '',
        date: obj.LastModified?.toISOString() || '',
        size: obj.Size || 0
    }));
}

/**
 * Restore from backup (EMERGENCY USE ONLY)
 * This should be run manually on a new database
 */
export async function downloadBackup(backupKey: string): Promise<string> {
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
        Key: backupKey
    }));

    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Cleanup old backups (keep last 30 days)
 */
export async function cleanupOldBackups(): Promise<number> {
    const { S3Client, DeleteObjectCommand, ListObjectsV2Command } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        }
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let deleted = 0;

    const response = await client.send(new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        Prefix: 'backups/'
    }));

    for (const obj of response.Contents || []) {
        if (obj.LastModified && obj.LastModified < thirtyDaysAgo && obj.Key) {
            await client.send(new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: obj.Key
            }));
            deleted++;
        }
    }

    return deleted;
}
