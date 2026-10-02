-- Restore PostgREST relationship used by the admin payment requests panel.
-- payment_requests.user_id and profiles.user_id both identify the same authenticated user.
ALTER TABLE public.payment_requests
ADD CONSTRAINT payment_requests_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
