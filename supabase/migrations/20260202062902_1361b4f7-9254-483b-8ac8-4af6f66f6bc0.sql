-- ================================================================
-- User Strategy Selections (persist per-user enabled strategies)
-- ================================================================

CREATE TABLE public.user_strategy_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    strategy_code TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, strategy_code)
);

-- Enable RLS
ALTER TABLE public.user_strategy_selections ENABLE ROW LEVEL SECURITY;

-- Users can manage their own strategy selections
CREATE POLICY "Users can view own strategy selections"
ON public.user_strategy_selections FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategy selections"
ON public.user_strategy_selections FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategy selections"
ON public.user_strategy_selections FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategy selections"
ON public.user_strategy_selections FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_strategy_selections_updated_at
BEFORE UPDATE ON public.user_strategy_selections
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ================================================================
-- Enable realtime for strategy selections (live updates)
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_strategy_selections;