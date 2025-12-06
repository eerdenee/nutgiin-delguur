/**
 * AUTOPILOT - Operational Automation
 * 
 * Goal: Make the founder obsolete from daily operations.
 * The system should run itself while founder drinks coffee.
 */

import { supabase } from './supabase';

// ============================================
// AUTOMATED TASKS REGISTRY
// ============================================

interface AutomatedTask {
    name: string;
    description: string;
    frequency: 'every_minute' | 'hourly' | 'daily' | 'weekly';
    handler: () => Promise<TaskResult>;
    enabled: boolean;
}

interface TaskResult {
    success: boolean;
    processed: number;
    errors: number;
    details?: string;
}

/**
 * Registry of all automated tasks
 */
export const AUTOMATED_TASKS: AutomatedTask[] = [
    // Every Minute
    {
        name: 'cleanup_expired_reservations',
        description: 'Хугацаа дууссан reservation-уудыг цэвэрлэх',
        frequency: 'every_minute',
        handler: cleanupExpiredReservations,
        enabled: true
    },

    // Hourly
    {
        name: 'process_pending_payments',
        description: 'Хүлээгдэж буй төлбөрүүдийг шалгах',
        frequency: 'hourly',
        handler: processPendingPayments,
        enabled: true
    },
    {
        name: 'send_scheduled_notifications',
        description: 'Хүлээгдэж буй мэдэгдлүүдийг илгээх',
        frequency: 'hourly',
        handler: sendScheduledNotifications,
        enabled: true
    },
    {
        name: 'update_engagement_scores',
        description: 'Engagement score шинэчлэх',
        frequency: 'hourly',
        handler: updateEngagementScores,
        enabled: true
    },

    // Daily
    {
        name: 'auto_expire_listings',
        description: '14 хоног болсон зарыг идэвхгүй болгох',
        frequency: 'daily',
        handler: autoExpireListings,
        enabled: true
    },
    {
        name: 'send_expiry_reminders',
        description: 'Дуусах гэж буй зарын эзэд рүү сануулга',
        frequency: 'daily',
        handler: sendExpiryReminders,
        enabled: true
    },
    {
        name: 'cleanup_orphaned_files',
        description: 'Хог файлуудыг устгах',
        frequency: 'daily',
        handler: cleanupOrphanedFiles,
        enabled: true
    },
    {
        name: 'generate_daily_stats',
        description: 'Өдрийн статистик үүсгэх',
        frequency: 'daily',
        handler: generateDailyStats,
        enabled: true
    },
    {
        name: 'auto_approve_moderation',
        description: '24 цагаас дээш хүлээсэн зар автоматаар батлах',
        frequency: 'daily',
        handler: autoApproveStaleModeration,
        enabled: false // Needs manual review first
    },

    // Weekly
    {
        name: 'create_backup',
        description: 'Долоо хоногийн backup үүсгэх',
        frequency: 'weekly',
        handler: createWeeklyBackup,
        enabled: true
    },
    {
        name: 'cleanup_old_logs',
        description: 'Хуучин log-уудыг цэвэрлэх',
        frequency: 'weekly',
        handler: cleanupOldLogs,
        enabled: true
    },
    {
        name: 'generate_weekly_report',
        description: 'Долоо хоногийн тайлан админд илгээх',
        frequency: 'weekly',
        handler: generateWeeklyReport,
        enabled: true
    }
];

// ============================================
// TASK IMPLEMENTATIONS
// ============================================

async function cleanupExpiredReservations(): Promise<TaskResult> {
    const { data, error } = await (supabase as any)
        .from('resource_reservations')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString())
        .select();

    return {
        success: !error,
        processed: data?.length || 0,
        errors: error ? 1 : 0
    };
}

