DROP POLICY IF EXISTS "Anyone can view aggregated stats" ON public.bet_slips;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bet_slips TO authenticated;
GRANT ALL ON public.bet_slips TO service_role;

-- Keep RLS enabled and existing authenticated-only policies intact.
-- No public/anon access remains; the application only queries a user's own bet slips.