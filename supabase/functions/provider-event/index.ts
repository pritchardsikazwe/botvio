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

    const body = await req.json();
    const { token, provider_trade_id, event_type, ...rest } = body;

    if (!token || !provider_trade_id || !event_type) {
      throw new Error('Missing required fields: token, provider_trade_id, event_type');
    }

    // Authenticate EA
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

    // Verify account is a provider
    const { data: account } = await supabase
      .from('mt5_accounts')
      .select('id, role')
      .eq('id', eaToken.account_id)
      .single();

    if (!account || account.role !== 'provider') {
      return new Response(JSON.stringify({ error: 'Account is not a provider' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const providerAccountId = eaToken.account_id;

    // Store trade event
    await supabase.from('trade_events').insert({
      provider_account_id: providerAccountId,
      provider_trade_id,
      event_type,
      payload: rest,
    });

    // Get all active copy_links for this provider
    const { data: copyLinks } = await supabase
      .from('copy_links')
      .select('*')
      .eq('provider_account_id', providerAccountId)
      .eq('status', 'active');

    const commandResults: any[] = [];

    if (copyLinks && copyLinks.length > 0) {
      for (const link of copyLinks) {
        // Risk check: count active trades for this follower
        if (event_type === 'OPEN') {
          const { count } = await supabase
            .from('copy_trade_map')
            .select('*', { count: 'exact', head: true })
            .eq('copy_link_id', link.id)
            .eq('state', 'open');

          if ((count || 0) >= link.max_trades) {
            commandResults.push({
              follower_account_id: link.follower_account_id,
              skipped: true,
              reason: 'max_trades reached'
            });
            continue;
          }
        }

        // Calculate lot size based on mode
        let lots = rest.lots || 0.01;
        if (link.lot_mode === 'fixed' && link.fixed_lot) {
          lots = link.fixed_lot;
        } else {
          lots = Math.min(lots * link.risk_mult, link.max_lot);
        }

        // Build command payload
        const commandPayload: any = {
          symbol: rest.symbol,
          side: rest.side,
          lots,
          slippage_points: link.slippage_points,
        };

        if (link.copy_sl_tp) {
          if (rest.sl) commandPayload.sl = rest.sl;
          if (rest.tp) commandPayload.tp = rest.tp;
        }

        if (event_type === 'MODIFY') {
          if (rest.sl) commandPayload.sl = rest.sl;
          if (rest.tp) commandPayload.tp = rest.tp;
        }

        if (event_type === 'CLOSE' || event_type === 'PARTIAL_CLOSE') {
          commandPayload.lots = rest.lots || lots;
        }

        const commandType = event_type === 'PARTIAL_CLOSE' ? 'CLOSE' : event_type;

        // Insert command
        const { data: cmd } = await supabase
          .from('follower_commands')
          .insert({
            follower_account_id: link.follower_account_id,
            provider_trade_id,
            command_type: commandType as 'OPEN' | 'MODIFY' | 'CLOSE',
            payload: commandPayload,
          })
          .select()
          .single();

        // Create trade map entry for OPEN events
        if (event_type === 'OPEN' && cmd) {
          await supabase.from('copy_trade_map').insert({
            copy_link_id: link.id,
            provider_trade_id,
          });
        }

        commandResults.push({
          follower_account_id: link.follower_account_id,
          command_id: cmd?.id,
          status: 'queued'
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      event_type,
      followers_notified: commandResults.length,
      details: commandResults,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Provider event error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
});
