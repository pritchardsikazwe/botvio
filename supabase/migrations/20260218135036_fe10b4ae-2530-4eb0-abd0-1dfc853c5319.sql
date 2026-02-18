-- Allow users to update their own executions (needed for RUNNING → WON/LOST status updates)
CREATE POLICY "Users can update own executions"
ON public.executions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);