-- Add INSERT policy for trial_grants if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trial_grants' 
    AND policyname = 'Users can create own trial grant'
  ) THEN
    CREATE POLICY "Users can create own trial grant"
    ON public.trial_grants
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;