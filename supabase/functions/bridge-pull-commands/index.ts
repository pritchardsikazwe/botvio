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

    const { terminal_uid } = await req.json();

    if (!terminal_uid) {
      throw new Error('Missing terminal_uid');
    }

    // Get queued commands for this terminal
    const { data: commands, error } = await supabase
      .from('mt5_commands')
      .select('*')
      .eq('terminal_uid', terminal_uid)
      .eq('status', 'QUEUED')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      throw error;
    }

    // Mark as SENT
    if (commands && commands.length > 0) {
      const commandIds = commands.map(c => c.id);
      await supabase
        .from('mt5_commands')
        .update({ status: 'SENT' })
        .in('id', commandIds);
    }

    return new Response(JSON.stringify({
      success: true,
      commands: commands || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Pull commands error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
