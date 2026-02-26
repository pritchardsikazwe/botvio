-- Fix providers RLS: super_admin couldn't see pending providers because policy used has_role('admin') instead of is_admin()
DROP POLICY IF EXISTS "Admins can manage all providers" ON public.providers;
CREATE POLICY "Admins can manage all providers"
ON public.providers FOR ALL
USING (is_admin())
WITH CHECK (is_admin());
