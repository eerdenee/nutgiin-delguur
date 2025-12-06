/**
 * DEFCON SWITCH - PR Crisis Management
 * 
 * Problem: Trolls post fake illegal listings, screenshot, and share.
 *          Media attacks. Site reputation destroyed.
 * Solution: Emergency "Read-Only Mode" - disable new posts but keep site running.
 */

import { supabase } from './supabase';

// System modes
export type SystemMode = 'normal' | 'read_only' | 'maintenance' | 'lockdown';

interface SystemStatus {
    mode: SystemMode;
    message?: string;
    messageEn?: string;
    enabledAt: string;
    enabledBy: string;
    scheduledEnd?: string;
}

// In-memory cache (refresh every minute)
let cachedStatus: SystemStatus | null = null;
let lastFetch: number = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Get current system status
 */
export async function getSystemStatus(forceRefresh: boolean = false): Promise<SystemStatus> {
    const now = Date.now();

    if (!forceRefresh && cachedStatus && (now - lastFetch) < CACHE_TTL) {
        return cachedStatus;
    }

    const { data } = await supabase
        .from('system_status')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!data) {
        cachedStatus = {
            mode: 'normal',
            enabledAt: new Date().toISOString(),
            enabledBy: 'system'
        };
    } else {
        cachedStatus = {
            mode: data.mode,
            message: data.message,
            messageEn: data.message_en,
            enabledAt: data.enabled_at,
            enabledBy: data.enabled_by,
            scheduledEnd: data.scheduled_end
        };
    }

    lastFetch = now;
    return cachedStatus;
}

/**
 * Check if action is allowed in current mode
 */
export async function isActionAllowed(
    action: 'post' | 'edit' | 'delete' | 'comment' | 'register' | 'login' | 'view'
): Promise<{ allowed: boolean; reason?: string }> {
    const status = await getSystemStatus();

    switch (status.mode) {
        case 'normal':
            return { allowed: true };

        case 'read_only':
            // Only viewing allowed
            if (['view', 'login'].includes(action)) {
                return { allowed: true };
            }
            return {
                allowed: false,
                reason: status.message || 'Систем хязгаарласан горимд байна. Зөвхөн харах боломжтой.'
            };

        case 'maintenance':
            // Only admin actions allowed
            if (action === 'view') {
                return { allowed: true };
            }
            return {
                allowed: false,
                reason: status.message || 'Техникийн засвар хийгдэж байна. Түр хүлээнэ үү.'
            };

        case 'lockdown':
            // Nothing allowed except viewing
            if (action === 'view') {
                return { allowed: true };
            }
            return {
                allowed: false,
                reason: status.message || 'Систем түр зогссон байна.'
            };

        default:
            return { allowed: true };
    }
}

/**
 * Set system mode (Admin only)
 */
export async function setSystemMode(
    mode: SystemMode,
    adminId: string,
    options: {
        message?: string;
        messageEn?: string;
        durationHours?: number;
    } = {}
): Promise<{ success: boolean; message: string }> {
    // Verify admin
    const { data: admin } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', adminId)
        .single();

    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
        return { success: false, message: 'Зөвхөн админ горим өөрчлөх эрхтэй' };
    }

    // Deactivate current status
    await supabase
        .from('system_status')
        .update({ is_active: false })
        .eq('is_active', true);

    // Set new status
    const scheduledEnd = options.durationHours
        ? new Date(Date.now() + options.durationHours * 3600000).toISOString()
        : null;

    await supabase.from('system_status').insert({
        mode,
        message: options.message,
        message_en: options.messageEn,
        enabled_at: new Date().toISOString(),
        enabled_by: adminId,
        scheduled_end: scheduledEnd,
        is_active: true
    });

    // Clear cache
    cachedStatus = null;
    lastFetch = 0;

    // Log the action
    await supabase.from('admin_alerts').insert({
        type: 'SYSTEM_MODE_CHANGE',
        reason: `System mode changed to ${mode}`,
        severity: mode === 'lockdown' ? 'critical' : 'high'
    });

    return {
        success: true,
        message: `Систем ${mode} горимд шилжлээ`
    };
}

/**
 * Pre-defined emergency modes
 */
export const EMERGENCY_PRESETS = {
    prCrisis: {
        mode: 'read_only' as SystemMode,
        message: 'Бид системийн сайжруулалт хийж байгаа тул шинэ зар нийтлэхийг түр зогсоолоо. Хуучин зарууд хэвийн харагдана.',
        messageEn: 'We are improving our system. Posting new listings is temporarily disabled.',
        durationHours: 24
    },
    spamAttack: {
        mode: 'read_only' as SystemMode,
        message: 'Платформ аюулгүй байдлыг хангах зорилгоор шинэ бүртгэл, зар нэмэхийг түр хязгаарлав.',
        durationHours: 6
    },
    maintenance: {
        mode: 'maintenance' as SystemMode,
        message: 'Техникийн засвар хийгдэж байна. 30 минутын дараа дахин оролдоно уу.',
        durationHours: 1
    },
    ddosAttack: {
        mode: 'lockdown' as SystemMode,
        message: 'Систем түр зогссон байна. Удахгүй сэргээнэ.',
        durationHours: 2
    }
};

/**
 * Activate emergency preset
 */
export async function activateEmergencyPreset(
    preset: keyof typeof EMERGENCY_PRESETS,
    adminId: string
): Promise<{ success: boolean; message: string }> {
    const config = EMERGENCY_PRESETS[preset];
    return setSystemMode(config.mode, adminId, config);
}

/**
 * Return to normal mode
 */
export async function returnToNormal(adminId: string): Promise<{ success: boolean }> {
    const result = await setSystemMode('normal', adminId, {
        message: 'Систем хэвийн ажиллаж байна'
    });
    return { success: result.success };
}

/**
 * Get banner for UI display
 */
export async function getSystemBanner(): Promise<{
    show: boolean;
    type: 'info' | 'warning' | 'error';
    message: string;
} | null> {
    const status = await getSystemStatus();

    if (status.mode === 'normal') return null;

    return {
        show: true,
        type: status.mode === 'lockdown' ? 'error' :
            status.mode === 'maintenance' ? 'warning' : 'info',
        message: status.message || 'Систем хязгаарласан горимд байна'
    };
}
