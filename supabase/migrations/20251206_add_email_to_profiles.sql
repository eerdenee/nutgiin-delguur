-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Note: To backfill existing emails, run this in Supabase SQL Editor:
-- UPDATE public.profiles p
-- SET email = u.email
-- FROM auth.users u
-- WHERE p.id = u.id;
