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

    const { token, command_id, status, follower_trade_id, message } = await req.json();

    if (!token || !command_id || !status) {
      throw new Error('Missing required fields: token, command_id, status');
    }

    // Authenticate
    const tokenHash = await hashToken(token);
    const { data: eaToken, error: authErr } = await supabase
      .from('ea_tokens')
      .select('id, account_id')
      .eq('token_hash', tokenHash)
      .eq('revoked', false)
      .single();

    if (authErr || !eaToken) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update heartbeat
    await supabase
      .from('ea_tokens')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', eaToken.id);

    // Get the command
    const { data: command, error: cmdErr } = await supabase
      .from('follower_commands')
      .select('*')
      .eq('id', command_id)
      .eq('follower_account_id', eaToken.account_id)
      .single();

    if (cmdErr || !command) {
      return new Response(JSON.stringify({ error: 'Command not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update command status
    const newStatus = status === 'done' ? 'done' : 'failed';
    await supabase
      .from('follower_commands')
      .update({
        status: newStatus,
        done_at: new Date().toISOString(),
        error: status === 'failed' ? (message || 'Unknown error') : null,
      })
      .eq('id', command_id);

    // Update copy_trade_map if we have a provider_trade_id
    if (command.provider_trade_id) {
      // Find the copy_link for this follower
      const { data: links } = await supabase
        .from('copy_links')
        .select('id')
        .eq('follower_account_id', eaToken.account_id)
        .eq('status', 'active');

      if (links && links.length > 0) {
        const linkIds = links.map(l => l.id);

        if (command.command_type === 'OPEN' && follower_trade_id) {
          // Update map with follower trade ID
          await supabase
            .from('copy_trade_map')
            .update({
              follower_trade_id: follower_trade_id.toString(),
              state: status === 'done' ? 'open' : 'error',
              last_error: status === 'failed' ? message : null,
              updated_at: new Date().toISOString(),
            })
            .eq('provider_trade_id', command.provider_trade_id)
            .in('copy_link_id', linkIds);
        } else if (command.command_type === 'CLOSE') {
          // Mark map as closed
          await supabase
            .from('copy_trade_map')
            .update({
              state: 'closed',
              updated_at: new Date().toISOString(),
            })
            .eq('provider_trade_id', command.provider_trade_id)
            .in('copy_link_id', linkIds);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Follower report error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
});
