-- FOUR PILLARS MIGRATION
-- Phone verification, terms acceptance, auto-hide

-- Phone verifications table
CREATE TABLE IF NOT EXISTS phone_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add phone columns to profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_verified_at') THEN
        ALTER TABLE profiles ADD COLUMN phone_verified_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'terms_accepted') THEN
        ALTER TABLE profiles ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'terms_accepted_at') THEN
        ALTER TABLE profiles ADD COLUMN terms_accepted_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_banned') THEN
        ALTER TABLE profiles ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add hidden columns to products
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'hidden_reason') THEN
        ALTER TABLE products ADD COLUMN hidden_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'hidden_at') THEN
        ALTER TABLE products ADD COLUMN hidden_at TIMESTAMPTZ;
    END IF;
END $$;

-- RLS
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own verifications" ON phone_verifications;
CREATE POLICY "Users own verifications" ON phone_verifications 
    FOR ALL USING (auth.uid() = user_id);

SELECT 'Four Pillars migration completed!' as result;
