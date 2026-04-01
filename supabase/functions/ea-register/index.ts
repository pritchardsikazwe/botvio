import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth: user must be logged in
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userId = claims.claims.sub;

    const { account_id, label } = await req.json();
    if (!account_id) {
      throw new Error('Missing account_id');
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify user owns the account
    const { data: account, error: accErr } = await adminClient
      .from('mt5_accounts')
      .select('id, user_id')
      .eq('id', account_id)
      .single();

    if (accErr || !account || account.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Account not found or not yours' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate a raw token (crypto random)
    const rawToken = crypto.randomUUID() + '-' + crypto.randomUUID();

    // Hash it for storage
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawToken));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Revoke old tokens for this account
    await adminClient
      .from('ea_tokens')
      .update({ revoked: true })
      .eq('account_id', account_id)
      .eq('revoked', false);

    // Insert new token
    const { data: newToken, error: insertErr } = await adminClient
      .from('ea_tokens')
      .insert({
        account_id,
        token_hash: tokenHash,
        label: label || 'EA Token',
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({
      success: true,
      token_id: newToken.id,
      raw_token: rawToken,  // Show once, never stored
      message: 'Token generated. Copy it now — it will not be shown again.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('EA register error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
});
