CREATE POLICY "Admins can view all chart analyses"
ON public.chart_analyses
FOR SELECT
TO authenticated
USING (public.is_admin());