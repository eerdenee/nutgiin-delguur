-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to moderators table (if doesn't exist, create it)
CREATE TABLE IF NOT EXISTS public.moderators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    level TEXT DEFAULT 'local', -- 'local', 'regional', 'national'
    aimag TEXT,
    soum TEXT,
    role TEXT DEFAULT 'moderator',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stats JSONB DEFAULT '{"reviewed": 0, "removed": 0, "warnings": 0}'::jsonb
);

-- Add missing columns to existing moderators table
ALTER TABLE public.moderators ADD COLUMN IF NOT EXISTS reviewed INTEGER DEFAULT 0;
ALTER TABLE public.moderators ADD COLUMN IF NOT EXISTS removed INTEGER DEFAULT 0;
ALTER TABLE public.moderators ADD COLUMN IF NOT EXISTS warnings INTEGER DEFAULT 0;

SELECT 'PROFILES AND MODERATORS UPDATED!' as result;
