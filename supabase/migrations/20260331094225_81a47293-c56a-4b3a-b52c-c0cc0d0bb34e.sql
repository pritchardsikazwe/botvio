
-- Bet slips table for tracking user bet uploads
CREATE TABLE public.bet_slips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_name TEXT NOT NULL,
  league TEXT,
  market_type TEXT NOT NULL DEFAULT 'over_under',
  prediction TEXT NOT NULL,
  odds NUMERIC,
  stake NUMERIC,
  result TEXT DEFAULT 'pending',
  profit_loss NUMERIC,
  screenshot_url TEXT,
  strategy_notes TEXT,
  match_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bet_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bet slips" ON public.bet_slips
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bet slips" ON public.bet_slips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bet slips" ON public.bet_slips
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bet slips" ON public.bet_slips
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Public leaderboard view
CREATE POLICY "Anyone can view aggregated stats" ON public.bet_slips
  FOR SELECT TO anon USING (result != 'pending');

-- Create storage bucket for bet slip screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('bet-slips', 'bet-slips', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload bet slip images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bet-slips' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view bet slip images" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'bet-slips');
