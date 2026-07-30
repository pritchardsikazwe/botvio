REVOKE SELECT ON public.bridge_connection_requests FROM authenticated;
GRANT SELECT (id,user_id,broker,account_login,server_name,account_type,notes,contact_whatsapp,contact_email,status,terminal_uid,admin_note,reviewed_by,reviewed_at,created_at,updated_at) ON public.bridge_connection_requests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bridge_connection_requests TO authenticated;
GRANT ALL ON public.bridge_connection_requests TO service_role;