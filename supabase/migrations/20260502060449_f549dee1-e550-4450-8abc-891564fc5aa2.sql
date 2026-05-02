-- 1) Bridge ticks table
CREATE TABLE IF NOT EXISTS public.bridge_ticks (
  id BIGSERIAL PRIMARY KEY,
  terminal_uid TEXT NOT NULL,
  symbol TEXT NOT NULL,
  broker TEXT,
  bid NUMERIC(20,8),
  ask NUMERIC(20,8),
  last_price NUMERIC(20,8),
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bridge_ticks_symbol_ts
  ON public.bridge_ticks (symbol, ts DESC);

CREATE INDEX IF NOT EXISTS idx_bridge_ticks_terminal_symbol_ts
  ON public.bridge_ticks (terminal_uid, symbol, ts DESC);

ALTER TABLE public.bridge_ticks ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read prices (public market data)
CREATE POLICY "Authenticated read bridge ticks"
ON public.bridge_ticks
FOR SELECT
TO authenticated
USING (true);

-- Anonymous users can also read (charts need to render for guests)
CREATE POLICY "Anon read bridge ticks"
ON public.bridge_ticks
FOR SELECT
TO anon
USING (true);

-- Only service role inserts (via edge function) — no client-side INSERT policy
-- (service role bypasses RLS automatically)

-- 2) Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.bridge_ticks;
ALTER TABLE public.bridge_ticks REPLICA IDENTITY FULL;

-- 3) Auto-prune: keep only last 5000 ticks per symbol
CREATE OR REPLACE FUNCTION public.prune_bridge_ticks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only prune occasionally (1% chance per insert) to avoid overhead
  IF random() < 0.01 THEN
    DELETE FROM public.bridge_ticks
    WHERE id IN (
      SELECT id FROM (
        SELECT id, row_number() OVER (PARTITION BY symbol ORDER BY ts DESC) AS rn
        FROM public.bridge_ticks
        WHERE symbol = NEW.symbol
      ) sub
      WHERE rn > 5000
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_bridge_ticks ON public.bridge_ticks;
CREATE TRIGGER trg_prune_bridge_ticks
AFTER INSERT ON public.bridge_ticks
FOR EACH ROW EXECUTE FUNCTION public.prune_bridge_ticks();