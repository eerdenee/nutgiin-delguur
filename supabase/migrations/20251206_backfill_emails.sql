-- Update profiles with email from auth.users
-- Run this in Supabase SQL Editor to populate the email column
UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE public.profiles.id = auth.users.id;
