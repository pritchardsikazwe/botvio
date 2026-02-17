import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DERIV_APP_ID = Deno.env.get("DERIV_APP_ID") || "99139";
const TOKEN_ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY");

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

async function connectDerivWS(token: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket connection timeout"));
    }, 10000);
    
    ws.onopen = () => {
      clearTimeout(timeout);
      // Authorize first
      ws.send(JSON.stringify({ authorize: token }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.authorize) {
        resolve(ws);
      } else if (data.error) {
        ws.close();
        reject(new Error(data.error.message));
      }
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

serve(async (req) => {
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

    // Check idempotency - prevent duplicate trades
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

    // Connect to Deriv WebSocket
    let ws: WebSocket;
    try {
      ws = await connectDerivWS(derivToken);
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
          proposalRequest.contract_type = payload.contract_type; // MULTUP or MULTDOWN
          // Dynamically accept multiplier from client - Deriv validates per-symbol
          // Common values: 10, 20, 30, 40, 50, 100, 150, 200, 250, 300, 400, 500, 1000, 1500, 2000, 3000, 4000, 5000
          // Do NOT hardcode allowed range - let Deriv API validate per symbol
          proposalRequest.multiplier = payload.multiplier || 100;
          if (payload.limit_order) {
            proposalRequest.limit_order = payload.limit_order;
          }
          break;
        }
        case 'DIGITS':
          proposalRequest.contract_type = payload.contract_type; // DIGITDIFF, DIGITMATCH, DIGITOVER, DIGITUNDER, DIGITEVEN, DIGITODD
          proposalRequest.duration = payload.duration;
          proposalRequest.duration_unit = payload.duration_unit || 't';
          if (payload.barrier !== undefined) {
            proposalRequest.barrier = payload.barrier.toString();
          }
          break;
          
        case 'RISEFALL':
          proposalRequest.contract_type = payload.contract_type; // CALL or PUT
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

      // Trade successful - update intent and create execution
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
          stake_or_lot: buyResponse.buy.balance_after - buyResponse.buy.balance_after + payload.stake,
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
