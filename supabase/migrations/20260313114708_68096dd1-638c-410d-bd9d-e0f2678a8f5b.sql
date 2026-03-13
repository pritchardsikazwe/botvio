-- Create newsletter_subscribers table
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text,
  whatsapp_number text,
  country text,
  user_id uuid,
  source text DEFAULT 'signup',
  is_active boolean DEFAULT true,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint on email
CREATE UNIQUE INDEX idx_newsletter_email ON public.newsletter_subscribers(email) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Admins can read all
CREATE POLICY "Admins can manage newsletter" ON public.newsletter_subscribers
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Users can manage own subscription
CREATE POLICY "Users can manage own newsletter sub" ON public.newsletter_subscribers
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can insert (signup without login)
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon
  WITH CHECK (true);

-- Create a function to auto-sync profile data to newsletter on signup
CREATE OR REPLACE FUNCTION public.sync_profile_to_newsletter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.newsletter_subscribers (email, display_name, whatsapp_number, country, user_id, source)
  VALUES (NEW.email, NEW.display_name, NEW.whatsapp_number, NEW.country, NEW.user_id, 'signup')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to auto-add users to newsletter on profile creation
CREATE TRIGGER on_profile_created_newsletter
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_newsletter();