/**
 * DOOMSDAY BACKUP - Independent Data Recovery
 * 
 * Problem: Supabase blocks you, or you accidentally DROP TABLE.
 *          Everything is gone.
 * Solution: Weekly independent backup to local/Google Drive.
 *           Your DATA is your lifeline - you can rebuild anything with data.
 */

import { supabase } from './supabase';

// Critical tables to backup
const CRITICAL_TABLES = [
    'profiles',      // User contact info - MOST IMPORTANT
    'products',      // Listings
    'verified_transactions',
    'reviews'
];

interface BackupData {
    version: '1.0';
    createdAt: string;
    tables: Record<string, any[]>;
    stats: {
        totalUsers: number;
        totalProducts: number;
        totalPhones: number;
        totalEmails: number;
    };
}

/**
 * Generate downloadable backup
 */
export async function generateLocalBackup(): Promise<{
    success: boolean;
    data?: BackupData;
    downloadUrl?: string;
    error?: string;
}> {
    try {
        const backup: BackupData = {
            version: '1.0',
            createdAt: new Date().toISOString(),
            tables: {},
            stats: {
                totalUsers: 0,
                totalProducts: 0,
                totalPhones: 0,
                totalEmails: 0
            }
        };

        // Export each table
        for (const table of CRITICAL_TABLES) {
            const { data, error } = await supabase
                .from(table)
                .select('*');

            if (error) {
                console.error(`Failed to backup ${table}:`, error);
                continue;
            }

            backup.tables[table] = data || [];
        }

        // Calculate stats
        const profiles = backup.tables['profiles'] || [];
        backup.stats.totalUsers = profiles.length;
        backup.stats.totalPhones = profiles.filter((p: any) => p.phone).length;
        backup.stats.totalEmails = profiles.filter((p: any) => p.email).length;
        backup.stats.totalProducts = (backup.tables['products'] || []).length;

        // Create downloadable blob
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);

        return {
            success: true,
            data: backup,
            downloadUrl
        };

    } catch (error) {
        return {
            success: false,
            error: 'Backup үүсгэхэд алдаа гарлаа'
        };
    }
}

/**
 * Generate CSV backup for specific table
 */
export async function generateCSVBackup(
    table: 'profiles' | 'products'
): Promise<{ csv: string; filename: string }> {
    const { data } = await supabase.from(table).select('*');

    if (!data || data.length === 0) {
        return { csv: '', filename: `${table}_empty.csv` };
    }

    // Get headers from first row
    const headers = Object.keys(data[0]);

    // Convert to CSV
    const rows = data.map(row =>
        headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const date = new Date().toISOString().split('T')[0];

    return {
        csv,
        filename: `${table}_backup_${date}.csv`
    };
}

/**
 * Extract contact list (for emergency SMS)
 */
export async function extractContactList(): Promise<{
    phones: string[];
    emails: string[];
    count: number;
}> {
    const { data: profiles } = await supabase
        .from('profiles')
        .select('phone, email')
        .not('phone', 'is', null);

    const phones = (profiles || [])
        .map((p: any) => p.phone)
        .filter((p: string) => p && p.length > 0);

    const emails = (profiles || [])
        .map((p: any) => p.email)
        .filter((e: string) => e && e.length > 0);

    return {
        phones,
        emails,
        count: phones.length + emails.length
    };
}

/**
 * Download helper for browser
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Schedule automatic backup reminder
 */
export function getBackupReminderMessage(): {
    show: boolean;
    message: string;
    priority: 'low' | 'medium' | 'high';
} | null {
    if (typeof window === 'undefined') return null;

    const lastBackup = localStorage.getItem('last_backup_date');

    if (!lastBackup) {
        return {
            show: true,
            message: 'Та backup хийгээгүй байна. Одоо хийх үү?',
            priority: 'high'
        };
    }

    const daysSinceBackup = Math.floor(
        (Date.now() - new Date(lastBackup).getTime()) / (24 * 3600 * 1000)
    );

    if (daysSinceBackup >= 7) {
        return {
            show: true,
            message: `${daysSinceBackup} хоногийн өмнө backup хийсэн. Шинэчлэх үү?`,
            priority: daysSinceBackup >= 14 ? 'high' : 'medium'
        };
    }

    return null;
}

/**
 * Record backup completion
 */
export function recordBackupComplete(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('last_backup_date', new Date().toISOString());
}

// ============================================
// EMERGENCY RECOVERY GUIDE
// ============================================

export const RECOVERY_GUIDE = `
# 🚨 ГАМШИГААС СЭРГЭХ ЗААВАР

## 1. Supabase account түгжигдсэн бол:

1. Хамгийн сүүлийн JSON backup файлаа олоорой
2. Шинэ Supabase төсөл үүсгээрэй
3. backup.tables.profiles дээрхи датаг import хийнэ
4. SMS үйлчилгээгээр хэрэглэгчид мэдэгдэнэ

## 2. Database устсан бол:

1. Supabase Dashboard -> Settings -> Database -> восстановить
2. Хэрэв сэргээх боломжгүй бол backup ашиглана
3. CSV файлаа Supabase table editor-р import хийнэ

## 3. Site domain-г гээсэн бол:

1. contacts.csv дээрхи утаснууд руу SMS илгээнэ
2. "Бид шинэ хаяг руу нүүлээ: ..."
3. Facebook page дээр мэдэгдэл гаргана

## ⚠️ ХАМГИЙН ЧУХАЛ:

profiles.phone болон profiles.email = АЛТАН ЖАГСААЛТ
Энийг ХЭЗЭЭ Ч алдаж болохгүй!
Долоо хоногт 1 backup автоматаар хийх мартуузай.
`;

/**
 * Get recovery guide as downloadable file
 */
export function downloadRecoveryGuide(): void {
    downloadFile(RECOVERY_GUIDE, 'RECOVERY_GUIDE.md', 'text/markdown');
}
