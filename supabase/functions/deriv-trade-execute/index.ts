import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TOKEN_ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY");
const DERIV_CLIENT_ID = "33XSUutrVPDWusVXuDUwW";

// Simple XOR encryption/decryption for tokens
function decryptToken(encrypted: string): string {
  if (!TOKEN_ENCRYPTION_KEY) return encrypted;
  const key = TOKEN_ENCRYPTION_KEY;
  let result = '';
  const decoded = atob(encrypted);
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * Get an OTP-authenticated WebSocket URL for the given account
 */
async function getOtpWebSocketUrl(derivToken: string, accountId: string): Promise<string> {
  const response = await fetch(
    `https://api.derivws.com/trading/v1/options/accounts/${accountId}/otp`,
    {
      method: "POST",
      headers: {
        "Deriv-App-ID": DERIV_CLIENT_ID,
        "Authorization": `Bearer ${derivToken}`,
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OTP request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const wsUrl = data?.data?.url || data?.url;
  if (!wsUrl) {
    throw new Error("No WebSocket URL in OTP response");
  }
  return wsUrl;
}

/**
 * Connect to Deriv WebSocket using OTP URL (new API).
 * Requires an accountId — legacy authorize flow is no longer supported.
 */
async function connectDerivWS(derivToken: string, accountId?: string): Promise<WebSocket> {
  if (!accountId) {
    throw new Error("Missing Deriv account/login id — reconnect your Deriv account.");
  }
  const wsUrl = await getOtpWebSocketUrl(derivToken, accountId);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket connection timeout"));
    }, 15000);

    ws.onopen = () => {
      clearTimeout(timeout);
      resolve(ws);
    };

    ws.onerror = (err) => {
      clearTimeout(timeout);
      reject(err);
    };
  });
}

