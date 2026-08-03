-- ============================================================
-- 1) bet-slips storage: owner-folder reads only (bucket is private)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view bet slip images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own bet slip images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own bet slip images" ON storage.objects;

CREATE POLICY "Users can view own bet slip images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'bet-slips'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.is_admin()
  )
);

CREATE POLICY "Users can delete own bet slip images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'bet-slips'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.is_admin()
  )
);

-- =====================================================================
-- 2) bridge_connection_requests: investor_password not readable via API
-- =====================================================================
REVOKE SELECT ON public.bridge_connection_requests FROM authenticated;
REVOKE SELECT ON public.bridge_connection_requests FROM anon;

GRANT SELECT (
  id,
  user_id,
  broker,
  account_login,
  server_name,
  account_type,
  notes,
  contact_whatsapp,
  contact_email,
  status,
  terminal_uid,
  admin_note,
  reviewed_by,
  reviewed_at,
  created_at,
  updated_at
) ON public.bridge_connection_requests TO authenticated;

GRANT INSERT, UPDATE ON public.bridge_connection_requests TO authenticated;
GRANT ALL ON public.bridge_connection_requests TO service_role;