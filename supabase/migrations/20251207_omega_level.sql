-- THE OMEGA Level Migration: Legal & Financial Risk Mitigation
-- Date: 2025-12-07

-- 1. ID Verification & Compliance Tracking
CREATE TABLE IF NOT EXISTS id_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    id_card_image_key TEXT, -- R2 storage key (will be deleted after verification)
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by UUID, -- Admin who verified
    rejection_reason TEXT,
    scheduled_deletion TIMESTAMPTZ, -- When image should be deleted
    image_deleted_at TIMESTAMPTZ, -- When image was actually deleted
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Compliance Logs (For Legal Audits)
CREATE TABLE IF NOT EXISTS compliance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id TEXT,
    image_key TEXT,
    reason TEXT,
    ip_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Admin Alerts (Suspicious Activity)
CREATE TABLE IF NOT EXISTS admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- SUSPICIOUS_ACTIVITY, PRICE_ANOMALY, etc.
    seller_id UUID REFERENCES auth.users(id),
    product_id UUID,
    reason TEXT NOT NULL,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VIP Purchases (Revenue Tracking)
CREATE TABLE IF NOT EXISTS vip_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    price_paid INTEGER NOT NULL, -- in MNT
    multiplier NUMERIC(3,2) DEFAULT 1.00, -- Surge multiplier at time of purchase
    location_aimag TEXT NOT NULL,
    location_soum TEXT,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    payment_method TEXT DEFAULT 'qpay',
    payment_reference TEXT
);

-- 5. Add VIP fields to products table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_vip') THEN
        ALTER TABLE products ADD COLUMN is_vip BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'vip_expires_at') THEN
        ALTER TABLE products ADD COLUMN vip_expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- 6. Row Level Security
ALTER TABLE id_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_purchases ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verifications
CREATE POLICY "Users can view own verifications" ON id_verifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own verifications
CREATE POLICY "Users can insert own verifications" ON id_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can update verifications
CREATE POLICY "Admins can update verifications" ON id_verifications
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Only admins can see compliance logs
CREATE POLICY "Admins can view compliance logs" ON compliance_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Only admins can see alerts
CREATE POLICY "Admins can manage alerts" ON admin_alerts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Users can see their own VIP purchases
CREATE POLICY "Users can view own VIP purchases" ON vip_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_id_verifications_user ON id_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_id_verifications_scheduled ON id_verifications(scheduled_deletion) WHERE id_card_image_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_alerts_status ON admin_alerts(status, severity);
CREATE INDEX IF NOT EXISTS idx_vip_purchases_expires ON vip_purchases(expires_at);
CREATE INDEX IF NOT EXISTS idx_products_vip ON products(is_vip, vip_expires_at) WHERE is_vip = true;
