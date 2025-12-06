-- ============================================
-- НУТГИЙН ДЭЛГҮҮР - НЭГДСЭН MIGRATION
-- All levels combined: String → Ethereal
-- Created: 2025-12-07
-- ============================================

-- ============================================
-- 01. STRING RESONANCE (Quality, Soum, Vibe)
-- ============================================

CREATE TABLE IF NOT EXISTS seller_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endorser_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    is_same_location BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(endorser_id, seller_id)
);

CREATE TABLE IF NOT EXISTS product_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    asker_id UUID NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    status TEXT DEFAULT 'pending',
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 02. ENTROPY MITIGATION (Moderation)
-- ============================================

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

CREATE TABLE IF NOT EXISTS moderator_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reward_type TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    issued_by UUID NOT NULL,
    reason TEXT NOT NULL,
    product_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 03. MULTIVERSE DEFENSE (Data Moat)
-- ============================================

CREATE TABLE IF NOT EXISTS bags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    soum_id TEXT NOT NULL,
    name TEXT NOT NULL,
    population INTEGER,
    center_lat DECIMAL(10, 7),
    center_lng DECIMAL(10, 7),
    nearest_shop TEXT,
    has_internet BOOLEAN DEFAULT FALSE,
    has_cellular BOOLEAN DEFAULT TRUE,
    added_by UUID,
    verified_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS local_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    from_soum TEXT NOT NULL,
    to_city TEXT DEFAULT 'Улаанбаатар',
    depart_days TEXT[] DEFAULT '{}',
    depart_time TEXT,
    return_days TEXT[] DEFAULT '{}',
    return_time TEXT,
    vehicle_type TEXT DEFAULT 'sedan',
    price_per_person INTEGER,
    can_carry_goods BOOLEAN DEFAULT FALSE,
    goods_price INTEGER,
    rating DECIMAL(2,1) DEFAULT 0,
    total_trips INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    added_by UUID,
    verified_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS local_shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    soum_id TEXT NOT NULL,
    bag_id UUID,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'grocery',
    owner_name TEXT,
    phone TEXT,
    lat DECIMAL(10, 7),
    lng DECIMAL(10, 7),
    can_receive_packages BOOLEAN DEFAULT FALSE,
    open_hours TEXT,
    added_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS local_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    soum_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'other',
    event_date DATE NOT NULL,
    event_time TEXT,
    location TEXT,
    description TEXT,
    added_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS share_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    user_id UUID,
    platform TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    key_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 04. CHAOS ENGINEERING (Circuit Breaker)
-- ============================================

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

-- ============================================
-- 05. TIME DILATION (Dopamine, Seasons)
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    user_id UUID,
    message_template TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 06. CONSCIOUSNESS (Robin Hood, Crisis)
-- ============================================

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

-- ============================================
-- 07. FUTURE PIVOT (Credit, Wholesale)
-- ============================================

CREATE TABLE IF NOT EXISTS credit_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    credit_score INTEGER NOT NULL,
    credit_band TEXT NOT NULL,
    total_transactions INTEGER DEFAULT 0,
    total_revenue BIGINT DEFAULT 0,
    snapshot_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wholesale_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    is_wholesale_interested BOOLEAN DEFAULT FALSE,
    wholesale_type TEXT DEFAULT 'seller',
    minimum_order_quantity INTEGER,
    categories TEXT[] DEFAULT '{}',
    business_name TEXT,
    business_reg_no TEXT,
    monthly_capacity INTEGER,
    coverage_aimags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cooperatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    leader_id UUID NOT NULL,
    member_ids UUID[] DEFAULT '{}',
    category TEXT,
    aimag TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_products INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_revenue BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 08. LOCAL WORKS (Gig Economy)
-- ============================================

CREATE TABLE IF NOT EXISTS gig_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    user_id UUID NOT NULL,
    category TEXT NOT NULL,
    job_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    aimag TEXT NOT NULL,
    soum TEXT,
    available_from DATE,
    available_to DATE,
    duration INTEGER,
    price_type TEXT DEFAULT 'negotiable',
    price INTEGER,
    price_unit TEXT,
    years_experience INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gig_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL,
    applicant_id UUID NOT NULL,
    message TEXT,
    proposed_price INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gig_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL,
    worker_id UUID NOT NULL,
    employer_id UUID NOT NULL,
    rating INTEGER,
    review TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS worker_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    aimag TEXT,
    main_category TEXT,
    completed_jobs INTEGER DEFAULT 0,
    average_rating DECIMAL(2,1) DEFAULT 0,
    total_earnings BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 09. ARCHETYPE (Activity, Serendipity)
