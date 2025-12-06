/**
 * Interaction Logging System
 * 
 * Problem: Criminals meet on your platform but do deals on WhatsApp.
 *          Police ask: "Did they meet through your site?" You have no proof.
 * Solution: Log all significant interactions (who viewed whose contact info).
 */

import { supabase } from './supabase';
import { redactString } from './piiRedaction';

export type InteractionType =
    | 'view_phone'      // User clicked to see seller's phone
    | 'view_product'    // User viewed product details
    | 'start_chat'      // User initiated in-app chat
    | 'copy_bank'       // User copied bank account
    | 'report_product'  // User reported a product
    | 'contact_seller'  // User clicked "Call" button
    | 'save_favorite'   // User saved product to favorites
    | 'share_product';  // User shared product externally

interface InteractionLog {
    actorUserId: string | null;  // Who performed the action (null = anonymous)
    targetUserId: string | null; // Whose info was accessed
    productId: string | null;
    interactionType: InteractionType;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log a user interaction (for legal compliance)
 */
export async function logInteraction(interaction: InteractionLog): Promise<void> {
    try {
        // Redact any PII in metadata before logging
        const safeMetadata = interaction.metadata
            ? JSON.parse(redactString(JSON.stringify(interaction.metadata)))
            : null;

        await supabase.from('interaction_logs').insert({
            actor_user_id: interaction.actorUserId,
            target_user_id: interaction.targetUserId,
            product_id: interaction.productId,
            interaction_type: interaction.interactionType,
            metadata: safeMetadata,
            ip_hash: interaction.ipAddress ? hashIP(interaction.ipAddress) : null,
            user_agent_hash: interaction.userAgent ? hashString(interaction.userAgent) : null,
            created_at: new Date().toISOString()
        });
    } catch (err) {
        // Silent fail - don't break user experience for logging
        if (process.env.NODE_ENV === 'development') {
            console.error('Failed to log interaction:', err);
        }
    }
}

/**
 * Log when user views another user's phone number
 * This is the most critical interaction for law enforcement
 */
export async function logPhoneView(
    viewerUserId: string | null,
    sellerUserId: string,
    productId: string,
    ipAddress?: string
): Promise<void> {
    await logInteraction({
        actorUserId: viewerUserId,
        targetUserId: sellerUserId,
        productId: productId,
        interactionType: 'view_phone',
        metadata: {
            timestamp: new Date().toISOString(),
            source: 'product_detail'
        },
        ipAddress
    });
}

/**
 * Log when user initiates contact (call button)
 */
export async function logContactAttempt(
    viewerUserId: string | null,
    sellerUserId: string,
    productId: string,
    contactMethod: 'call' | 'chat',
    ipAddress?: string
): Promise<void> {
    await logInteraction({
        actorUserId: viewerUserId,
        targetUserId: sellerUserId,
        productId: productId,
        interactionType: contactMethod === 'call' ? 'contact_seller' : 'start_chat',
        metadata: {
            method: contactMethod,
            timestamp: new Date().toISOString()
        },
        ipAddress
    });
}

/**
 * Get interaction history for a specific user (for law enforcement requests)
 * Returns anonymized data suitable for official requests
 */
export async function getInteractionHistory(
    userId: string,
    options: {
        startDate?: string;
        endDate?: string;
        type?: InteractionType;
        limit?: number;
    } = {}
): Promise<{
    interactions: Array<{
        type: string;
        timestamp: string;
        relatedProductId: string | null;
        direction: 'outgoing' | 'incoming';
    }>;
    summary: {
        totalOutgoing: number;
        totalIncoming: number;
        uniqueContacts: number;
    };
}> {
    const { startDate, endDate, type, limit = 100 } = options;

    // Get outgoing interactions (user as actor)
    let outgoingQuery = supabase
        .from('interaction_logs')
        .select('*')
        .eq('actor_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (startDate) outgoingQuery = outgoingQuery.gte('created_at', startDate);
    if (endDate) outgoingQuery = outgoingQuery.lte('created_at', endDate);
    if (type) outgoingQuery = outgoingQuery.eq('interaction_type', type);

    const { data: outgoing } = await outgoingQuery;

    // Get incoming interactions (user as target)
    let incomingQuery = supabase
        .from('interaction_logs')
        .select('*')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (startDate) incomingQuery = incomingQuery.gte('created_at', startDate);
    if (endDate) incomingQuery = incomingQuery.lte('created_at', endDate);
    if (type) incomingQuery = incomingQuery.eq('interaction_type', type);

    const { data: incoming } = await incomingQuery;

    // Format for official response
    const interactions = [
        ...(outgoing || []).map(i => ({
            type: i.interaction_type,
            timestamp: i.created_at,
            relatedProductId: i.product_id,
            direction: 'outgoing' as const
        })),
        ...(incoming || []).map(i => ({
            type: i.interaction_type,
            timestamp: i.created_at,
            relatedProductId: i.product_id,
            direction: 'incoming' as const
        }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate unique contacts
    const outgoingTargets = new Set((outgoing || []).map(i => i.target_user_id));
    const incomingActors = new Set((incoming || []).map(i => i.actor_user_id));
    const uniqueContacts = new Set([...outgoingTargets, ...incomingActors]);

    return {
        interactions,
        summary: {
            totalOutgoing: outgoing?.length || 0,
            totalIncoming: incoming?.length || 0,
            uniqueContacts: uniqueContacts.size
        }
    };
}

/**
 * Generate official report for law enforcement
 */
export async function generateLawEnforcementReport(
    requestedUserId: string,
    requestDetails: {
        requestingAgency: string;
        caseNumber: string;
        officerName: string;
        dateRange: { start: string; end: string };
    }
): Promise<{
    reportId: string;
    generatedAt: string;
    userData: any;
    interactionHistory: any;
    disclaimer: string;
}> {
    // Get user profile (redacted)
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, created_at, role, is_verified')
        .eq('id', requestedUserId)
        .single();

    // Get interaction history
    const history = await getInteractionHistory(requestedUserId, {
        startDate: requestDetails.dateRange.start,
        endDate: requestDetails.dateRange.end
    });

    // Log that this report was generated
    await supabase.from('law_enforcement_requests').insert({
        requested_user_id: requestedUserId,
        requesting_agency: requestDetails.requestingAgency,
        case_number: requestDetails.caseNumber,
        officer_name: requestDetails.officerName,
        date_range_start: requestDetails.dateRange.start,
        date_range_end: requestDetails.dateRange.end,
        generated_at: new Date().toISOString()
    });

    return {
        reportId: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
        userData: {
            userId: profile?.id,
            accountCreated: profile?.created_at,
            accountType: profile?.role,
            isVerified: profile?.is_verified
        },
        interactionHistory: history,
        disclaimer: `
            This report was generated in response to an official law enforcement request.
            It contains interaction metadata only - we do not store external communication content.
            This data is provided under Mongolian law and our Terms of Service.
            Report generated by: Nutgiin Delguur Platform
        `.trim()
    };
}

/**
 * Hash IP address for privacy (one-way hash)
 */
function hashIP(ip: string): string {
    return hashString(ip + process.env.IP_HASH_SALT || 'default-salt');
}

/**
 * Simple hash function
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
