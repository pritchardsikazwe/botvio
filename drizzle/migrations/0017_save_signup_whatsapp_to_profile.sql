CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, email, whatsapp_number, country, display_name)
    VALUES (NEW.id, NEW.email,
      NULLIF(left(trim(NEW.raw_user_meta_data->>'whatsapp_number'), 25), ''),
      NULLIF(left(trim(NEW.raw_user_meta_data->>'country'), 80), ''),
      NULLIF(left(trim(COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name')), 120), ''));
    INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$function$;

UPDATE public.profiles p
SET whatsapp_number = left(trim(u.raw_user_meta_data->>'whatsapp_number'), 25)
FROM auth.users u
WHERE u.id = p.user_id
  AND coalesce(trim(p.whatsapp_number), '') = ''
  AND coalesce(trim(u.raw_user_meta_data->>'whatsapp_number'), '') <> '';