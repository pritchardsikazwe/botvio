import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const PAT = Deno.env.get('DERIV_ADMIN_PAT');
const DERIV_REST_BASE = 'https://api.derivws.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!PAT) {
      return new Response(JSON.stringify({ error: 'DERIV_ADMIN_PAT not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { account_id, environment = 'real' } = await req.json().catch(() => ({}));
    if (!account_id || typeof account_id !== 'string') {
      return new Response(JSON.stringify({ error: 'account_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Request OTP for the given account using PAT auth
    const otpRes = await fetch(
      `${DERIV_REST_BASE}/trading/v1/options/accounts/${encodeURIComponent(account_id)}/otp`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAT}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const otpJson = await otpRes.json().catch(() => ({}));
    if (!otpRes.ok) {
      return new Response(JSON.stringify({ error: 'otp_request_failed', details: otpJson }), {
        status: otpRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const otp = otpJson.otp || otpJson.data?.otp;
    if (!otp) {
      return new Response(JSON.stringify({ error: 'otp_missing_in_response', details: otpJson }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const envPath = environment === 'demo' ? 'demo' : 'real';
    const ws_url = `wss://api.derivws.com/trading/v1/options/ws/${envPath}?otp=${encodeURIComponent(otp)}`;

    return new Response(
      JSON.stringify({ ws_url, otp, expires_in: otpJson.expires_in ?? null, environment: envPath }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'internal_error', message: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
