-- CONSCIOUSNESS LEVEL MIGRATION

-- Crisis Mode table
CREATE TABLE IF NOT EXISTS crisis_mode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    affected_aimags TEXT[] DEFAULT '{}',
    message TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    activated_by UUID,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE crisis_mode ENABLE ROW LEVEL SECURITY;

-- Anyone can read crisis mode
DROP POLICY IF EXISTS "Anyone can read crisis mode" ON crisis_mode;
CREATE POLICY "Anyone can read crisis mode" ON crisis_mode FOR SELECT USING (true);

-- Only admins can modify
DROP POLICY IF EXISTS "Admins can modify crisis mode" ON crisis_mode;
CREATE POLICY "Admins can modify crisis mode" ON crisis_mode 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Index for active crisis
CREATE INDEX IF NOT EXISTS idx_crisis_mode_active 
    ON crisis_mode(active, created_at DESC) 
    WHERE active = true;

SELECT 'Consciousness Level migration completed!' as result;