async function processPendingPayments(): Promise<TaskResult> {
    // Auto-verify payments that are older than 24h
    // In production, would check with bank API
    const oneDayAgo = new Date(Date.now() - 24 * 3600000).toISOString();

    const { data } = await supabase
        .from('pending_payments')
        .select('*')
        .eq('status', 'pending')
        .lt('created_at', oneDayAgo);

    // Log for admin attention
    if (data && data.length > 0) {
        await (supabase as any).from('admin_alerts').insert({
            type: 'PENDING_PAYMENTS',
            reason: `${data.length} төлбөр 24+ цаг хүлээж байна`,
            severity: 'medium'
        });
    }

    return {
        success: true,
        processed: data?.length || 0,
        errors: 0
    };
}

async function sendScheduledNotifications(): Promise<TaskResult> {
    const now = new Date().toISOString();

    const { data: notifications } = await (supabase as any)
        .from('scheduled_notifications')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', now);

    let processed = 0;
    let errors = 0;

    for (const notif of notifications || []) {
        try {
            // Create actual notification
            await (supabase as any).from('notifications').insert({
                user_id: notif.user_id,
                type: notif.notification_type,
                title: 'Мэдэгдэл',
                message: notif.message_template
            });

            // Mark as sent
            await (supabase as any)
                .from('scheduled_notifications')
                .update({ status: 'sent', sent_at: now })
                .eq('id', notif.id);

            processed++;
        } catch {
            errors++;
        }
    }

    return { success: true, processed, errors };
}

async function updateEngagementScores(): Promise<TaskResult> {
    // Simple engagement score: views + likes*2 + shares*3
    // With time decay
    const { data: products } = await supabase
        .from('products')
        .select('id, views, likes, shares, created_at')
        .eq('status', 'active');

    let processed = 0;

    for (const p of (products as any[]) || []) {
        const ageHours = (Date.now() - new Date(p.created_at).getTime()) / 3600000;
        const timeDecay = Math.max(0.2, 1 - ageHours / 1000);

        const rawScore = (p.views || 0) + (p.likes || 0) * 2 + (p.shares || 0) * 3;
        const score = rawScore * timeDecay;

        await supabase
            .from('products')
            .update({ engagement_score: Math.round(score * 100) / 100 })
            .eq('id', p.id);

        processed++;
    }

    return { success: true, processed, errors: 0 };
}

async function autoExpireListings(): Promise<TaskResult> {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600000).toISOString();

    const { data, error } = await (supabase as any)
        .from('products')
        .update({
            status: 'expired',
            expired_at: new Date().toISOString(),
            expiry_reason: 'auto_14_days'
        })
        .eq('status', 'active')
        .lt('last_renewed_at', fourteenDaysAgo)
        .select();

    return {
        success: !error,
        processed: data?.length || 0,
        errors: error ? 1 : 0
    };
}

async function sendExpiryReminders(): Promise<TaskResult> {
    // Find listings expiring in 2 days
    const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 3600000);
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 3600000);

    const expiryThreshold = new Date(Date.now() - 12 * 24 * 3600000).toISOString();

    const { data: expiringProducts } = await supabase
        .from('products')
        .select('id, title, seller_id')
        .eq('status', 'active')
        .lt('last_renewed_at', expiryThreshold)
        .is('expiry_reminder_sent', null);

    let processed = 0;

    for (const p of (expiringProducts as any[]) || []) {
        await (supabase as any).from('notifications').insert({
            user_id: p.seller_id,
            type: 'expiry_warning',
            title: '⏰ Зарын хугацаа дуусах гэж байна',
            message: `"${p.title}" зарын хугацаа 2 хоногийн дараа дуусна. Сунгах уу?`,
            product_id: p.id
        });

        await (supabase as any)
            .from('products')
            .update({ expiry_reminder_sent: new Date().toISOString() })
            .eq('id', p.id);

        processed++;
    }

    return { success: true, processed, errors: 0 };
}

async function cleanupOrphanedFiles(): Promise<TaskResult> {
    // This would be implemented with R2 API
    // For now, just log
    return { success: true, processed: 0, errors: 0, details: 'Placeholder' };
}

