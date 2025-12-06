-- BLACK HOLE Level Migration: Security & Cleanup Systems
-- Date: 2025-12-07

-- 1. Add SHA-256 hash column to id_verifications (Cryptographic Proof)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'id_verifications' AND column_name = 'image_hash_sha256') THEN
        ALTER TABLE id_verifications ADD COLUMN image_hash_sha256 VARCHAR(64);
        COMMENT ON COLUMN id_verifications.image_hash_sha256 IS 'SHA-256 hash of ID image - kept as cryptographic proof after image deletion';
    END IF;
END $$;

-- 2. Add auto-expiry columns to products (Ghost Ads Prevention)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'last_renewed_at') THEN
        ALTER TABLE products ADD COLUMN last_renewed_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expired_at') THEN
        ALTER TABLE products ADD COLUMN expired_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expiry_reason') THEN
        ALTER TABLE products ADD COLUMN expiry_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expiry_reminder_sent') THEN
        ALTER TABLE products ADD COLUMN expiry_reminder_sent TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sold_at') THEN
        ALTER TABLE products ADD COLUMN sold_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Verified Transactions Table (For Verified Reviews)
CREATE TABLE IF NOT EXISTS verified_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(12) UNIQUE NOT NULL, -- TX-XXXXXXXX
    buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product_id UUID NOT NULL,
    amount INTEGER NOT NULL, -- in MNT
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'disputed')),
    review_allowed BOOLEAN DEFAULT TRUE,
    review_submitted BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Reviews Table (Only for Verified Purchasers)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product_id UUID NOT NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES verified_transactions(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_verified BOOLEAN DEFAULT FALSE, -- TRUE = Verified Purchaser
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notifications Table (For Expiry Reminders)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    product_id UUID,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Storage Cleanup Logs (For Orphaned File Tracking)
CREATE TABLE IF NOT EXISTS storage_cleanup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_key TEXT NOT NULL,
    file_size BIGINT,
    action TEXT NOT NULL,
    cleaned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Add rating columns to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'average_rating') THEN
        ALTER TABLE profiles ADD COLUMN average_rating NUMERIC(2,1) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_reviews') THEN
        ALTER TABLE profiles ADD COLUMN total_reviews INTEGER DEFAULT 0;
    END IF;
END $$;

-- 8. Row Level Security
ALTER TABLE verified_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_cleanup_logs ENABLE ROW LEVEL SECURITY;

-- Users can see their own transactions
CREATE POLICY "Users can view own transactions" ON verified_transactions
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Anyone can view reviews (public)
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

-- Only transaction holders can create reviews
CREATE POLICY "Transaction holders can create reviews" ON reviews
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM verified_transactions 
            WHERE id = reviews.transaction_id 
            AND buyer_id = auth.uid()
            AND review_submitted = false
        )
    );

-- Users can see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Only admins can see cleanup logs
CREATE POLICY "Admins can view cleanup logs" ON storage_cleanup_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(last_renewed_at, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_verified_transactions_buyer ON verified_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_verified_transactions_seller ON verified_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(seller_id, is_verified);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read) WHERE read = false;

-- 10. Auto-set last_renewed_at for existing products
UPDATE products SET last_renewed_at = created_at WHERE last_renewed_at IS NULL;
