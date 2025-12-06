/**
 * COMMUNITY MODERATION SYSTEM
 * 
 * Problem: Founder can't check every listing forever.
 *          When founder gets tired, spam takes over.
 * Solution: Empower trusted users as volunteer moderators.
 */

import { supabase } from './supabase';

// Moderator levels
export type ModeratorLevel = 'community' | 'soum' | 'aimag' | 'national';

interface Moderator {
    userId: string;
    level: ModeratorLevel;
    aimag?: string;
    soum?: string;
    appointedAt: string;
    appointedBy: string;
    isActive: boolean;
    stats: {
        reportsReviewed: number;
        listingsRemoved: number;
        warningsIssued: number;
    };
}

// Moderator permissions by level
const MODERATOR_PERMISSIONS: Record<ModeratorLevel, string[]> = {
    community: ['review_reports', 'flag_listings'],
    soum: ['review_reports', 'flag_listings', 'hide_listings', 'warn_users'],
    aimag: ['review_reports', 'flag_listings', 'hide_listings', 'warn_users', 'remove_listings'],
    national: ['review_reports', 'flag_listings', 'hide_listings', 'warn_users', 'remove_listings', 'ban_users']
};

/**
 * Check if user has moderator permission
 */
export async function hasModeratorPermission(
    userId: string,
    permission: string,
    targetLocation?: { aimag: string; soum: string }
): Promise<boolean> {
    const { data: mod } = await supabase
        .from('moderators')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (!mod) return false;

    // Check level permissions
    const permissions = MODERATOR_PERMISSIONS[mod.level as ModeratorLevel] || [];
    if (!permissions.includes(permission)) return false;

    // Check location scope for soum/aimag moderators
    if (mod.level === 'soum' && targetLocation) {
        if (mod.soum !== targetLocation.soum || mod.aimag !== targetLocation.aimag) {
            return false;
        }
    }
    if (mod.level === 'aimag' && targetLocation) {
        if (mod.aimag !== targetLocation.aimag) {
            return false;
        }
    }

    return true;
}

/**
 * Appoint a new moderator
 */
export async function appointModerator(
    userId: string,
    level: ModeratorLevel,
    appointedBy: string,
    location?: { aimag: string; soum?: string }
): Promise<{ success: boolean; message: string }> {
    // Check if appointer has permission
    const canAppoint = await hasModeratorPermission(appointedBy, 'appoint_moderators');

    // For now, only admins can appoint (checked via profiles.role)
    const { data: appointer } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', appointedBy)
        .single();

    if (appointer?.role !== 'admin' && appointer?.role !== 'super_admin') {
        return { success: false, message: 'Зөвхөн админ модератор томилох эрхтэй' };
    }

    // Create moderator record
    const { error } = await supabase.from('moderators').upsert({
        user_id: userId,
        level: level,
        aimag: location?.aimag,
        soum: location?.soum,
        appointed_by: appointedBy,
        appointed_at: new Date().toISOString(),
        is_active: true,
        reports_reviewed: 0,
        listings_removed: 0,
        warnings_issued: 0
    });

    if (error) {
        return { success: false, message: 'Алдаа гарлаа' };
    }

    // Update user's profile role
    await supabase
        .from('profiles')
        .update({ role: 'moderator' })
        .eq('id', userId);

    // Grant free VIP (reward)
    await grantModeratorReward(userId);

    return { success: true, message: 'Модератор амжилттай томилогдлоо!' };
}

/**
 * Grant moderator rewards (free VIP)
 */
async function grantModeratorReward(userId: string): Promise<void> {
    // Grant 1 month free VIP for their listings
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await supabase.from('moderator_rewards').insert({
        user_id: userId,
        reward_type: 'free_vip',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
    });
}

/**
 * Moderator action: Review a report
 */