-- ============================================

CREATE TABLE IF NOT EXISTS treasure_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    product_data JSONB,
    view_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, view_date)
);

CREATE TABLE IF NOT EXISTS community_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    target_user_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. SIMULATION (Real Metrics)
-- ============================================

CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    connections_made INTEGER DEFAULT 0,
    listings_posted INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS connection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id UUID,
    seller_id UUID NOT NULL,
    product_id UUID NOT NULL,
    connection_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    payload JSONB,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS internal_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    bank_confirmed BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS human_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id TEXT NOT NULL,
    confidence INTEGER DEFAULT 0,
    signals TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. ETHEREAL (Mood, Trends)
-- ============================================

CREATE TABLE IF NOT EXISTS mood_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mood TEXT NOT NULL,
    custom_banner TEXT,
    banner_icon TEXT,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    set_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    user_id UUID,
    user_aimag TEXT,
    results_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    END LOOP;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_local_drivers_route ON local_drivers(from_soum, to_city);
CREATE INDEX IF NOT EXISTS idx_local_events_date ON local_events(soum_id, event_date);
CREATE INDEX IF NOT EXISTS idx_bags_soum ON bags(soum_id);
CREATE INDEX IF NOT EXISTS idx_system_status_active ON system_status(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending ON scheduled_notifications(scheduled_for, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_crisis_mode_active ON crisis_mode(active, created_at DESC) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_credit_snapshots_seller ON credit_snapshots(seller_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_wholesale_profiles_type ON wholesale_profiles(wholesale_type, is_wholesale_interested);
CREATE INDEX IF NOT EXISTS idx_cooperatives_aimag ON cooperatives(aimag, category);
CREATE INDEX IF NOT EXISTS idx_gig_listings_search ON gig_listings(aimag, category, status, type);
CREATE INDEX IF NOT EXISTS idx_gig_listings_dates ON gig_listings(available_from, available_to);
CREATE INDEX IF NOT EXISTS idx_worker_stats_ranking ON worker_stats(aimag, average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_treasure_views_date ON treasure_views(user_id, view_date);
CREATE INDEX IF NOT EXISTS idx_connection_logs_date ON connection_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_connection_logs_seller ON connection_logs(seller_id);
CREATE INDEX IF NOT EXISTS idx_human_visits_date ON human_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_last ON user_activity(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_keyword ON search_logs(keyword, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_date ON search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_mood_settings_active ON mood_settings(is_active, created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Increment moderator stat
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

-- Update worker stats
CREATE OR REPLACE FUNCTION update_worker_stats(
    p_user_id UUID,
    p_rating INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO worker_stats (user_id, completed_jobs, average_rating)
    VALUES (p_user_id, 1, p_rating)
    ON CONFLICT (user_id) DO UPDATE SET
        completed_jobs = worker_stats.completed_jobs + 1,
        average_rating = (worker_stats.average_rating * worker_stats.completed_jobs + p_rating) / (worker_stats.completed_jobs + 1),
        updated_at = NOW();
END;
$$;

-- Update user activity on connection
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

DROP TRIGGER IF EXISTS trigger_update_activity ON connection_logs;
CREATE TRIGGER trigger_update_activity
    AFTER INSERT ON connection_logs
    FOR EACH ROW
    WHEN (NEW.viewer_id IS NOT NULL)
    EXECUTE FUNCTION update_user_activity();

-- ============================================
-- BASIC RLS POLICIES
-- ============================================

-- Allow public read on most tables
DO $$
DECLARE
    public_read_tables TEXT[] := ARRAY[
        'seller_endorsements', 'product_questions', 'moderators', 
        'bags', 'local_drivers', 'local_shops', 'local_events',
        'cooperatives', 'gig_listings', 'community_announcements',
        'mood_settings', 'system_status', 'crisis_mode', 'worker_stats'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY public_read_tables LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "Public read" ON %I;
            CREATE POLICY "Public read" ON %I FOR SELECT USING (true);
        ', tbl, tbl);
    END LOOP;
END $$;

SELECT '✅ НЭГДСЭН MIGRATION АМЖИЛТТАЙ!' as result;
