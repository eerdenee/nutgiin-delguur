-- SIMULATION LEVEL MIGRATION

-- User Activity (for real DAU tracking)
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    connections_made INTEGER DEFAULT 0,
    listings_posted INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connection Logs (the NORTH STAR metric)
CREATE TABLE IF NOT EXISTS connection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id UUID,
    seller_id UUID NOT NULL,
    product_id UUID NOT NULL,
    connection_type TEXT NOT NULL,  -- 'call', 'message', 'copy_phone'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Webhooks (for verification)
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    payload JSONB,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Internal Ledger (our records)
CREATE TABLE IF NOT EXISTS internal_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    bank_confirmed BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Ledger (all events)
CREATE TABLE IF NOT EXISTS payment_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Human Visits (bot-filtered)
CREATE TABLE IF NOT EXISTS human_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id TEXT NOT NULL,
    confidence INTEGER DEFAULT 0,
    signals TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_visits ENABLE ROW LEVEL SECURITY;

-- Users can view own activity
DROP POLICY IF EXISTS "Users view own activity" ON user_activity;
CREATE POLICY "Users view own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);

-- System can log connections
DROP POLICY IF EXISTS "System can log connections" ON connection_logs;
CREATE POLICY "System can log connections" ON connection_logs FOR INSERT WITH CHECK (true);

-- System can log visits
DROP POLICY IF EXISTS "System can log visits" ON human_visits;
CREATE POLICY "System can log visits" ON human_visits FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connection_logs_date ON connection_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_connection_logs_seller ON connection_logs(seller_id);
CREATE INDEX IF NOT EXISTS idx_human_visits_date ON human_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_last ON user_activity(last_active DESC);

-- Function to update user activity
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_activity (user_id, last_active)
    VALUES (NEW.viewer_id, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        last_active = NOW(),
        connections_made = user_activity.connections_made + 1,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger to auto-update activity on connection
DROP TRIGGER IF EXISTS trigger_update_activity ON connection_logs;
CREATE TRIGGER trigger_update_activity
    AFTER INSERT ON connection_logs
    FOR EACH ROW
    WHEN (NEW.viewer_id IS NOT NULL)
    EXECUTE FUNCTION update_user_activity();

SELECT 'Simulation Level migration completed!' as result;
