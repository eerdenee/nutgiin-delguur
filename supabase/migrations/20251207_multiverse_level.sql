-- MULTIVERSE Level Migration: Vendor Independence & Algorithm Fairness
-- Date: 2025-12-07

-- 1. Backup Logs Table (Track all backups)
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_key TEXT NOT NULL,
    tables_backed_up INTEGER,
    total_rows INTEGER,
    size_bytes BIGINT,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'partial', 'failed')),
    errors JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add engagement score column to products
DO $$ 
BEGIN
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
END $$;

-- 3. Row Level Security
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can see backup logs
CREATE POLICY "Admins can view backup logs" ON backup_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. Indexes for fair discovery algorithm
CREATE INDEX IF NOT EXISTS idx_products_engagement ON products(engagement_score DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_products_new ON products(created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_products_category_location ON products(category, location_aimag, status) WHERE status = 'active';

-- 5. Initialize engagement scores for existing products
UPDATE products SET engagement_score = (
    COALESCE(views, 0) * 1 +
    COALESCE(likes, 0) * 5 +
    COALESCE(shares, 0) * 10 +
    COALESCE(chat_clicks, 0) * 15 +
    COALESCE(call_clicks, 0) * 20
) * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - created_at)) / (7 * 24 * 60 * 60))
WHERE engagement_score IS NULL OR engagement_score = 0;
