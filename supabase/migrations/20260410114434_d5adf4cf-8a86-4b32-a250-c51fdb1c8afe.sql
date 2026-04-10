
CREATE POLICY "Admins can view all training videos"
  ON public.training_videos FOR SELECT
  TO authenticated
  USING (public.is_admin());
