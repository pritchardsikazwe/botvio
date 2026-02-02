-- Remove the auto-admin trigger for admin@botvio.demo
DROP TRIGGER IF EXISTS on_auth_user_created_demo_admin ON auth.users;
DROP FUNCTION IF EXISTS public.handle_demo_admin_role();

-- Delete user roles for these accounts
DELETE FROM public.user_roles 
WHERE user_id IN (
  '48d0df6b-ebb7-47a0-b2ab-89234bcfde15',
  'da9cd678-26c7-4188-8eb5-02636934ea4e',
  '63fdf958-6315-4d0b-bdb1-b17744b132fe',
  '590568b6-23f7-4315-b24e-9703a565ade2'
);

-- Delete profiles for these accounts
DELETE FROM public.profiles 
WHERE user_id IN (
  '48d0df6b-ebb7-47a0-b2ab-89234bcfde15',
  'da9cd678-26c7-4188-8eb5-02636934ea4e',
  '63fdf958-6315-4d0b-bdb1-b17744b132fe',
  '590568b6-23f7-4315-b24e-9703a565ade2'
);

-- Delete user settings for these accounts
DELETE FROM public.user_settings 
WHERE user_id IN (
  '48d0df6b-ebb7-47a0-b2ab-89234bcfde15',
  'da9cd678-26c7-4188-8eb5-02636934ea4e',
  '63fdf958-6315-4d0b-bdb1-b17744b132fe',
  '590568b6-23f7-4315-b24e-9703a565ade2'
);

-- Delete user plan subscriptions for these accounts
DELETE FROM public.user_plan_subscriptions 
WHERE user_id IN (
  '48d0df6b-ebb7-47a0-b2ab-89234bcfde15',
  'da9cd678-26c7-4188-8eb5-02636934ea4e',
  '63fdf958-6315-4d0b-bdb1-b17744b132fe',
  '590568b6-23f7-4315-b24e-9703a565ade2'
);

-- Delete the auth users (this will cascade to related tables)
DELETE FROM auth.users 
WHERE id IN (
  '48d0df6b-ebb7-47a0-b2ab-89234bcfde15',
  'da9cd678-26c7-4188-8eb5-02636934ea4e',
  '63fdf958-6315-4d0b-bdb1-b17744b132fe',
  '590568b6-23f7-4315-b24e-9703a565ade2'
);