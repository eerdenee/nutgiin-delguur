-- CHAOS ENGINEERING MIGRATION

-- System Status (for DEFCON switch)
CREATE TABLE IF NOT EXISTS system_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode TEXT NOT NULL DEFAULT 'normal',
    message TEXT,
    message_en TEXT,
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    enabled_by UUID,
    scheduled_end TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pending Payments (for circuit breaker fallback)
CREATE TABLE IF NOT EXISTS pending_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    reference TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;

-- Anyone can read system status
DROP POLICY IF EXISTS "Anyone can read system status" ON system_status;
CREATE POLICY "Anyone can read system status" ON system_status FOR SELECT USING (true);

-- Only admins can modify system status
DROP POLICY IF EXISTS "Admins can modify system status" ON system_status;
CREATE POLICY "Admins can modify system status" ON system_status 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Users can view own pending payments
DROP POLICY IF EXISTS "Users view own pending payments" ON pending_payments;
CREATE POLICY "Users view own pending payments" ON pending_payments 
    FOR SELECT USING (auth.uid() = user_id);

-- System can create pending payments
DROP POLICY IF EXISTS "System can create pending payments" ON pending_payments;
CREATE POLICY "System can create pending payments" ON pending_payments 
    FOR INSERT WITH CHECK (true);

-- Index for checking active status
CREATE INDEX IF NOT EXISTS idx_system_status_active ON system_status(is_active, created_at DESC);

SELECT 'Chaos Engineering migration completed!' as result;
