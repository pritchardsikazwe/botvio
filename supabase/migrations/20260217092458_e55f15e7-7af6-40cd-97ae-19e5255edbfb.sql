
-- Add 'signal_manager' to the app_role enum so admins can grant signal posting permission
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'signal_manager';
