-- ARCHETYPE LEVEL MIGRATION

-- Treasure views (for daily treasure feature)
CREATE TABLE IF NOT EXISTS treasure_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    product_data JSONB,
    view_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, view_date)
);

-- Community announcements
CREATE TABLE IF NOT EXISTS community_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    target_user_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE treasure_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_announcements ENABLE ROW LEVEL SECURITY;

-- Users can view own treasures
DROP POLICY IF EXISTS "Users view own treasures" ON treasure_views;
CREATE POLICY "Users view own treasures" ON treasure_views FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add treasures" ON treasure_views;
CREATE POLICY "Users can add treasures" ON treasure_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can read announcements
DROP POLICY IF EXISTS "Anyone can read announcements" ON community_announcements;
CREATE POLICY "Anyone can read announcements" ON community_announcements FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_treasure_views_date ON treasure_views(user_id, view_date);

SELECT 'Archetype Level migration completed!' as result;
