# Broker onboarding gate — implementation status

## User flow implemented in this branch

- New signup success now routes to `/broker-onboarding`.
- Google signup returns to `/broker-onboarding`.
- The page follows the Botvio mockup: choose Exness (Forex & Gold) or Deriv (synthetic indices), then choose new account or existing account.
- Existing partner links are reused from the current Botvio `/start-trading` page:
  - Exness: `https://one.exness-track.com/a/ts1kvs1k`
  - Deriv: `https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/`
- Onboarding intent and affiliate outbound clicks are recorded in `analytics_events` using the app's existing event pattern.
- The UI explicitly does not treat a link click or user declaration as proof of attribution and does not ask for broker passwords.

## Important limitation — do not deploy as a completed access gate

This branch implements the onboarding UX and routing only. It does **not** yet enforce the free-tool requirement server-side, because no trusted Exness/Deriv attribution verification mechanism or credentials were confirmed in the repository context. The existing-account action records an eligibility-review request in analytics and explains the manual review path; it does not actually query a broker or tag an account.

Before production access gating:
1. Confirm each broker's current partner program supports the required referral/postback/reporting event and how to map a referred client to a Botvio user without exposing personal data.
2. Implement and test trusted server-side verification (signed provider callback or approved server API); never unlock based on a browser event.
3. Add a durable entitlement status and audit trail with RLS preventing users from setting their own status to verified.
4. Enforce that entitlement on every protected server API/action, not only React routes.
5. Define whether existing accounts can be attributed, what happens when attribution is impossible, and any paid alternative.
6. Add tests for invalid/replayed callbacks, pending/error states, RLS, and all existing auth and trading flows.

No production database changes, merge, or deployment are performed by this branch. Keep access behavior unchanged until the trusted verification and server-side entitlement checks are implemented and reviewed.
