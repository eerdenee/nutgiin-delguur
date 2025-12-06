-- DARK MATTER Level Migration: Legal Compliance & Logging
-- Date: 2025-12-07

-- 1. Interaction Logs Table (For Law Enforcement Compliance)
CREATE TABLE IF NOT EXISTS interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID, -- Who performed the action (nullable for anonymous)
    target_user_id UUID, -- Whose info was accessed
    product_id UUID,
    interaction_type TEXT NOT NULL,
    metadata JSONB,
    ip_hash TEXT, -- Hashed for privacy
    user_agent_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Law Enforcement Requests Log (Audit trail)
CREATE TABLE IF NOT EXISTS law_enforcement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_user_id UUID NOT NULL,
    requesting_agency TEXT NOT NULL,
    case_number TEXT,
    officer_name TEXT,
    date_range_start TIMESTAMPTZ,
    date_range_end TIMESTAMPTZ,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Admin who processed the request
    processed_by UUID,
    notes TEXT
);

-- 3. Row Level Security
ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_enforcement_requests ENABLE ROW LEVEL SECURITY;

-- Only admins can access interaction logs
CREATE POLICY "Admins can view interaction logs" ON interaction_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- System can insert interaction logs
CREATE POLICY "System can insert interaction logs" ON interaction_logs
    FOR INSERT WITH CHECK (true);

-- Only super admins can access law enforcement requests
CREATE POLICY "Super admins can manage law enforcement requests" ON law_enforcement_requests
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 4. Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_interaction_logs_actor ON interaction_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_target ON interaction_logs(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_product ON interaction_logs(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_type ON interaction_logs(interaction_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_date ON interaction_logs(created_at DESC);

-- 5. Auto-cleanup old interaction logs (keep 2 years for legal compliance)
-- This should be a cron job, not a trigger
COMMENT ON TABLE interaction_logs IS 'Interaction logs are retained for 2 years per legal requirements. Cleanup via cron job.';

-- 6. Privacy-preserving view for general analytics (no PII exposed)
CREATE OR REPLACE VIEW interaction_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) AS date,
    interaction_type,
    COUNT(*) AS count
FROM interaction_logs
GROUP BY DATE_TRUNC('day', created_at), interaction_type
ORDER BY date DESC;

-- Grant read access on analytics view
GRANT SELECT ON interaction_analytics TO authenticated;
