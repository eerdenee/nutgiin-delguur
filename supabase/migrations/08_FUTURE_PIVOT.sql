-- FUTURE PIVOT MIGRATION

-- Credit Snapshots (for future fintech)
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

-- Wholesale Profiles (for B2B pivot)
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

-- Cooperatives (groups of sellers)
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

-- Daily Stats (for tracking)
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_products INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_revenue BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE credit_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Users can view own credit
DROP POLICY IF EXISTS "Users view own credit" ON credit_snapshots;
CREATE POLICY "Users view own credit" ON credit_snapshots FOR SELECT USING (auth.uid() = seller_id);

-- Users can manage wholesale profile
DROP POLICY IF EXISTS "Users manage wholesale" ON wholesale_profiles;
CREATE POLICY "Users manage wholesale" ON wholesale_profiles FOR ALL USING (auth.uid() = user_id);

-- Anyone can view cooperatives
DROP POLICY IF EXISTS "Anyone can view cooperatives" ON cooperatives;
CREATE POLICY "Anyone can view cooperatives" ON cooperatives FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_snapshots_seller ON credit_snapshots(seller_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_wholesale_profiles_type ON wholesale_profiles(wholesale_type, is_wholesale_interested);
CREATE INDEX IF NOT EXISTS idx_cooperatives_aimag ON cooperatives(aimag, category);

SELECT 'Future Pivot migration completed!' as result;
