# Botvio Agent Authentication

Botvio uses OAuth 2.0 / OpenID Connect for agent authentication, backed by our
managed identity provider.

## Discovery

- Authorization server metadata: <https://botvio.live/.well-known/oauth-authorization-server>
- Protected resource metadata: <https://botvio.live/.well-known/oauth-protected-resource>
- JWKS: <https://tqqkzeblmjapgbnsbtgw.supabase.co/auth/v1/.well-known/jwks.json>

## Issuer

`https://tqqkzeblmjapgbnsbtgw.supabase.co/auth/v1`

## Agent registration

Agents that want to act on behalf of a Botvio user must:

1. Direct the user to the authorization endpoint with `response_type=code`,
   `code_challenge_method=S256`, and the desired scopes (`openid email profile`).
2. Exchange the returned authorization code at the token endpoint using PKCE.
3. Present the resulting access token as `Authorization: Bearer <token>` when
   calling Botvio APIs or the Botvio MCP server at
   `https://tqqkzeblmjapgbnsbtgw.supabase.co/functions/v1/mcp`.

## Supported grant types

- `authorization_code` (with PKCE) — recommended for agents
- `refresh_token`

## Contact

For agent onboarding or elevated scopes, contact <info@botvio.live>.