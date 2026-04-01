
CREATE TABLE public.advert_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT,
  badge_text TEXT,
  badge_color TEXT DEFAULT 'primary',
  icon_emoji TEXT DEFAULT '📢',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.advert_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active adverts" ON public.advert_slots
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage adverts" ON public.advert_slots
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
