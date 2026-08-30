CREATE TABLE public.copy_strategies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  platform text NOT NULL DEFAULT 'deriv',
  broker_label text,
  trading_style text,
  markets text[] NOT NULL DEFAULT '{}',
  risk_model text NOT NULL DEFAULT 'percentage',
  max_risk_per_trade numeric NOT NULL DEFAULT 1,
  max_daily_loss_percent numeric NOT NULL DEFAULT 5,
  max_drawdown_percent numeric NOT NULL DEFAULT 10,
  stop_on_drawdown boolean NOT NULL DEFAULT true,
  stop_on_daily_loss boolean NOT NULL DEFAULT true,
  respect_provider_sl boolean NOT NULL DEFAULT true,
  emergency_stop boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'public',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.copy_strategies TO authenticated;
GRANT SELECT ON public.copy_strategies TO anon;
GRANT ALL ON public.copy_strategies TO service_role;

ALTER TABLE public.copy_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public active strategies"
ON public.copy_strategies FOR SELECT
USING (visibility = 'public' AND status <> 'archived');

CREATE POLICY "Owners can view their strategies"
ON public.copy_strategies FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owners can create strategies"
ON public.copy_strategies FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid()));

CREATE POLICY "Owners can update their strategies"
ON public.copy_strategies FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can delete their strategies"
ON public.copy_strategies FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage strategies"
ON public.copy_strategies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX copy_strategies_provider_idx ON public.copy_strategies(provider_id);

CREATE TRIGGER update_copy_strategies_updated_at
BEFORE UPDATE ON public.copy_strategies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();