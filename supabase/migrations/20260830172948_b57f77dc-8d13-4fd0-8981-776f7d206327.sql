DROP POLICY IF EXISTS "Service role can update analysis jobs" ON public.analysis_jobs;

CREATE POLICY "Users can update their own analysis jobs"
ON public.analysis_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);