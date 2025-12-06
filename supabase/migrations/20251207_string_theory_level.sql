-- STRING THEORY Level Migration: Performance & Sentiment
-- Date: 2025-12-07

-- 1. Atomic increment function (for probabilistic counting)
CREATE OR REPLACE FUNCTION increment_product_stat(
    p_product_id UUID,
    p_column TEXT,
    p_amount INTEGER DEFAULT 1
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow specific columns to be incremented
    IF p_column NOT IN ('views', 'likes', 'shares', 'chat_clicks', 'call_clicks', 'saves') THEN
        RAISE EXCEPTION 'Invalid column: %', p_column;
    END IF;
    
    EXECUTE format(
        'UPDATE products SET %I = COALESCE(%I, 0) + $1 WHERE id = $2',
        p_column, p_column
    ) USING p_amount, p_product_id;
END;
$$;

-- 2. Moderation Queue Table
CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- review, product, user
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product_id UUID,
    seller_id UUID,
    content TEXT,
    rating INTEGER,
    flag_reason TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add grace period columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'grace_period_ends') THEN
        ALTER TABLE products ADD COLUMN grace_period_ends TIMESTAMPTZ;
    END IF;
END $$;

-- 4. Sentiment metrics table (for dashboard)
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

-- 5. Row Level Security
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can manage moderation queue
CREATE POLICY "Admins can manage moderation queue" ON moderation_queue
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Admins can view sentiment metrics
CREATE POLICY "Admins can view sentiment metrics" ON sentiment_metrics
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_product ON moderation_queue(product_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_metrics_date ON sentiment_metrics(date DESC);

-- 7. Daily sentiment aggregation function
CREATE OR REPLACE FUNCTION aggregate_daily_sentiment()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
    INSERT INTO sentiment_metrics (date, total_reviews, positive_reviews, neutral_reviews, negative_reviews, average_rating)
    SELECT 
        v_date,
        COUNT(*),
        COUNT(*) FILTER (WHERE rating >= 4),
        COUNT(*) FILTER (WHERE rating = 3),
        COUNT(*) FILTER (WHERE rating <= 2),
        ROUND(AVG(rating)::NUMERIC, 1)
    FROM reviews
    WHERE DATE_TRUNC('day', created_at) = v_date
    ON CONFLICT (date) DO UPDATE SET
        total_reviews = EXCLUDED.total_reviews,
        positive_reviews = EXCLUDED.positive_reviews,
        neutral_reviews = EXCLUDED.neutral_reviews,
        negative_reviews = EXCLUDED.negative_reviews,
        average_rating = EXCLUDED.average_rating;
END;
$$;
