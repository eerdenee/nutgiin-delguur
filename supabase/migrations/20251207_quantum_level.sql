-- QUANTUM Level Migration: Race Conditions, SEO, and Atomic Operations
-- Date: 2025-12-07

-- 1. Resource Reservations Table (For Race Condition Prevention)
CREATE TABLE IF NOT EXISTS resource_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL, -- vip_slot, featured_slot, inventory
    resource_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent double reservation
    CONSTRAINT unique_active_reservation UNIQUE (resource_type, resource_id, status)
);

-- 2. Add SEO archival columns to products
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'archived_at') THEN
        ALTER TABLE products ADD COLUMN archived_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'archive_reason') THEN
        ALTER TABLE products ADD COLUMN archive_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'seo_redirect_active') THEN
        ALTER TABLE products ADD COLUMN seo_redirect_active BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Atomic VIP Purchase Function (Prevents Race Conditions)
CREATE OR REPLACE FUNCTION atomic_vip_purchase(
    p_product_id UUID,
    p_user_id UUID,
    p_location_aimag TEXT,
    p_location_soum TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_max_vip_percent NUMERIC := 0.20; -- 20% max VIP
    v_total_count INTEGER;
    v_vip_count INTEGER;
    v_max_slots INTEGER;
    v_available_slots INTEGER;
    v_transaction_id UUID;
    v_current_price INTEGER := 9900; -- Base VIP price
BEGIN
    -- Lock the products table for this location to prevent race conditions
    PERFORM pg_advisory_xact_lock(hashtext(p_location_aimag || COALESCE(p_location_soum, '')));

    -- Count total and VIP products in location
    SELECT COUNT(*) INTO v_total_count
    FROM products
    WHERE location_aimag = p_location_aimag
    AND (p_location_soum IS NULL OR location_soum = p_location_soum)
    AND status = 'active';

    SELECT COUNT(*) INTO v_vip_count
    FROM products
    WHERE location_aimag = p_location_aimag
    AND (p_location_soum IS NULL OR location_soum = p_location_soum)
    AND status = 'active'
    AND is_vip = true;

    -- Calculate available slots
    v_max_slots := GREATEST(1, FLOOR(v_total_count * v_max_vip_percent));
    v_available_slots := v_max_slots - v_vip_count;

    -- Check if product is already VIP
    IF EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND is_vip = true) THEN
        RAISE EXCEPTION 'ALREADY_VIP';
    END IF;

    -- Check if slots available
    IF v_available_slots <= 0 THEN
        RAISE EXCEPTION 'NO_SLOTS_AVAILABLE';
    END IF;

    -- Calculate surge pricing
    IF (v_vip_count::NUMERIC / NULLIF(v_total_count, 0)) >= 0.18 THEN
        v_current_price := v_current_price * 2;
    ELSIF (v_vip_count::NUMERIC / NULLIF(v_total_count, 0)) >= 0.15 THEN
        v_current_price := FLOOR(v_current_price * 1.5);
    END IF;

    -- Insert VIP purchase record
    INSERT INTO vip_purchases (
        product_id, user_id, price_paid, location_aimag, location_soum,
        purchased_at, expires_at
    ) VALUES (
        p_product_id, p_user_id, v_current_price, p_location_aimag, p_location_soum,
        NOW(), NOW() + INTERVAL '7 days'
    ) RETURNING id INTO v_transaction_id;

    -- Update product to VIP
    UPDATE products SET
        is_vip = true,
        vip_expires_at = NOW() + INTERVAL '7 days'
    WHERE id = p_product_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'price_paid', v_current_price,
        'expires_at', (NOW() + INTERVAL '7 days')::TEXT
    );
END;
$$;

-- 4. Atomic Stock Decrement Function (Prevents Overselling)
CREATE OR REPLACE FUNCTION atomic_decrement_stock(
    p_product_id UUID,
    p_quantity INTEGER DEFAULT 1
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Lock the specific product row
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'PRODUCT_NOT_FOUND');
    END IF;

    IF v_current_stock < p_quantity THEN
        RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_STOCK', 'remaining_stock', v_current_stock);
    END IF;

    v_new_stock := v_current_stock - p_quantity;

    UPDATE products SET stock = v_new_stock WHERE id = p_product_id;

    RETURN jsonb_build_object('success', true, 'remaining_stock', v_new_stock);
END;
$$;

-- 5. Row Level Security
ALTER TABLE resource_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations" ON resource_reservations
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_type_resource ON resource_reservations(resource_type, resource_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON resource_reservations(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(archived_at, status) WHERE status = 'archived';
CREATE INDEX IF NOT EXISTS idx_products_location_vip ON products(location_aimag, location_soum, is_vip) WHERE status = 'active';

-- 7. Add stock column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock') THEN
        ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 1;
    END IF;
END $$;
