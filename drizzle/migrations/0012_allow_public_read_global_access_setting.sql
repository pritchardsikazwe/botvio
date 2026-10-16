CREATE POLICY "Public can read global access switch"
ON public.app_settings
FOR SELECT
TO public
USING (key = 'global_access_open');