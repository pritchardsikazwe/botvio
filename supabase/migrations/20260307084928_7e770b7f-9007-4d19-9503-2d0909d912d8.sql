DROP POLICY IF EXISTS "All users can view lessons" ON public.education_lessons;
CREATE POLICY "Anyone can view lessons" ON public.education_lessons FOR SELECT TO anon, authenticated USING (true);