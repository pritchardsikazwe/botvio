import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const DERIV_CLIENT_ID = '33XSUutrVPDWusVXuDUwW';
const DERIV_REST_BASE = 'https://api.derivws.com';

/**
 * Deriv OTP issuer (new API).
 *
 * Legacy PATs no longer work with the new /trading/v1/options endpoints —
 * Deriv requires an OAuth2 + PKCE access_token tied to the user that owns
 * the target account. We pull that token from `deriv_connections` for the
 * authenticated Lovable user, then request a fresh OTP-bearing WS URL.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: claims, error: claimsErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (claimsErr || !claims?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.user.id;

    const { account_id, environment = 'real' } = await req
      .json()
      .catch(() => ({}));
    if (!account_id || typeof account_id !== 'string') {
      return new Response(JSON.stringify({ error: 'account_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find this user's most recent OAuth access token (prod first, fall back to dev)
    const { data: connections, error: connErr } = await supabase
      .from('deriv_connections')
      .select('oauth_access_token, env, last_verified_at')
      .eq('user_id', userId)
      .eq('connection_type', 'oauth')
      .not('oauth_access_token', 'is', null)
      .order('last_verified_at', { ascending: false });

    if (connErr) {
      return new Response(
        JSON.stringify({ error: 'connection_lookup_failed', details: connErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const accessToken = (connections ?? []).find((c: any) => c.oauth_access_token)
      ?.oauth_access_token;

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          error: 'no_oauth_token',
          message:
            'Connect your Deriv account via OAuth first — legacy PATs are no longer accepted by Deriv.',
        }),
        { status: 412, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Request an OTP-bearing WS URL for the target account
    const otpRes = await fetch(
      `${DERIV_REST_BASE}/trading/v1/options/accounts/${encodeURIComponent(account_id)}/otp`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Deriv-App-ID': DERIV_CLIENT_ID,
          'Content-Type': 'application/json',
        },
      },
    );

    const otpJson = await otpRes.json().catch(() => ({}));
    if (!otpRes.ok) {
      return new Response(
        JSON.stringify({ error: 'otp_request_failed', status: otpRes.status, details: otpJson }),
        { status: otpRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const ws_url = otpJson.data?.url || otpJson.url;
    if (!ws_url) {
      return new Response(
        JSON.stringify({ error: 'ws_url_missing_in_response', details: otpJson }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ ws_url, environment: environment === 'demo' ? 'demo' : 'real' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'internal_error', message: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
