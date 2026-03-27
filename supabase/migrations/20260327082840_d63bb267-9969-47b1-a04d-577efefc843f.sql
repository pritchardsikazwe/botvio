
-- Signals History table for tracking performance
CREATE TABLE public.signals_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES public.trading_signals(id) ON DELETE SET NULL,
  pair TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL')),
  entry_price NUMERIC NOT NULL,
  take_profit NUMERIC,
  stop_loss NUMERIC,
  result TEXT NOT NULL DEFAULT 'RUNNING' CHECK (result IN ('WIN', 'LOSS', 'RUNNING')),
  profit_pips NUMERIC,
  date_posted TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_closed TIMESTAMP WITH TIME ZONE,
  source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'BOT')),
  strategy_name TEXT,
  screenshot_url TEXT,
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.signals_history ENABLE ROW LEVEL SECURITY;

-- Anyone can read signal history (public performance data)
CREATE POLICY "Anyone can view signals history" ON public.signals_history
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage signals history" ON public.signals_history
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Signal comments table with admin approval
CREATE TABLE public.signal_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES public.trading_signals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.signal_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved comments
CREATE POLICY "Anyone can view approved comments" ON public.signal_comments
  FOR SELECT USING (is_approved = true OR (auth.uid() = user_id) OR public.is_admin());

-- Authenticated users can post comments
CREATE POLICY "Authenticated users can post comments" ON public.signal_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins can update (approve/reject) comments
CREATE POLICY "Admins can manage comments" ON public.signal_comments
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admins can delete comments
CREATE POLICY "Admins can delete comments" ON public.signal_comments
  FOR DELETE TO authenticated USING (public.is_admin());
