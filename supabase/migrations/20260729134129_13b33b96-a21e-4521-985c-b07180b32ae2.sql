
CREATE TABLE public.editorial_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_slug TEXT NOT NULL,
  article_title TEXT NOT NULL,
  correction_type TEXT NOT NULL DEFAULT 'factual',
  original_text TEXT,
  corrected_text TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  corrected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.editorial_corrections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.editorial_corrections TO authenticated;
GRANT ALL ON public.editorial_corrections TO service_role;

ALTER TABLE public.editorial_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Corrections are publicly readable when published"
  ON public.editorial_corrections FOR SELECT
  USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admins can insert corrections"
  ON public.editorial_corrections FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update corrections"
  ON public.editorial_corrections FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete corrections"
  ON public.editorial_corrections FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE TRIGGER trg_editorial_corrections_updated_at
  BEFORE UPDATE ON public.editorial_corrections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_editorial_corrections_slug ON public.editorial_corrections(article_slug);
CREATE INDEX idx_editorial_corrections_status ON public.editorial_corrections(status, corrected_at DESC);