async function generateDailyStats(): Promise<TaskResult> {
    const today = new Date().toISOString().split('T')[0];

    const [users, products, transactions] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('products').select('*', { count: 'exact' }).eq('status', 'active'),
        supabase.from('verified_transactions').select('*', { count: 'exact' })
    ]);

    await (supabase as any).from('daily_stats').upsert({
        date: today,
        total_users: users.count || 0,
        active_products: products.count || 0,
        total_transactions: transactions.count || 0,
        created_at: new Date().toISOString()
    });

    return { success: true, processed: 1, errors: 0 };
}

async function autoApproveStaleModeration(): Promise<TaskResult> {
    const oneDayAgo = new Date(Date.now() - 24 * 3600000).toISOString();

    const { data, error } = await (supabase as any)
        .from('moderation_queue')
        .update({
            status: 'approved',
            review_notes: 'Auto-approved after 24h'
        })
        .eq('status', 'pending')
        .lt('created_at', oneDayAgo)
        .select();

    return {
        success: !error,
        processed: data?.length || 0,
        errors: error ? 1 : 0
    };
}

async function createWeeklyBackup(): Promise<TaskResult> {
    // Would integrate with vendorEscape.ts
    return { success: true, processed: 1, errors: 0, details: 'See vendorEscape.ts' };
}

async function cleanupOldLogs(): Promise<TaskResult> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000).toISOString();

    const { data: deleted } = await (supabase as any)
        .from('compliance_logs')
        .delete()
        .lt('timestamp', thirtyDaysAgo)
        .select();

    return {
        success: true,
        processed: deleted?.length || 0,
        errors: 0
    };
}

async function generateWeeklyReport(): Promise<TaskResult> {
    // Generate report and send to admin
    const { data: stats } = await (supabase as any)
        .from('daily_stats')
        .select('*')
        .gte('date', new Date(Date.now() - 7 * 24 * 3600000).toISOString().split('T')[0])
        .order('date', { ascending: true });

    // Create admin notification with summary
    const summary = ((stats as any[]) || []).reduce((acc: any, s: any) => ({
        users: s.total_users,
        products: s.active_products,
        transactions: acc.transactions + 1
    }), { users: 0, products: 0, transactions: 0 });

    await (supabase as any).from('admin_alerts').insert({
        type: 'WEEKLY_REPORT',
        reason: `Долоо хоногийн тайлан: ${summary?.users} хэрэглэгч, ${summary?.products} зар`,
        severity: 'low'
    });

    return { success: true, processed: 1, errors: 0 };
}

// ============================================
// CRON JOB RUNNER
// ============================================

/**
 * Run all tasks for a given frequency
 */
export async function runAutomatedTasks(
    frequency: 'every_minute' | 'hourly' | 'daily' | 'weekly'
): Promise<{ total: number; success: number; failed: number }> {
    const tasks = AUTOMATED_TASKS.filter(t => t.frequency === frequency && t.enabled);

    let success = 0;
    let failed = 0;

    for (const task of tasks) {
        try {
            const result = await task.handler();
            if (result.success) {
                success++;
            } else {
                failed++;
            }
            console.log(`[Autopilot] ${task.name}: ${result.processed} processed, ${result.errors} errors`);
        } catch (error) {
            failed++;
            console.error(`[Autopilot] ${task.name} failed:`, error);
        }
    }

    return { total: tasks.length, success, failed };
}

/**
 * Get autopilot status for admin dashboard
 */
export function getAutopilotStatus(): {
    tasks: { name: string; frequency: string; enabled: boolean }[];
    nextRuns: Record<string, Date>;
} {
    return {
        tasks: AUTOMATED_TASKS.map(t => ({
            name: t.name,
            frequency: t.frequency,
            enabled: t.enabled
        })),
        nextRuns: {
            every_minute: new Date(Date.now() + 60000),
            hourly: new Date(Date.now() + 3600000),
            daily: new Date(new Date().setHours(24, 0, 0, 0)),
            weekly: new Date(Date.now() + 7 * 24 * 3600000)
        }
    };
}
