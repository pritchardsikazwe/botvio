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

    const { command_id, status, result, ticket } = await req.json();

    if (!command_id || !status) {
      throw new Error('Missing command_id or status');
    }

    // Get the command
    const { data: command, error: cmdError } = await supabase
      .from('mt5_commands')
      .select('*')
      .eq('id', command_id)
      .single();

    if (cmdError || !command) {
      throw new Error('Command not found');
    }

    // Update command status
    await supabase
      .from('mt5_commands')
      .update({
        status: status === 'SUCCESS' ? 'ACKED' : 'FAILED',
        result: result || {},
        acked_at: new Date().toISOString()
      })
      .eq('id', command_id);

    // Older Bridge EA builds open the trade first and do not attach SL/TP on OPEN.
    // If the original command carried SL/TP, enqueue a follow-up MODIFY command
    // after MT5 returns the ticket so the existing EA can apply the brackets.
    if (command.command?.action === 'OPEN' && status === 'SUCCESS' && ticket) {
      const sl = Number(command.command?.sl);
      const tp = Number(command.command?.tp);
      const modifyCommand: Record<string, unknown> = {
        action: 'MODIFY',
        ticket: Number(ticket),
        source: command.command?.source ?? 'mt5-open-brackets',
        requested_at: new Date().toISOString(),
      };
      if (Number.isFinite(sl) && sl > 0) modifyCommand.sl = sl;
      if (Number.isFinite(tp) && tp > 0) modifyCommand.tp = tp;
      if (modifyCommand.sl || modifyCommand.tp) {
        await supabase.from('mt5_commands').insert({
          terminal_uid: command.terminal_uid,
          command: modifyCommand,
          status: 'QUEUED',
        });
      }
    }

    // If this was a trade command, create execution record
    if (command.command?.action === 'OPEN' && status === 'SUCCESS' && ticket) {
      // Find the trading account
      const { data: account } = await supabase
        .from('trading_accounts')
        .select('user_id')
        .eq('login_id', command.terminal_uid)
        .eq('broker', 'mt5')
        .single();

      if (account) {
        await supabase
          .from('executions')
          .insert({
            user_id: account.user_id,
            broker_ref: ticket.toString(),
            stake_or_lot: command.command?.volume || 0.01,
            status: 'OPEN',
            raw: result
          });
      }
    }

    return new Response(JSON.stringify({
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Ack command error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
