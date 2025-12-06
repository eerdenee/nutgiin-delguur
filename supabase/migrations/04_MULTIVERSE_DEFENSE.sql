-- MULTIVERSE DEFENSE MIGRATION
-- Data Moat & Platform Agnostic tables

-- Bags (Village/Neighborhood data)
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

-- Local Drivers (UNIQUE DATA!)
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

-- Local Shops (Pickup points)
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

-- Local Events
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

-- Share tracking
CREATE TABLE IF NOT EXISTS share_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    user_id UUID,
    platform TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys
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

-- RLS
ALTER TABLE bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policies (all readable, authenticated can add)
DROP POLICY IF EXISTS "Anyone can read bags" ON bags;
CREATE POLICY "Anyone can read bags" ON bags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add bags" ON bags;
CREATE POLICY "Users can add bags" ON bags FOR INSERT WITH CHECK (auth.uid() = added_by);

DROP POLICY IF EXISTS "Anyone can read drivers" ON local_drivers;
CREATE POLICY "Anyone can read drivers" ON local_drivers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add drivers" ON local_drivers;
CREATE POLICY "Users can add drivers" ON local_drivers FOR INSERT WITH CHECK (auth.uid() = added_by);

DROP POLICY IF EXISTS "Anyone can read shops" ON local_shops;
CREATE POLICY "Anyone can read shops" ON local_shops FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read events" ON local_events;
CREATE POLICY "Anyone can read events" ON local_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can track shares" ON share_tracking;
CREATE POLICY "System can track shares" ON share_tracking FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users manage own api keys" ON api_keys;
CREATE POLICY "Users manage own api keys" ON api_keys FOR ALL USING (auth.uid() = user_id);

-- Indexes for search
CREATE INDEX IF NOT EXISTS idx_local_drivers_route ON local_drivers(from_soum, to_city);
CREATE INDEX IF NOT EXISTS idx_local_events_date ON local_events(soum_id, event_date);
CREATE INDEX IF NOT EXISTS idx_bags_soum ON bags(soum_id);

SELECT 'Multiverse Defense migration completed!' as result;
