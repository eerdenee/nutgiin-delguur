-- ============================================
-- NUTGIIN DELGUUR: SIMPLIFIED MIGRATION
-- ============================================
-- Run this in Supabase SQL Editor
-- Version: 1.0.1
-- ============================================

-- ============================================
-- STEP 1: ADD STATUS TO PRODUCTS (IF MISSING)
-- ============================================

DO $$ 
BEGIN
    -- Check if products table exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        -- Add status column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
            ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active';
        END IF;
    END IF;
END $$;

-- ============================================
-- STEP 2: CREATE NEW TABLES
-- ============================================

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID,
    reporter_id UUID,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ID Verifications
CREATE TABLE IF NOT EXISTS id_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    id_card_image_key TEXT,
    image_hash_sha256 VARCHAR(64),
    status TEXT DEFAULT 'pending',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    rejection_reason TEXT,
    scheduled_deletion TIMESTAMPTZ,
    image_deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Logs
CREATE TABLE IF NOT EXISTS compliance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id TEXT,
    image_key TEXT,
    reason TEXT,
    ip_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Alerts
CREATE TABLE IF NOT EXISTS admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    seller_id UUID,
    product_id UUID,
    reason TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIP Purchases
CREATE TABLE IF NOT EXISTS vip_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    user_id UUID,
    price_paid INTEGER NOT NULL,
    multiplier NUMERIC(3,2) DEFAULT 1.00,
    location_aimag TEXT NOT NULL,
    location_soum TEXT,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    payment_method TEXT DEFAULT 'qpay',
    payment_reference TEXT
);

-- Verified Transactions
CREATE TABLE IF NOT EXISTS verified_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(12) UNIQUE NOT NULL,
    buyer_id UUID,
    seller_id UUID,
    product_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'completed',
    review_allowed BOOLEAN DEFAULT TRUE,
    review_submitted BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    product_id UUID NOT NULL,
    seller_id UUID,
    transaction_id UUID,
    rating INTEGER NOT NULL,
    review TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    product_id UUID,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage Cleanup Logs
CREATE TABLE IF NOT EXISTS storage_cleanup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_key TEXT NOT NULL,
    file_size BIGINT,
    action TEXT NOT NULL,
    cleaned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource Reservations
CREATE TABLE IF NOT EXISTS resource_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    user_id UUID,
    status TEXT DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backup Logs
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_key TEXT NOT NULL,
    tables_backed_up INTEGER,
    total_rows INTEGER,
    size_bytes BIGINT,
    status TEXT DEFAULT 'success',
    errors JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interaction Logs
CREATE TABLE IF NOT EXISTS interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID,
    target_user_id UUID,
    product_id UUID,
    interaction_type TEXT NOT NULL,
    metadata JSONB,
    ip_hash TEXT,
    user_agent_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Law Enforcement Requests
CREATE TABLE IF NOT EXISTS law_enforcement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_user_id UUID NOT NULL,
    requesting_agency TEXT NOT NULL,
    case_number TEXT,
    officer_name TEXT,
    date_range_start TIMESTAMPTZ,
    date_range_end TIMESTAMPTZ,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by UUID,
    notes TEXT
);

-- Moderation Queue
CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    user_id UUID,
    product_id UUID,
    seller_id UUID,
    content TEXT,
    rating INTEGER,
    flag_reason TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sentiment Metrics
CREATE TABLE IF NOT EXISTS sentiment_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_reviews INTEGER DEFAULT 0,
    positive_reviews INTEGER DEFAULT 0,
    neutral_reviews INTEGER DEFAULT 0,
    negative_reviews INTEGER DEFAULT 0,
    average_rating NUMERIC(2,1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date)
);

-- ============================================
-- STEP 3: ADD COLUMNS TO PRODUCTS
-- ============================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        -- VIP
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_vip') THEN
            ALTER TABLE products ADD COLUMN is_vip BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'vip_expires_at') THEN
            ALTER TABLE products ADD COLUMN vip_expires_at TIMESTAMPTZ;
        END IF;
        
        -- Expiry
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'last_renewed_at') THEN
            ALTER TABLE products ADD COLUMN last_renewed_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expired_at') THEN
            ALTER TABLE products ADD COLUMN expired_at TIMESTAMPTZ;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expiry_reason') THEN
            ALTER TABLE products ADD COLUMN expiry_reason TEXT;
        END IF;
        
        -- Engagement
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'engagement_score') THEN
            ALTER TABLE products ADD COLUMN engagement_score NUMERIC(10,2) DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shares') THEN
            ALTER TABLE products ADD COLUMN shares INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'chat_clicks') THEN
            ALTER TABLE products ADD COLUMN chat_clicks INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'call_clicks') THEN
            ALTER TABLE products ADD COLUMN call_clicks INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock') THEN
            ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 1;
        END IF;
    END IF;
END $$;

-- ============================================
-- STEP 4: ADD COLUMNS TO PROFILES
-- ============================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'average_rating') THEN
            ALTER TABLE profiles ADD COLUMN average_rating NUMERIC(2,1) DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_reviews') THEN
            ALTER TABLE profiles ADD COLUMN total_reviews INTEGER DEFAULT 0;
        END IF;
    END IF;
END $$;

-- ============================================
-- STEP 5: ENABLE RLS
-- ============================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_cleanup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_enforcement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: BASIC POLICIES
-- ============================================

-- Reports: Anyone can insert
DROP POLICY IF EXISTS "Anyone can insert reports" ON reports;
CREATE POLICY "Anyone can insert reports" ON reports FOR INSERT WITH CHECK (true);

-- Reviews: Anyone can read
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);

-- Notifications: Users see own
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Interaction logs: System can insert
DROP POLICY IF EXISTS "System can insert interaction logs" ON interaction_logs;
CREATE POLICY "System can insert interaction logs" ON interaction_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- STEP 7: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_actor ON interaction_logs(actor_user_id);

-- ============================================
-- STEP 8: ATOMIC INCREMENT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION increment_product_stat(
    p_product_id UUID,
    p_column TEXT,
    p_amount INTEGER DEFAULT 1
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_column NOT IN ('views', 'likes', 'shares', 'chat_clicks', 'call_clicks', 'saves') THEN
        RAISE EXCEPTION 'Invalid column: %', p_column;
    END IF;
    
    EXECUTE format(
        'UPDATE products SET %I = COALESCE(%I, 0) + $1 WHERE id = $2',
        p_column, p_column
    ) USING p_amount, p_product_id;
END;
$$;

-- ============================================
-- DONE! 
-- ============================================

SELECT 'Migration completed successfully!' as result;
