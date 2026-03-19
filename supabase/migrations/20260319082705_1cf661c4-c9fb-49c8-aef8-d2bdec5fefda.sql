
-- ============================================
-- BOTVIO LIVE STREAMING TABLES
-- ============================================

-- Trader profiles for live streaming (extends existing profiles)
CREATE TABLE IF NOT EXISTS public.trader_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  display_name text,
  trading_style text,
  favorite_broker text,
  favorite_market text,
  win_rate numeric(5,2) DEFAULT 0,
  risk_level text DEFAULT 'medium',
  badge_level text DEFAULT 'unverified',
  followers_count integer DEFAULT 0,
  total_streams integer DEFAULT 0,
  total_views integer DEFAULT 0,
  peak_viewers integer DEFAULT 0,
  total_watch_seconds bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Live streams
CREATE TABLE IF NOT EXISTS public.live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'scheduled',
  stream_mode text NOT NULL DEFAULT 'camera',
  room_name text UNIQUE NOT NULL,
  livekit_room_sid text,
  livekit_ingress_id text,
  livekit_creator_token text,
  thumbnail_url text,
  playback_url text,
  replay_url text,
  broker_name text,
  market_type text,
  instrument text,
  timeframe text,
  strategy_tag text,
  comments_enabled boolean DEFAULT true,
  reactions_enabled boolean DEFAULT true,
  is_public boolean DEFAULT true,
  is_recording_enabled boolean DEFAULT false,
  risk_warning_accepted boolean DEFAULT false,
  viewers_current integer DEFAULT 0,
  viewers_peak integer DEFAULT 0,
  total_unique_viewers integer DEFAULT 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stream participants
CREATE TABLE IF NOT EXISTS public.live_stream_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role text DEFAULT 'viewer',
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  is_active boolean DEFAULT true,
  watch_seconds integer DEFAULT 0
);

-- Live comments
CREATE TABLE IF NOT EXISTS public.live_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.live_comments(id) ON DELETE SET NULL,
  body text NOT NULL,
  is_pinned boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Live reactions
CREATE TABLE IF NOT EXISTS public.live_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reaction_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Stream follows
CREATE TABLE IF NOT EXISTS public.stream_follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, creator_id)
);

-- Stream reports
CREATE TABLE IF NOT EXISTS public.stream_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES public.live_streams(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.live_comments(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  report_type text NOT NULL,
  reason text NOT NULL,
  details text,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Stream replays
CREATE TABLE IF NOT EXISTS public.stream_replays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid UNIQUE NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  storage_provider text DEFAULT 'supabase',
  replay_url text,
  duration_seconds integer DEFAULT 0,
  file_size_bytes bigint DEFAULT 0,
  thumbnail_url text,
  visibility text DEFAULT 'public',
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Moderation actions
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  stream_id uuid REFERENCES public.live_streams(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  action_type text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Stream analytics daily
CREATE TABLE IF NOT EXISTS public.stream_analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  analytics_date date NOT NULL,
  unique_viewers integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  total_reactions integer DEFAULT 0,
  avg_watch_seconds integer DEFAULT 0,
  peak_viewers integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (stream_id, analytics_date)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_live_streams_status_started_at ON public.live_streams(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_streams_creator ON public.live_streams(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_comments_stream_created ON public.live_comments(stream_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_live_reactions_stream ON public.live_reactions(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_participants_stream_active ON public.live_stream_participants(stream_id, is_active);

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS trg_trader_profiles_updated_at ON public.trader_profiles;
CREATE TRIGGER trg_trader_profiles_updated_at
BEFORE UPDATE ON public.trader_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_live_streams_updated_at ON public.live_streams;
CREATE TRIGGER trg_live_streams_updated_at
BEFORE UPDATE ON public.live_streams
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.refresh_follower_count(target_creator_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.trader_profiles
  SET followers_count = (
    SELECT count(*) FROM public.stream_follows WHERE creator_id = target_creator_id
  )
  WHERE user_id = target_creator_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_stream(p_stream_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_peak integer;
  v_unique integer;
  v_comments integer;
  v_reactions integer;
  v_avg_watch integer;
BEGIN
  SELECT coalesce(max(viewers_peak),0) INTO v_peak FROM public.live_streams WHERE id = p_stream_id;
  SELECT count(distinct user_id) INTO v_unique FROM public.live_stream_participants WHERE stream_id = p_stream_id;
  SELECT count(*) INTO v_comments FROM public.live_comments WHERE stream_id = p_stream_id AND is_deleted = false;
  SELECT count(*) INTO v_reactions FROM public.live_reactions WHERE stream_id = p_stream_id;
  SELECT coalesce(avg(watch_seconds),0)::integer INTO v_avg_watch FROM public.live_stream_participants WHERE stream_id = p_stream_id;

  UPDATE public.live_streams SET total_unique_viewers = v_unique, viewers_current = 0 WHERE id = p_stream_id;

  INSERT INTO public.stream_analytics_daily (stream_id, analytics_date, unique_viewers, total_comments, total_reactions, avg_watch_seconds, peak_viewers)
  VALUES (p_stream_id, current_date, v_unique, v_comments, v_reactions, v_avg_watch, v_peak)
  ON CONFLICT (stream_id, analytics_date) DO UPDATE SET
    unique_viewers = excluded.unique_viewers,
    total_comments = excluded.total_comments,
    total_reactions = excluded.total_reactions,
    avg_watch_seconds = excluded.avg_watch_seconds,
    peak_viewers = excluded.peak_viewers;
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.trader_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_replays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Trader profiles
CREATE POLICY "trader profiles read" ON public.trader_profiles FOR SELECT USING (true);
CREATE POLICY "trader profiles manage own" ON public.trader_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Live streams
CREATE POLICY "live streams read public or own" ON public.live_streams FOR SELECT USING (is_public = true OR auth.uid() = creator_id);
CREATE POLICY "live streams insert own" ON public.live_streams FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "live streams update own" ON public.live_streams FOR UPDATE USING (auth.uid() = creator_id);

-- Participants
CREATE POLICY "participants read" ON public.live_stream_participants FOR SELECT USING (true);
CREATE POLICY "participants insert own" ON public.live_stream_participants FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "participants update own" ON public.live_stream_participants FOR UPDATE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "comments read public" ON public.live_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.live_streams s WHERE s.id = stream_id AND s.is_public = true)
);
CREATE POLICY "comments insert own" ON public.live_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments update own" ON public.live_comments FOR UPDATE USING (auth.uid() = user_id);

-- Reactions
CREATE POLICY "reactions read" ON public.live_reactions FOR SELECT USING (true);
CREATE POLICY "reactions insert own" ON public.live_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Follows
CREATE POLICY "follows read" ON public.stream_follows FOR SELECT USING (true);
CREATE POLICY "follows manage own" ON public.stream_follows FOR ALL USING (auth.uid() = follower_id) WITH CHECK (auth.uid() = follower_id);

-- Reports
CREATE POLICY "reports insert own" ON public.stream_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports read own" ON public.stream_reports FOR SELECT USING (auth.uid() = reporter_id);

-- Replays
CREATE POLICY "replays read public" ON public.stream_replays FOR SELECT USING (visibility = 'public');

-- Analytics
CREATE POLICY "analytics read public" ON public.stream_analytics_daily FOR SELECT USING (true);

-- Moderation (admin only via is_admin function)
CREATE POLICY "moderation read admin" ON public.moderation_actions FOR SELECT USING (public.is_admin());
CREATE POLICY "moderation insert admin" ON public.moderation_actions FOR INSERT WITH CHECK (public.is_admin());

-- Enable realtime for live tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_participants;
