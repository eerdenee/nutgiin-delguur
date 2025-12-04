-- =============================================
-- NUTGIIN DELGUUR - PRODUCTION SCHEMA
-- Backend: Supabase PostgreSQL
-- Images: Cloudflare R2
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT, -- Can be NULL (Google login)
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'producer', 'admin')),
  is_verified BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'start' CHECK (subscription_tier IN ('start', 'active', 'business')),
  subscription_expires_at TIMESTAMPTZ,
  location JSONB,
  bank_info JSONB, -- {bankName, accountNumber, iban}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 2. PRODUCTS TABLE (Optimized)
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  currency TEXT DEFAULT '₮',
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}', -- Cloudflare R2 URLs
  video_links TEXT[] DEFAULT '{}',
  location JSONB NOT NULL, -- {aimag, soum}
  tier TEXT DEFAULT 'soum' CHECK (tier IN ('soum', 'aimag', 'national')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'hidden', 'deleted')),
  
  -- Engagement stats
  views INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  call_clicks INTEGER DEFAULT 0,
  chat_clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  
  -- Full-text search vector
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) STORED
);

-- =============================================
-- 3. FAVORITES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- =============================================
-- 4. MESSAGES TABLE (Realtime)
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 5. REPORTS TABLE (Moderation)
-- =============================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- 6. SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('start', 'active', 'business')),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES (Performance)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_location ON products USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment view count function
CREATE OR REPLACE FUNCTION increment_product_views(product_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE products SET views = views + 1 WHERE id = product_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Active products viewable" ON products FOR SELECT USING (status = 'active' OR user_id = auth.uid());
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE 
  USING (auth.uid() = receiver_id);

-- Reports policies
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================
-- Only enable for tables that need realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =============================================
-- STORAGE BUCKET (for small files, avatars)
-- Note: Main images go to Cloudflare R2
-- =============================================
-- Run in Supabase Dashboard -> Storage
-- CREATE BUCKET 'avatars' with public access

