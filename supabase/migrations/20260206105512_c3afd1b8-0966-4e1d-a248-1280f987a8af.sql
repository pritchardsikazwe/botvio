
-- ENTITLEMENTS table: central access control for purchased products
CREATE TABLE IF NOT EXISTS public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','canceled','revoked')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  source_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- Users can view their own entitlements
CREATE POLICY "Users can view own entitlements"
  ON public.entitlements FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own entitlements (for free products)
CREATE POLICY "Users can insert own entitlements"
  ON public.entitlements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all entitlements
CREATE POLICY "Admins can manage entitlements"
  ON public.entitlements FOR ALL
  USING (is_admin());

-- Auto update timestamp
CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add billing_type and affiliate_percent to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'one_time' CHECK (billing_type IN ('one_time','recurring'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS billing_interval text CHECK (billing_interval IN ('month','year'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS affiliate_percent numeric(5,2) NOT NULL DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entitlements_user ON public.entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_product ON public.entitlements(product_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_status ON public.entitlements(status);