export async function moderatorReviewReport(
    moderatorId: string,
    reportId: string,
    decision: 'approve' | 'reject',
    notes?: string
): Promise<{ success: boolean; message: string }> {
    // Get report details
    const { data: report } = await supabase
        .from('reports')
        .select('*, products(location_aimag, location_soum)')
        .eq('id', reportId)
        .single();

    if (!report) {
        return { success: false, message: 'Мэдэгдэл олдсонгүй' };
    }

    // Check permission
    const hasPermission = await hasModeratorPermission(
        moderatorId,
        'review_reports',
        {
            aimag: (report.products as any)?.location_aimag,
            soum: (report.products as any)?.location_soum
        }
    );

    if (!hasPermission) {
        return { success: false, message: 'Энэ мэдэгдлийг шалгах эрхгүй' };
    }

    // Update report
    await supabase
        .from('reports')
        .update({
            status: decision === 'approve' ? 'resolved' : 'dismissed',
            reviewed_by: moderatorId,
            reviewed_at: new Date().toISOString(),
            review_notes: notes
        })
        .eq('id', reportId);

    // If approved, hide the listing
    if (decision === 'approve') {
        await supabase
            .from('products')
            .update({
                status: 'hidden',
                hidden_reason: 'moderator_action',
                hidden_at: new Date().toISOString()
            })
            .eq('id', report.product_id);
    }

    // Update moderator stats
    await supabase.rpc('increment_moderator_stat', {
        p_user_id: moderatorId,
        p_stat: 'reports_reviewed'
    });

    return { success: true, message: 'Шийдвэр амжилттай!' };
}

/**
 * Moderator action: Issue warning to user
 */
export async function issueWarning(
    moderatorId: string,
    targetUserId: string,
    reason: string,
    productId?: string
): Promise<{ success: boolean; message: string }> {
    const hasPermission = await hasModeratorPermission(moderatorId, 'warn_users');

    if (!hasPermission) {
        return { success: false, message: 'Сануулга илгээх эрхгүй' };
    }

    // Create warning record
    await supabase.from('user_warnings').insert({
        user_id: targetUserId,
        issued_by: moderatorId,
        reason: reason,
        product_id: productId,
        created_at: new Date().toISOString()
    });

    // Send notification to user
    await supabase.from('notifications').insert({
        user_id: targetUserId,
        type: 'warning',
        title: '⚠️ Сануулга',
        message: reason
    });

    // Update moderator stats
    await supabase.rpc('increment_moderator_stat', {
        p_user_id: moderatorId,
        p_stat: 'warnings_issued'
    });

    // Check if user has too many warnings (auto-ban after 3)
    const { count } = await supabase
        .from('user_warnings')
        .select('*', { count: 'exact' })
        .eq('user_id', targetUserId);

    if ((count || 0) >= 3) {
        await supabase
            .from('profiles')
            .update({ is_banned: true })
            .eq('id', targetUserId);
    }

    return { success: true, message: 'Сануулга илгээгдлээ' };
}

/**
 * Get moderator leaderboard (for gamification)
 */
export async function getModeratorLeaderboard(): Promise<Array<{
    userId: string;
    name: string;
    level: ModeratorLevel;
    location: string;
    stats: { reviewed: number; removed: number; warnings: number };
}>> {
    const { data } = await supabase
        .from('moderators')
        .select('*, profiles(name)')
        .eq('is_active', true)
        .order('reports_reviewed', { ascending: false })
        .limit(20);

    return (data || []).map(m => ({
        userId: m.user_id,
        name: (m.profiles as any)?.name || 'Модератор',
        level: m.level,
        location: m.soum ? `${m.aimag}, ${m.soum}` : (m.aimag || 'Үндэсний'),
        stats: {
            reviewed: m.reports_reviewed,
            removed: m.listings_removed,
            warnings: m.warnings_issued
        }
    }));
}

/**
 * Find potential moderator candidates
 * Users who have been active, helpful, and have good ratings
 */
export async function findModeratorCandidates(
    aimag: string,
    soum?: string
): Promise<Array<{
    userId: string;
    name: string;
    qualifications: string[];
}>> {
    // Get active users from this location with good ratings
    let query = supabase
        .from('profiles')
        .select('id, name, average_rating, total_reviews, created_at')
        .eq('location_aimag', aimag)
        .gte('average_rating', 4)
        .gte('total_reviews', 5);

    if (soum) {
        query = query.eq('location_soum', soum);
    }

    const { data: users } = await query.limit(10);

    return (users || []).map(u => {
        const qualifications: string[] = [];
        if (u.average_rating >= 4.5) qualifications.push('Өндөр үнэлгээтэй');
        if (u.total_reviews >= 10) qualifications.push('Туршлагатай');

        const accountAge = (Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (accountAge >= 90) qualifications.push('Удаан хугацааны хэрэглэгч');

        return {
            userId: u.id,
            name: u.name,
            qualifications
        };
    });
}