async function sendAndReceive(ws: WebSocket, request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Request timeout"));
    }, 30000);
    
    ws.onmessage = (event) => {
      clearTimeout(timeout);
      const data = JSON.parse(event.data);
      resolve(data);
    };
    
    ws.onerror = (err) => {
      clearTimeout(timeout);
      reject(err);
    };
    
    ws.send(JSON.stringify(request));
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { 
      connection_id, 
      strategy_id, 
      idempotency_key, 
      contract_family, 
      payload 
    } = body;

    if (!connection_id || !idempotency_key || !contract_family || !payload) {
      throw new Error('Missing required fields: connection_id, idempotency_key, contract_family, payload');
    }

    // Check kill switch
    const { data: killSwitch } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'global_kill_switch')
      .single();

    if (killSwitch?.value?.enabled) {
      throw new Error(`Trading disabled: ${killSwitch.value.reason || 'Kill switch active'}`);
    }

    // Check idempotency
    const { data: existingIntent } = await supabase
      .from('trade_intents')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('idempotency_key', idempotency_key)
      .single();

    if (existingIntent) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Duplicate trade request',
        existing_intent_id: existingIntent.id,
        status: existingIntent.status
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409
      });
    }

    // Get connection and decrypt token
    const { data: connection, error: connError } = await supabase
      .from('deriv_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      throw new Error('Connection not found');
    }

    // Get the token (either from oauth or token_hash)
    let derivToken = connection.oauth_access_token || connection.token_hash;
    if (!derivToken) {
      throw new Error('No token found for connection');
    }

    // Decrypt if encrypted
    if (connection.token_hash && TOKEN_ENCRYPTION_KEY) {
      derivToken = decryptToken(connection.token_hash);
    }

    // Create trade intent record
    const { data: tradeIntent, error: intentError } = await supabase
      .from('trade_intents')
      .insert({
        user_id: user.id,
        strategy_id: strategy_id || null,
        connection_id: connection_id,
        intent: payload,
        idempotency_key: idempotency_key,
        status: 'QUEUED'
      })
      .select()
      .single();

    if (intentError) {
      throw new Error(`Failed to create trade intent: ${intentError.message}`);
    }

    // Connect to Deriv WebSocket (tries OTP first, falls back to legacy)
    let ws: WebSocket;
    try {
      ws = await connectDerivWS(derivToken, connection.login_id || undefined);
    } catch (err: any) {
      await supabase
        .from('trade_intents')
        .update({ status: 'FAILED', error: err.message })
        .eq('id', tradeIntent.id);
      throw new Error(`Deriv connection failed: ${err.message}`);
    }

    try {
      // Build contract request based on family
      let proposalRequest: any = {
        proposal: 1,
        amount: payload.stake,
        basis: 'stake',
        currency: payload.currency || 'USD',
        symbol: payload.symbol,
      };

      switch (contract_family) {
        case 'MULTIPLIERS': {
          proposalRequest.contract_type = payload.contract_type;
          proposalRequest.multiplier = payload.multiplier || 100;
          if (payload.limit_order) {
            proposalRequest.limit_order = payload.limit_order;
          }
          break;
        }
        case 'DIGITS':
          proposalRequest.contract_type = payload.contract_type;
          proposalRequest.duration = payload.duration;
          proposalRequest.duration_unit = payload.duration_unit || 't';
          if (payload.barrier !== undefined) {
            proposalRequest.barrier = payload.barrier.toString();
          }
          break;
          
        case 'RISEFALL':
          proposalRequest.contract_type = payload.contract_type;
          proposalRequest.duration = payload.duration;
          proposalRequest.duration_unit = payload.duration_unit || 't';
          break;
          
        default:
          throw new Error(`Unsupported contract family: ${contract_family}`);
      }

      // Update intent to SENT
      await supabase
        .from('trade_intents')
        .update({ status: 'SENT' })
        .eq('id', tradeIntent.id);

      // Get proposal
      const proposalResponse = await sendAndReceive(ws, proposalRequest);
      
      if (proposalResponse.error) {
        await supabase
          .from('trade_intents')
          .update({ 
            status: 'REJECTED', 
            error: proposalResponse.error.message 
          })
          .eq('id', tradeIntent.id);
        
        ws.close();
        return new Response(JSON.stringify({
          success: false,
          error: proposalResponse.error.message,
          trade_intent_id: tradeIntent.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      // Execute buy
      const buyRequest = {
        buy: proposalResponse.proposal.id,
        price: proposalResponse.proposal.ask_price
      };

      const buyResponse = await sendAndReceive(ws, buyRequest);
      ws.close();

      if (buyResponse.error) {
        await supabase
          .from('trade_intents')
          .update({ 
            status: 'REJECTED', 
            error: buyResponse.error.message 
          })
          .eq('id', tradeIntent.id);
        
        return new Response(JSON.stringify({
          success: false,
          error: buyResponse.error.message,
          trade_intent_id: tradeIntent.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      // Trade successful
      const contractId = buyResponse.buy.contract_id;
      
      await supabase
        .from('trade_intents')
        .update({ 
          status: 'FILLED', 
          broker_ref: contractId.toString()
        })
        .eq('id', tradeIntent.id);

      // Create execution record
      const { data: execution } = await supabase
        .from('executions')
        .insert({
          user_id: user.id,
          trade_intent_id: tradeIntent.id,
          broker_ref: contractId.toString(),
          fill_price: buyResponse.buy.buy_price,
          stake_or_lot: payload.stake,
          status: 'OPEN',
          raw: buyResponse
        })
        .select()
        .single();

      return new Response(JSON.stringify({
        success: true,
        trade_intent_id: tradeIntent.id,
        execution_id: execution?.id,
        contract_id: contractId,
        buy_price: buyResponse.buy.buy_price,
        balance_after: buyResponse.buy.balance_after
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (err: any) {
      ws.close();
      await supabase
        .from('trade_intents')
        .update({ status: 'FAILED', error: err.message })
        .eq('id', tradeIntent.id);
      throw err;
    }

  } catch (error: any) {
    console.error('Trade execution error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
