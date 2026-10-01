-- Unified removal helpers for Botvio trading connections.
-- Removes Botvio's saved connection only; it never closes/deletes a user's
-- underlying Deriv/MT5 broker account.

CREATE OR REPLACE FUNCTION public.remove_deriv_account(p_loginid text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  removed_tokens integer := 0;
  removed_accounts integer := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.user_deriv_tokens
   WHERE user_id = uid
     AND loginid = p_loginid;
  GET DIAGNOSTICS removed_tokens = ROW_COUNT;

  DELETE FROM public.trading_accounts
   WHERE user_id = uid
     AND broker = 'deriv'
     AND login_id = p_loginid;
  GET DIAGNOSTICS removed_accounts = ROW_COUNT;

  DELETE FROM public.deriv_connections
   WHERE user_id = uid
     AND login_id = p_loginid;

  RETURN jsonb_build_object(
    'removed_tokens', removed_tokens,
    'removed_accounts', removed_accounts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.remove_deriv_account(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_deriv_account(text) TO authenticated;
