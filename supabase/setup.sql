-- kidsmin Supabase setup
-- Run this once in the Supabase SQL Editor after your first login.
-- Replace the email with the address you used to sign in.

-- 1. Promote your account to admin
update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
where email = 'YOUR_EMAIL_HERE';

-- Verify it worked:
select email, raw_app_meta_data
from auth.users
where email = 'YOUR_EMAIL_HERE';
