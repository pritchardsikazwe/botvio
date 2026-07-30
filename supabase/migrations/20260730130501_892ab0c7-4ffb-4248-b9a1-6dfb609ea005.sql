-- 1. Follower risk + approval fields
ALTER TABLE public.copy_subscriptions
  ADD COLUMN IF NOT EXISTS max_drawdown_percent numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS equity_floor_usd numeric,
  ADD COLUMN IF NOT EXISTS daily_loss_limit_usd numeric,
  ADD COLUMN IF NOT EXISTS baseline_equity_usd numeric,
  ADD COLUMN IF NOT EXISTS drawdown_breached_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_note text;

ALTER TABLE public.copy_subscriptions
  DROP CONSTRAINT IF EXISTS copy_subscriptions_approval_status_check;
ALTER TABLE public.copy_subscriptions
  ADD CONSTRAINT copy_subscriptions_approval_status_check
  CHECK (approval_status IN ('pending','approved','rejected','suspended'));

ALTER TABLE public.copy_subscriptions
  DROP CONSTRAINT IF EXISTS copy_subscriptions_drawdown_range_check;
ALTER TABLE public.copy_subscriptions
  ADD CONSTRAINT copy_subscriptions_drawdown_range_check
  CHECK (max_drawdown_percent > 0 AND max_drawdown_percent <= 90);

-- 2. Only admins may change approval fields
CREATE OR REPLACE FUNCTION public.guard_copy_subscription_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.approval_status := 'pending';
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
    NEW.admin_note := NULL;
    RETURN NEW;
  END IF;

  NEW.approval_status := OLD.approval_status;
  NEW.approved_by := OLD.approved_by;
  NEW.approved_at := OLD.approved_at;
  NEW.admin_note := OLD.admin_note;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_copy_subscription_approval_trg ON public.copy_subscriptions;
CREATE TRIGGER guard_copy_subscription_approval_trg
BEFORE INSERT OR UPDATE ON public.copy_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.guard_copy_subscription_approval();

-- 3. Admin visibility / management of follower subscriptions
DROP POLICY IF EXISTS "Admins can manage copy subscriptions" ON public.copy_subscriptions;
CREATE POLICY "Admins can manage copy subscriptions"
ON public.copy_subscriptions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Security fix: lock MT5 command queue + terminal state to service role
DROP POLICY IF EXISTS "Service role can manage mt5_commands" ON public.mt5_commands;
CREATE POLICY "Service role can manage mt5_commands"
ON public.mt5_commands
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

REVOKE ALL ON public.mt5_commands FROM anon, authenticated;
GRANT ALL ON public.mt5_commands TO service_role;

DROP POLICY IF EXISTS "Service role can manage mt5_states" ON public.mt5_states;
CREATE POLICY "Service role can manage mt5_states"
ON public.mt5_states
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

REVOKE ALL ON public.mt5_states FROM anon, authenticated;
GRANT ALL ON public.mt5_states TO service_role;