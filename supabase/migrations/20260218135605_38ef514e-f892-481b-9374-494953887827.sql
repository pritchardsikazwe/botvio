
-- Fix executions RLS: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage all executions" ON public.executions;
DROP POLICY IF EXISTS "Users can insert own executions" ON public.executions;
DROP POLICY IF EXISTS "Users can update own executions" ON public.executions;
DROP POLICY IF EXISTS "Users can view own executions" ON public.executions;

CREATE POLICY "Admins can manage all executions" ON public.executions FOR ALL USING (is_admin());
CREATE POLICY "Users can insert own executions" ON public.executions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own executions" ON public.executions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own executions" ON public.executions FOR SELECT USING (auth.uid() = user_id);

-- Fix trade_intents RLS: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage all trade_intents" ON public.trade_intents;
DROP POLICY IF EXISTS "Users can insert own trade_intents" ON public.trade_intents;
DROP POLICY IF EXISTS "Users can update own trade_intents" ON public.trade_intents;
DROP POLICY IF EXISTS "Users can view own trade_intents" ON public.trade_intents;

CREATE POLICY "Admins can manage all trade_intents" ON public.trade_intents FOR ALL USING (is_admin());
CREATE POLICY "Users can insert own trade_intents" ON public.trade_intents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trade_intents" ON public.trade_intents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own trade_intents" ON public.trade_intents FOR SELECT USING (auth.uid() = user_id);
