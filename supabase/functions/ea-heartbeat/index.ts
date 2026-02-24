import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashToken(raw: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { token } = await req.json();
    if (!token) throw new Error('Missing token');

    const tokenHash = await hashToken(token);

    // Find active token
    const { data: eaToken, error } = await supabase
      .from('ea_tokens')
      .select('id, account_id')
      .eq('token_hash', tokenHash)
      .eq('revoked', false)
      .single();

    if (error || !eaToken) {
      return new Response(JSON.stringify({ error: 'Invalid or revoked token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update last_seen_at
    await supabase
      .from('ea_tokens')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', eaToken.id);

    return new Response(JSON.stringify({
      success: true,
      server_time: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('EA heartbeat error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
});
