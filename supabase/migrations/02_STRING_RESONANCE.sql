-- STRING RESONANCE STRATEGIES MIGRATION

-- Seller Endorsements (Nuted Ah system)
CREATE TABLE IF NOT EXISTS seller_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endorser_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    is_same_location BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(endorser_id, seller_id)
);

-- Product Questions (Q&A instead of comments)
CREATE TABLE IF NOT EXISTS product_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    asker_id UUID NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    status TEXT DEFAULT 'pending',
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location columns for profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location_aimag') THEN
        ALTER TABLE profiles ADD COLUMN location_aimag TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location_soum') THEN
        ALTER TABLE profiles ADD COLUMN location_soum TEXT;
    END IF;
END $$;

-- RLS
ALTER TABLE seller_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can read endorsements" ON seller_endorsements;
CREATE POLICY "Anyone can read endorsements" ON seller_endorsements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can endorse" ON seller_endorsements;
CREATE POLICY "Users can endorse" ON seller_endorsements FOR INSERT WITH CHECK (auth.uid() = endorser_id);

DROP POLICY IF EXISTS "Anyone can read questions" ON product_questions;
CREATE POLICY "Anyone can read questions" ON product_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can ask questions" ON product_questions;
CREATE POLICY "Users can ask questions" ON product_questions FOR INSERT WITH CHECK (auth.uid() = asker_id);

SELECT 'String Resonance migration completed!' as result;
