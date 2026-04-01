import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bridge-secret',
};

const BRIDGE_SHARED_SECRET = Deno.env.get("BRIDGE_SHARED_SECRET");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate bridge secret
    const bridgeSecret = req.headers.get('x-bridge-secret');
    if (!BRIDGE_SHARED_SECRET || bridgeSecret !== BRIDGE_SHARED_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { terminal_uid, status, timestamp } = await req.json();

    if (!terminal_uid) {
      throw new Error('Missing terminal_uid');
    }

    // Update trading account status
    await supabase
      .from('trading_accounts')
      .update({
        connection_status: status === 'ONLINE' ? 'connected' : 'error',
        updated_at: new Date().toISOString()
      })
      .eq('login_id', terminal_uid)
      .eq('broker', 'mt5');

    // Update mt5_states
    await supabase
      .from('mt5_states')
      .upsert({
        terminal_uid: terminal_uid,
        updated_at: new Date().toISOString()
      }, { onConflict: 'terminal_uid' });

    return new Response(JSON.stringify({
      success: true,
      server_time: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Heartbeat error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
