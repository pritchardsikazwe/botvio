-- Auto-approve bridge requests for super admins
CREATE OR REPLACE FUNCTION public.auto_approve_bridge_for_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = 'super_admin'::app_role
  ) THEN
    NEW.status := 'approved';
    NEW.reviewed_by := NEW.user_id;
    NEW.reviewed_at := now();
    NEW.admin_note := COALESCE(NEW.admin_note, 'Auto-approved (super admin)');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_approve_bridge_super_admin ON public.bridge_connection_requests;
CREATE TRIGGER trg_auto_approve_bridge_super_admin
BEFORE INSERT ON public.bridge_connection_requests
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_bridge_for_super_admin();
