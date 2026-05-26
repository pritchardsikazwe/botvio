## Goal
Verify the `deriv-admin-otp` edge function returns a valid OTP / WebSocket URL for account `CR1072161` using the newly-updated `DERIV_ADMIN_PAT`.

## Steps
1. Deploy the latest `deriv-admin-otp` (with `X-API-Key` header fix) to ensure the live version matches the source.
2. Curl the function with `{ "account_id": "CR1072161", "environment": "real" }`.
3. Inspect the response:
   - **200 + `ws_url`** → PAT works; report success and confirm the connect flow is unblocked.
   - **401/403** → PAT is invalid, expired, or missing the required scope (`admin` / `trading`); ask user to regenerate with correct scopes.
   - **404 / account-not-found** → PAT doesn't own/manage `CR1072161`; the PAT must belong to an account with admin access to it.
   - **Other error** → pull `edge_function_logs` for `deriv-admin-otp` and inspect Deriv's error body, then iterate (e.g. try alternate header `Authorization: Bearer`, alternate endpoint path).
4. Report findings and propose the next concrete fix (rotate PAT, change scope, or adjust endpoint/header).

## Notes
- No code changes planned in this step — purely diagnostic.
- If Deriv's response indicates the REST OTP endpoint path or auth scheme is different from what we're using, I'll patch `supabase/functions/deriv-admin-otp/index.ts` in a follow-up.
