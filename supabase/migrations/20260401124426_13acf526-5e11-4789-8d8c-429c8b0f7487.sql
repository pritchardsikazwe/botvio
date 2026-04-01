
CREATE TABLE public.daily_picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  slip_size INTEGER NOT NULL DEFAULT 3,
  market_type TEXT NOT NULL DEFAULT 'mixed',
  slip_type TEXT NOT NULL DEFAULT 'combined',
  league_filter TEXT,
  picks_content TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_picks ENABLE ROW LEVEL SECURITY;

-- Everyone can read published picks
CREATE POLICY "Anyone can view published picks"
  ON public.daily_picks FOR SELECT
  USING (is_published = true);

-- Only admins can insert
CREATE POLICY "Admins can insert picks"
  ON public.daily_picks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Only admins can update
CREATE POLICY "Admins can update picks"
  ON public.daily_picks FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- Only admins can delete
CREATE POLICY "Admins can delete picks"
  ON public.daily_picks FOR DELETE
  TO authenticated
  USING (public.is_admin());
