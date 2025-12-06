-- LOCAL WORKS - GIG ECONOMY MIGRATION

-- Gig Listings (offers and requests)
CREATE TABLE IF NOT EXISTS gig_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,  -- 'offer' or 'request'
    user_id UUID NOT NULL,
    category TEXT NOT NULL,
    job_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Location
    aimag TEXT NOT NULL,
    soum TEXT,
    
    -- Timing
    available_from DATE,
    available_to DATE,
    duration INTEGER,  -- days
    
    -- Pricing
    price_type TEXT DEFAULT 'negotiable',
    price INTEGER,
    price_unit TEXT,
    
    -- Experience
    years_experience INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0,
    
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gig Applications
CREATE TABLE IF NOT EXISTS gig_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES gig_listings(id),
    applicant_id UUID NOT NULL,
    message TEXT,
    proposed_price INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gig Completions (for ratings)
CREATE TABLE IF NOT EXISTS gig_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES gig_listings(id),
    worker_id UUID NOT NULL,
    employer_id UUID NOT NULL,
    rating INTEGER,
    review TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker Stats
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

-- Update worker stats function
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

-- RLS
ALTER TABLE gig_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_stats ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view gig listings" ON gig_listings;
CREATE POLICY "Anyone can view gig listings" ON gig_listings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create listings" ON gig_listings;
CREATE POLICY "Users can create listings" ON gig_listings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own listings" ON gig_listings;
CREATE POLICY "Users can update own listings" ON gig_listings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can apply to gigs" ON gig_applications;
CREATE POLICY "Users can apply to gigs" ON gig_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Users can view relevant applications" ON gig_applications;
CREATE POLICY "Users can view relevant applications" ON gig_applications FOR SELECT USING (
    auth.uid() = applicant_id OR
    EXISTS (SELECT 1 FROM gig_listings WHERE id = listing_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can view worker stats" ON worker_stats;
CREATE POLICY "Anyone can view worker stats" ON worker_stats FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gig_listings_search ON gig_listings(aimag, category, status, type);
CREATE INDEX IF NOT EXISTS idx_gig_listings_dates ON gig_listings(available_from, available_to);
CREATE INDEX IF NOT EXISTS idx_worker_stats_ranking ON worker_stats(aimag, average_rating DESC);

SELECT 'LocalWorks migration completed!' as result;
