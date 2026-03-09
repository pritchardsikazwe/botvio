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
      // Try to fix truncated JSON by appending closing brace
      if (!rawBody.endsWith('}')) {
        try {
          body = JSON.parse(rawBody + '}');
          console.log('Fixed truncated JSON by appending }');
        } catch (parseErr2) {
          console.error('JSON parse error:', parseErr.message, 'Body:', rawBody.substring(0, 500));
          return new Response(JSON.stringify({ error: 'Invalid JSON in request body', details: parseErr.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          });
        }
      } else {
        console.error('JSON parse error:', parseErr.message, 'Body:', rawBody.substring(0, 500));
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body', details: parseErr.message }), {
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

    if (!terminal_uid || !user_id) {
      throw new Error('Missing required fields: terminal_uid, user_id');
    }

    // Check if terminal already exists
    const { data: existingTerminal } = await supabase
      .from('trading_accounts')
      .select('id')
      .eq('login_id', terminal_uid)
      .eq('broker', 'mt5')
      .single();

    if (existingTerminal) {
      // Update existing terminal
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
        user_id: user_id,
        broker: 'mt5',
        label: `${broker_name || 'MT5'} - ${login || terminal_uid}`,
        api_key_encrypted: terminal_uid, // Store terminal_uid as identifier
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

    // Create state entry
    await supabase
      .from('mt5_states')
      .upsert({
        terminal_uid: terminal_uid,
        updated_at: new Date().toISOString()
      }, { onConflict: 'terminal_uid' });

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
