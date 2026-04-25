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

    let rawBody = (await req.text()).trim();
    // Remove trailing null bytes or control chars
    rawBody = rawBody.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]+$/g, '').trim();
    console.log('Raw body received:', rawBody.substring(0, 500));
    
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (parseErr) {
      const errMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      // Try to fix truncated JSON by appending closing brace
      if (!rawBody.endsWith('}')) {
        try {
          body = JSON.parse(rawBody + '}');
          console.log('Fixed truncated JSON by appending }');
        } catch (_parseErr2) {
          console.error('JSON parse error:', errMsg, 'Body:', rawBody.substring(0, 500));
          return new Response(JSON.stringify({ error: 'Invalid JSON in request body', details: errMsg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          });
        }
      } else {
        console.error('JSON parse error:', errMsg, 'Body:', rawBody.substring(0, 500));
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body', details: errMsg }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
    }
    
    const { 
      terminal_uid, 
      user_id,
      broker_name, 
      server, 
      login, 
      account_currency, 
      leverage 
    } = body;

    if (!terminal_uid) {
      throw new Error('Missing required field: terminal_uid');
    }

    // Determine real user UUID: try user_id from body, then look up from existing records
    let realUserId: string | null = null;

    // Check if user_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (user_id && uuidRegex.test(user_id)) {
      realUserId = user_id;
    } else {
      // Try to find user from existing trading_accounts with this terminal_uid
      const { data: existing } = await supabase
        .from('trading_accounts')
        .select('user_id')
        .eq('login_id', terminal_uid)
        .eq('broker', 'mt5')
        .single();
      if (existing) {
        realUserId = existing.user_id;
      }
    }

    // Always upsert mt5_states regardless of user mapping
    await supabase
      .from('mt5_states')
      .upsert({
        terminal_uid: terminal_uid,
        balance: 0,
        equity: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'terminal_uid' });

    // If no real user found, return success but note no account linked
    if (!realUserId) {
      console.log('No valid user_id for terminal', terminal_uid, '- registered in mt5_states only');
      return new Response(JSON.stringify({
        success: true,
        connection_id: null,
        message: 'Terminal registered (no user linked yet). Set up the connection from your dashboard first.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if terminal already exists in trading_accounts
    const { data: existingTerminal } = await supabase
      .from('trading_accounts')
      .select('id')
      .eq('login_id', terminal_uid)
      .eq('broker', 'mt5')
      .single();

    if (existingTerminal) {
      await supabase
        .from('trading_accounts')
        .update({
          connection_status: 'connected',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTerminal.id);

      return new Response(JSON.stringify({
        success: true,
        connection_id: existingTerminal.id,
        message: 'Terminal reconnected'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create new trading account for MT5
    const { data: newAccount, error: accountError } = await supabase
      .from('trading_accounts')
      .insert({
        user_id: realUserId,
        broker: 'mt5',
        label: `${broker_name || 'MT5'} - ${login || terminal_uid}`,
        api_key_encrypted: terminal_uid,
        login_id: terminal_uid,
        connection_type: 'mt5_bridge',
        connection_status: 'connected',
        is_virtual: false,
        permissions_json: {
          broker_name,
          server,
          login,
          account_currency,
          leverage
        }
      })
      .select()
      .single();

    if (accountError) {
      throw new Error(`Failed to create account: ${accountError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      connection_id: newAccount.id,
      message: 'Terminal registered successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Bridge register error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
