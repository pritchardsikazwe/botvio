import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DERIV_APP_ID = "123162";
const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`;

interface TradeRequest {
  provider_id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  contract_type?: string; // CALL, PUT, DIGITOVER, DIGITUNDER, etc.
  stake: number;
  duration?: number;
  duration_unit?: string;
  barrier?: number;
}

interface CopyResult {
  subscriber_user_id: string;
  subscriber_account_id: string;
  stake: number;
  status: "success" | "error";
  contract_id?: string;
  error?: string;
}

// Simple Deriv WebSocket client for edge function
async function createDerivConnection(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(DERIV_WS_URL);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Connection timeout"));
    }, 10000);

    ws.onopen = () => {
      clearTimeout(timeout);
      resolve(ws);
    };
    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("WebSocket connection failed"));
    };
  });
}

async function sendDerivRequest(ws: WebSocket, payload: Record<string, unknown>): Promise<any> {
  return new Promise((resolve, reject) => {
    const reqId = Math.floor(Math.random() * 1000000);
    const timeout = setTimeout(() => {
      reject(new Error("Request timeout"));
    }, 15000);

    const handler = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.req_id === reqId) {
        clearTimeout(timeout);
        ws.removeEventListener("message", handler);
        if (data.error) {
          reject(new Error(data.error.message));
        } else {
          resolve(data);
        }
      }
    };

    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ ...payload, req_id: reqId }));
  });
}

async function placeDerivTrade(
  token: string,
  symbol: string,
  direction: "BUY" | "SELL",
  stake: number,
  duration: number = 5,
  durationUnit: string = "t",
  contractType?: string,
  barrier?: number
): Promise<{ contract_id: string; buy_price: number }> {
  const ws = await createDerivConnection();

  try {
    // Authorize
    const authRes = await sendDerivRequest(ws, { authorize: token });
    if (!authRes.authorize) {
      throw new Error("Authorization failed");
    }

    // Determine contract type - default to CALL/PUT based on direction
    const derivContractType = contractType || (direction === "BUY" ? "CALL" : "PUT");
    
    // Build parameters
    const parameters: Record<string, unknown> = {
      amount: stake,
      basis: "stake",
      contract_type: derivContractType,
      currency: "USD",
      duration: duration,
      duration_unit: durationUnit,
      symbol: symbol,
    };
    
    // Add barrier for digit contracts
    if (barrier !== undefined && ["DIGITOVER", "DIGITUNDER", "DIGITMATCH", "DIGITDIFF"].includes(derivContractType)) {
      parameters.barrier = barrier.toString();
    }

    // Place trade
    const buyRes = await sendDerivRequest(ws, {
      buy: 1,
      price: stake,
      parameters,
    });

    if (!buyRes.buy) {
      throw new Error("Trade execution failed");
    }

    return {
      contract_id: buyRes.buy.contract_id,
      buy_price: buyRes.buy.buy_price,
    };
  } finally {
    ws.close();
  }
}

async function getDerivBalance(token: string): Promise<number> {
  const ws = await createDerivConnection();
  try {
    const authRes = await sendDerivRequest(ws, { authorize: token });
    if (!authRes.authorize) throw new Error("Auth failed");
    return authRes.authorize.balance || 0;
  } finally {
    ws.close();
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: TradeRequest = await req.json();
    const { provider_id, symbol, direction, contract_type, stake, duration = 5, duration_unit = "t", barrier } = body;

    // Validate provider ownership
    const { data: provider, error: providerError } = await supabaseClient
      .from("providers")
      .select("*, provider_accounts(*, trading_accounts(*))")
      .eq("id", provider_id)
      .eq("user_id", user.id)
      .single();

    if (providerError || !provider) {
      return new Response(JSON.stringify({ error: "Provider not found or access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (provider.status !== "approved") {
      return new Response(JSON.stringify({ error: "Provider not approved for trading" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get provider's trading account
    const providerAccount = provider.provider_accounts?.[0];
    if (!providerAccount?.trading_accounts) {
      return new Response(JSON.stringify({ error: "No trading account configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const providerToken = providerAccount.trading_accounts.api_key_encrypted;

    // Execute provider trade
    let providerTradeResult: { contract_id: string; buy_price: number };
    try {
      providerTradeResult = await placeDerivTrade(
        providerToken,
        symbol,
        direction,
        stake,
        duration,
        duration_unit,
        contract_type,
        barrier
      );
    } catch (tradeErr: any) {
      // Log error to audit
      await supabaseClient.from("audit_logs").insert({
        user_id: user.id,
        action_type: "PROVIDER_TRADE_ERROR",
        payload_json: { provider_id, symbol, direction, stake, error: tradeErr.message },
      });

      return new Response(JSON.stringify({ error: `Provider trade failed: ${tradeErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert provider trade record
    const { data: providerTrade, error: insertError } = await supabaseClient
      .from("provider_trades")
      .insert({
        provider_id,
        provider_trading_account_id: providerAccount.trading_account_id,
        broker: "deriv",
        symbol,
        direction,
        stake,
        duration,
        duration_unit,
        broker_trade_id: providerTradeResult.contract_id,
        status: "open",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert provider trade:", insertError);
    }

    // Get provider balance for proportional calculations
    const providerBalance = await getDerivBalance(providerToken);

    // Get active subscribers
    const { data: subscriptions, error: subError } = await supabaseClient
      .from("copy_subscriptions")
      .select("*, subscriber_trading_account:trading_accounts(*)")
      .eq("provider_id", provider_id)
      .eq("status", "active");

    if (subError) {
      console.error("Failed to fetch subscriptions:", subError);
    }

    const copyResults: CopyResult[] = [];

    // Copy to each subscriber
    for (const sub of subscriptions || []) {
      const subscriberToken = sub.subscriber_trading_account?.api_key_encrypted;
      if (!subscriberToken) {
        copyResults.push({
          subscriber_user_id: sub.subscriber_user_id,
          subscriber_account_id: sub.subscriber_trading_account_id,
          stake: 0,
          status: "error",
          error: "No trading account token",
        });
        continue;
      }

      // Calculate stake based on copy mode
      let subscriberStake = stake;
      try {
        if (sub.copy_mode === "fixed") {
          subscriberStake = sub.fixed_stake || 1;
        } else if (sub.copy_mode === "multiplier") {
          subscriberStake = stake * (sub.multiplier || 1);
        } else if (sub.copy_mode === "proportional") {
          const subscriberBalance = await getDerivBalance(subscriberToken);
          subscriberStake = (subscriberBalance / providerBalance) * stake;
        }

        // Enforce minimum stake
        subscriberStake = Math.max(0.35, subscriberStake);

        // Execute subscriber trade
        const subTradeResult = await placeDerivTrade(
          subscriberToken,
          symbol,
          direction,
          subscriberStake,
          duration,
          duration_unit,
          contract_type,
          barrier
        );

        // Insert copied trade record
        await supabaseClient.from("copied_trades").insert({
          provider_trade_id: providerTrade?.id,
          subscriber_user_id: sub.subscriber_user_id,
          subscriber_trading_account_id: sub.subscriber_trading_account_id,
          broker_trade_id: subTradeResult.contract_id,
          symbol,
          direction,
          stake: subscriberStake,
          status: "open",
        });

        copyResults.push({
          subscriber_user_id: sub.subscriber_user_id,
          subscriber_account_id: sub.subscriber_trading_account_id,
          stake: subscriberStake,
          status: "success",
          contract_id: subTradeResult.contract_id,
        });

        // Send notification
        await supabaseClient.from("notifications").insert({
          user_id: sub.subscriber_user_id,
          title: "Trade Copied",
          message: `${direction} ${symbol} copied from ${provider.display_name} - Stake: $${subscriberStake.toFixed(2)}`,
          type: "trade",
          metadata: { symbol, direction, stake: subscriberStake },
        });
      } catch (copyErr: any) {
        copyResults.push({
          subscriber_user_id: sub.subscriber_user_id,
          subscriber_account_id: sub.subscriber_trading_account_id,
          stake: subscriberStake,
          status: "error",
          error: copyErr.message,
        });

        await supabaseClient.from("copied_trades").insert({
          provider_trade_id: providerTrade?.id,
          subscriber_user_id: sub.subscriber_user_id,
          subscriber_trading_account_id: sub.subscriber_trading_account_id,
          symbol,
          direction,
          stake: subscriberStake,
          status: "error",
        });
      }
    }

    // Log successful execution
    await supabaseClient.from("audit_logs").insert({
      user_id: user.id,
      action_type: "EXECUTE_COPY",
      payload_json: {
        provider_id,
        provider_trade_id: providerTrade?.id,
        symbol,
        direction,
        stake,
        subscribers_copied: copyResults.filter((r) => r.status === "success").length,
        subscribers_failed: copyResults.filter((r) => r.status === "error").length,
      },
    });

    // Update provider stats
    await supabaseClient
      .from("providers")
      .update({
        total_trades: provider.total_trades + 1,
      })
      .eq("id", provider_id);

    return new Response(
      JSON.stringify({
        success: true,
        provider_trade: {
          id: providerTrade?.id,
          contract_id: providerTradeResult.contract_id,
          buy_price: providerTradeResult.buy_price,
        },
        copy_results: copyResults,
        summary: {
          total_subscribers: subscriptions?.length || 0,
          successful_copies: copyResults.filter((r) => r.status === "success").length,
          failed_copies: copyResults.filter((r) => r.status === "error").length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Execute and copy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
