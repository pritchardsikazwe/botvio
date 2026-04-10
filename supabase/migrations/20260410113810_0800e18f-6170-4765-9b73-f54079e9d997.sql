
CREATE TABLE public.training_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  youtube_url text NOT NULL,
  thumbnail_url text,
  category text DEFAULT 'general',
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active training videos"
  ON public.training_videos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage training videos"
  ON public.training_videos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
