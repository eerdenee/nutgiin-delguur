-- 1. Create verification_requests table if not exists
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  phone text,
  business_name text,
  id_front_url text,
  id_back_url text,
  selfie_url text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- 2. Add country_code column to key tables
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'MN';

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'MN';

ALTER TABLE verification_requests 
ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'MN';

-- 3. Create orders table if not exists
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'MN';

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_products_country ON products(country_code);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country_code);
