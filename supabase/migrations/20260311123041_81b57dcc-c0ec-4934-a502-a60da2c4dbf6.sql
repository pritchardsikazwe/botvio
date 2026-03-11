
CREATE TABLE public.news_event_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_code TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time_utc TIME,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT false,
  hauza_direction TEXT CHECK (hauza_direction IN ('BUY', 'SELL', 'WAIT')),
  hauza_entry_price NUMERIC,
  hauza_stop_loss NUMERIC,
  hauza_take_profit_1 NUMERIC,
  hauza_take_profit_2 NUMERIC,
  hauza_confidence INTEGER CHECK (hauza_confidence BETWEEN 0 AND 100),
  instrument TEXT NOT NULL DEFAULT 'XAUUSD',
  previous_result TEXT,
  previous_direction TEXT,
  previous_performance TEXT,
  fundamentals_summary TEXT,
  technical_summary TEXT,
  forecast TEXT,
  previous_value TEXT,
  actual_value TEXT,
  admin_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.news_event_cards ENABLE ROW LEVEL SECURITY;

-- Everyone can read active cards
CREATE POLICY "Anyone can view active news cards"
  ON public.news_event_cards FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage news cards"
  ON public.news_event_cards FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
