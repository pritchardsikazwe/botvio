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

    const { 
      terminal_uid, 
      balance, 
      equity, 
      margin,
      free_margin,
      positions 
    } = await req.json();

    if (!terminal_uid) {
      throw new Error('Missing terminal_uid');
    }

    // Update mt5_states
    await supabase
      .from('mt5_states')
      .upsert({
        terminal_uid,
        balance: balance || 0,
        equity: equity || 0,
        margin: margin || 0,
        free_margin: free_margin || 0,
        positions: positions || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'terminal_uid' });

    return new Response(JSON.stringify({
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Push state error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
