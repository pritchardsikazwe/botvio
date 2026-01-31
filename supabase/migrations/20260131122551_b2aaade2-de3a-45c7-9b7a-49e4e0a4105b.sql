-- Create deriv_connections table
CREATE TABLE public.deriv_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  env text NOT NULL CHECK (env IN ('prod', 'dev')),
  connection_type text NOT NULL CHECK (connection_type IN ('oauth', 'token')),
  token_masked text NULL,
  token_hash text NULL,
  oauth_access_token text NULL,
  oauth_refresh_token text NULL,
  expires_at timestamptz NULL,
  scope text[] NULL,
  is_connected boolean NOT NULL DEFAULT false,
  last_verified_at timestamptz NULL,
  last_error text NULL,
  login_id text NULL,
  account_type text NULL,
  balance numeric NULL,
  currency text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, env)
);

-- Create deriv_connection_logs table
CREATE TABLE public.deriv_connection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  env text NOT NULL,
  event text NOT NULL,
  details jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deriv_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deriv_connection_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for deriv_connections
CREATE POLICY "Users can read own deriv_connections"
  ON public.deriv_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deriv_connections"
  ON public.deriv_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deriv_connections"
  ON public.deriv_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deriv_connections"
  ON public.deriv_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all deriv_connections"
  ON public.deriv_connections FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all deriv_connections"
  ON public.deriv_connections FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for deriv_connection_logs
CREATE POLICY "Users can read own deriv_connection_logs"
  ON public.deriv_connection_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deriv_connection_logs"
  ON public.deriv_connection_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all deriv_connection_logs"
  ON public.deriv_connection_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_deriv_connections_updated_at
  BEFORE UPDATE ON public.deriv_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_deriv_connections_user_id ON public.deriv_connections(user_id);
CREATE INDEX idx_deriv_connections_env ON public.deriv_connections(env);
CREATE INDEX idx_deriv_connection_logs_user_id ON public.deriv_connection_logs(user_id);
CREATE INDEX idx_deriv_connection_logs_created_at ON public.deriv_connection_logs(created_at DESC);