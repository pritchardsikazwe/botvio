-- Step 1: Add super_admin and affiliate to the app_role enum only
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'affiliate';