-- ENTROPY MITIGATION MIGRATION
-- Community moderation and algorithmic features

-- Moderators table
CREATE TABLE IF NOT EXISTS moderators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    level TEXT NOT NULL DEFAULT 'community',
    aimag TEXT,
    soum TEXT,
    appointed_by UUID,
    appointed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    reports_reviewed INTEGER DEFAULT 0,
    listings_removed INTEGER DEFAULT 0,
    warnings_issued INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderator rewards
CREATE TABLE IF NOT EXISTS moderator_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reward_type TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User warnings
CREATE TABLE IF NOT EXISTS user_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    issued_by UUID NOT NULL,
    reason TEXT NOT NULL,
    product_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Increment moderator stat function
CREATE OR REPLACE FUNCTION increment_moderator_stat(
    p_user_id UUID,
    p_stat TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_stat = 'reports_reviewed' THEN
        UPDATE moderators SET reports_reviewed = reports_reviewed + 1 WHERE user_id = p_user_id;
    ELSIF p_stat = 'listings_removed' THEN
        UPDATE moderators SET listings_removed = listings_removed + 1 WHERE user_id = p_user_id;
    ELSIF p_stat = 'warnings_issued' THEN
        UPDATE moderators SET warnings_issued = warnings_issued + 1 WHERE user_id = p_user_id;
    END IF;
END;
$$;

-- RLS
ALTER TABLE moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderator_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view moderators" ON moderators;
CREATE POLICY "Anyone can view moderators" ON moderators FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own rewards" ON moderator_rewards;
CREATE POLICY "Users view own rewards" ON moderator_rewards FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own warnings" ON user_warnings;
CREATE POLICY "Users view own warnings" ON user_warnings FOR SELECT USING (auth.uid() = user_id);

SELECT 'Entropy mitigation migration completed!' as result;
