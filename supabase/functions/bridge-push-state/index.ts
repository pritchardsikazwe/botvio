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

    // Compatibility fallback for older Bridge EA builds: they acknowledge OPEN with
    // a deal/order ticket, while MODIFY needs the actual position ticket. The EA
    // pushes open positions here, so attach missing SL/TP using that live ticket.
    if (Array.isArray(positions) && positions.length > 0) {
      const { data: openCommands } = await supabase
        .from('mt5_commands')
        .select('id, command, created_at')
        .eq('terminal_uid', terminal_uid)
        .eq('status', 'ACKED')
        .eq('command->>action', 'OPEN')
        .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      for (const cmd of openCommands ?? []) {
        const command = cmd.command ?? {};
        const sl = Number(command.sl);
        const tp = Number(command.tp);
        if (!(Number.isFinite(sl) && sl > 0) && !(Number.isFinite(tp) && tp > 0)) continue;

        const matched = positions.find((p: any) => {
          const sameSymbol = String(p?.symbol ?? '') === String(command.symbol ?? '');
          const sameType = String(p?.type ?? '') === String(command.type ?? '');
          const sameVolume = Math.abs(Number(p?.volume ?? 0) - Number(command.volume ?? 0)) < 0.000001;
          const missingSl = Number.isFinite(sl) && sl > 0 && Math.abs(Number(p?.sl ?? 0) - sl) > 0.00001;
          const missingTp = Number.isFinite(tp) && tp > 0 && Math.abs(Number(p?.tp ?? 0) - tp) > 0.00001;
          return sameSymbol && sameType && sameVolume && (missingSl || missingTp) && Number(p?.ticket) > 0;
        });
        if (!matched) continue;

        const { data: existing } = await supabase
          .from('mt5_commands')
          .select('id')
          .eq('terminal_uid', terminal_uid)
          .eq('command->>parent_command_id', cmd.id)
          .limit(1);
        if ((existing?.length ?? 0) > 0) continue;

        const modifyCommand: Record<string, unknown> = {
          action: 'MODIFY',
          ticket: Number(matched.ticket),
          parent_command_id: cmd.id,
          source: 'attach-open-sl-tp',
          requested_at: new Date().toISOString(),
        };
        if (Number.isFinite(sl) && sl > 0) modifyCommand.sl = sl;
        if (Number.isFinite(tp) && tp > 0) modifyCommand.tp = tp;

        await supabase.from('mt5_commands').insert({
          terminal_uid,
          command: modifyCommand,
          status: 'QUEUED',
        });
      }
    }

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
