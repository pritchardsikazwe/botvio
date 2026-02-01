-- Create analysis_jobs table for async AI analysis
CREATE TABLE public.analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    image_url TEXT NOT NULL,
    symbol TEXT,
    timeframe TEXT,
    analysis_type TEXT DEFAULT 'full',
    result_json JSONB,
    ai_response TEXT,
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Enable RLS on analysis_jobs
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own analysis jobs"
ON public.analysis_jobs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own jobs
CREATE POLICY "Users can create own analysis jobs"
ON public.analysis_jobs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Service role can update jobs (for edge function)
CREATE POLICY "Service role can update analysis jobs"
ON public.analysis_jobs FOR UPDATE TO authenticated
USING (true);

-- Create edge_logs table for error tracking
CREATE TABLE public.edge_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL,
    user_id UUID,
    error_code TEXT,
    error_message TEXT,
    stack_trace TEXT,
    request_payload JSONB,
    response_status INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on edge_logs
ALTER TABLE public.edge_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view edge logs
CREATE POLICY "Super admins can view edge logs"
ON public.edge_logs FOR SELECT TO authenticated
USING (public.is_super_admin());

-- Service role can insert logs (allow all for service role)
CREATE POLICY "Allow edge log inserts"
ON public.edge_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_analysis_jobs_user_status ON public.analysis_jobs(user_id, status);
CREATE INDEX idx_analysis_jobs_created ON public.analysis_jobs(created_at DESC);
CREATE INDEX idx_edge_logs_function ON public.edge_logs(function_name, created_at DESC);