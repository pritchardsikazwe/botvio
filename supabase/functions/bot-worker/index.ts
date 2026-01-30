// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Deriv WebSocket API configuration
const DERIV_WS_URL = "wss://ws.binaryws.com/websockets/v3?app_id=1089";

interface TradingSignal {
  symbol: string;
  direction: "BUY" | "SELL";
  stake: number;
  duration: number;
  duration_unit: string;
  confidence: number;
  reason: string;
}

// Bot strategy modules
function hauzaStrategy(instance: any): TradingSignal[] {
  // Hauza Sniper Strategy implementation
  // H1 EMA50 trend bias + H1 swing S/R zones + M15 EMA20 rejection
  // This is a simplified version - in production, would need real OHLC data
  
  const signals: TradingSignal[] = [];
  
  // Strategy logic would analyze real market data here
  // For now, returning empty - requires market data integration
  
  console.log(`[Hauza] Running strategy for ${instance.name} on markets:`, instance.markets);
  
  return signals;
}

function boomCrashSniperStrategy(instance: any): TradingSignal[] {
  // Boom/Crash Sniper Strategy
  // Looks for spike patterns and trend continuation
  
  const signals: TradingSignal[] = [];
  console.log(`[Boom/Crash] Running strategy for ${instance.name}`);
  
  // Would analyze tick data for spike detection
  // Boom: Wait for consolidation, then buy expecting spike up
  // Crash: Wait for consolidation, then sell expecting spike down
  
  return signals;
}

function volatilityTrendStrategy(instance: any): TradingSignal[] {
  // Volatility Index Trend Strategy
  // Uses M and W formations with rejections
  
  const signals: TradingSignal[] = [];
  console.log(`[Volatility Trend] Running strategy for ${instance.name}`);
  
  // Would analyze price action for M/W formations
  // Check for overbought/oversold conditions
  // Look for rejection wicks
  
  return signals;
}

const strategies: Record<string, (instance: any) => TradingSignal[]> = {
  hauza: hauzaStrategy,
  boom_crash_sniper: boomCrashSniperStrategy,
  volatility_trend: volatilityTrendStrategy,
};

async function checkRiskLimits(
  supabase: any,
  instance: any
): Promise<{ canTrade: boolean; reason: string }> {
  // Check if risk session exists and is not stopped
  const today = new Date().toISOString().split("T")[0];
  
  const { data: riskSession } = await supabase
    .from("risk_sessions")
    .select("*")
    .eq("user_id", instance.user_id)
    .eq("trading_account_id", instance.trading_account_id)
    .eq("date", today)
    .maybeSingle();

  if (riskSession?.stop_trading) {
    return { canTrade: false, reason: riskSession.reason || "Daily loss limit reached" };
  }

  // Check open trades count
  const { count: openTradesCount } = await supabase
    .from("bot_trades")
    .select("*", { count: "exact", head: true })
    .eq("bot_instance_id", instance.id)
    .eq("status", "open");

  const maxOpenTrades = instance.max_open_trades || 3;
  if ((openTradesCount || 0) >= maxOpenTrades) {
    return { canTrade: false, reason: `Max open trades (${maxOpenTrades}) reached` };
  }

  // Calculate daily PnL
  const { data: todayTrades } = await supabase
    .from("bot_trades")
    .select("pnl")
    .eq("bot_instance_id", instance.id)
    .gte("opened_at", `${today}T00:00:00Z`);

  const dailyPnL = (todayTrades || []).reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
  const startBalance = riskSession?.start_balance || 1000;
  const maxDailyLossPercent = instance.max_daily_loss_percent || 5;
  const lossPercent = Math.abs(Math.min(0, dailyPnL)) / startBalance * 100;

  if (lossPercent >= maxDailyLossPercent) {
    // Update risk session to stop trading
    await supabase
      .from("risk_sessions")
      .upsert({
        user_id: instance.user_id,
        trading_account_id: instance.trading_account_id,
        date: today,
        stop_trading: true,
        reason: `Daily loss limit (${maxDailyLossPercent}%) exceeded`,
        daily_pnl: dailyPnL,
      });

    return { canTrade: false, reason: `Daily loss limit exceeded: ${lossPercent.toFixed(2)}%` };
  }

  return { canTrade: true, reason: "" };
}

async function executeDerivTrade(
  token: string,
  signal: TradingSignal
): Promise<{ success: boolean; contract_id?: string; error?: string }> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(DERIV_WS_URL);

      ws.onopen = () => {
        ws.send(JSON.stringify({ authorize: token }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.msg_type === "authorize") {
          if (data.error) {
            ws.close();
            resolve({ success: false, error: data.error.message });
            return;
          }

          // Place the trade
          const contractType = signal.direction === "BUY" ? "CALL" : "PUT";
          
          ws.send(JSON.stringify({
            buy: 1,
            subscribe: 1,
            price: signal.stake,
            parameters: {
              contract_type: contractType,
              symbol: signal.symbol,
              duration: signal.duration,
              duration_unit: signal.duration_unit,
              currency: "USD",
              basis: "stake",
              amount: signal.stake,
            },
          }));
        }

        if (data.msg_type === "buy") {
          ws.close();
          if (data.error) {
            resolve({ success: false, error: data.error.message });
          } else {
            resolve({
              success: true,
              contract_id: data.buy?.contract_id?.toString(),
            });
          }
        }
      };

      ws.onerror = () => {
        ws.close();
        resolve({ success: false, error: "WebSocket connection failed" });
      };

      // Timeout after 30 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          resolve({ success: false, error: "Trade execution timeout" });
        }
      }, 30000);
    } catch (error) {
      resolve({ success: false, error: (error as Error).message });
    }
  });
}

async function processBotInstance(
  supabase: any,
  instance: any
): Promise<void> {
  const botCode = instance.bots?.code;
  const botName = instance.name;
  
  console.log(`Processing bot instance: ${botName} (${botCode})`);

  // Check risk limits
  const riskCheck = await checkRiskLimits(supabase, instance);
  if (!riskCheck.canTrade) {
    console.log(`[${botName}] Cannot trade: ${riskCheck.reason}`);
    
    // Log to audit
    await supabase.from("audit_logs").insert({
      user_id: instance.user_id,
      action_type: "BOT_RISK_BLOCK",
      payload_json: {
        bot_instance_id: instance.id,
        bot_name: botName,
        reason: riskCheck.reason,
      },
    });
    return;
  }

  // Get strategy function
  const strategyFn = strategies[botCode];
  if (!strategyFn) {
    console.log(`[${botName}] No strategy found for code: ${botCode}`);
    return;
  }

  // Run strategy to get signals
  const signals = strategyFn(instance);

  if (signals.length === 0) {
    console.log(`[${botName}] No trading signals generated`);
    return;
  }

  const apiKey = instance.trading_accounts?.api_key_encrypted;
  const maxStake = instance.max_stake || 10;

  // Execute trades for each signal
  for (const signal of signals) {
    // Enforce max stake
    const stake = Math.min(signal.stake, maxStake);

    console.log(`[${botName}] Executing trade: ${signal.direction} ${signal.symbol} @ $${stake}`);

    const result = await executeDerivTrade(apiKey, { ...signal, stake });

    // Log trade result
    if (result.success) {
      await supabase.from("bot_trades").insert({
        bot_instance_id: instance.id,
        symbol: signal.symbol,
        side: signal.direction,
        stake: stake,
        broker_trade_id: result.contract_id,
        status: "open",
      });

      await supabase.from("audit_logs").insert({
        user_id: instance.user_id,
        action_type: "BOT_TRADE_PLACED",
        payload_json: {
          bot_instance_id: instance.id,
          signal,
          contract_id: result.contract_id,
        },
      });

      console.log(`[${botName}] Trade placed successfully: ${result.contract_id}`);
    } else {
      await supabase.from("audit_logs").insert({
        user_id: instance.user_id,
        action_type: "BOT_TRADE_ERROR",
        payload_json: {
          bot_instance_id: instance.id,
          signal,
          error: result.error,
        },
      });

      console.error(`[${botName}] Trade failed: ${result.error}`);
    }
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Bot Worker starting...");

    // Fetch all active bot instances with their bot config and trading account
    const { data: instances, error: fetchError } = await supabase
      .from("bot_instances")
      .select(`
        *,
        bots (code, name),
        trading_accounts (api_key_encrypted, broker)
      `)
      .eq("status", "active");

    if (fetchError) {
      throw new Error(`Failed to fetch bot instances: ${fetchError.message}`);
    }

    if (!instances || instances.length === 0) {
      console.log("No active bot instances found");
      return new Response(
        JSON.stringify({ success: true, message: "No active bot instances" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${instances.length} active bot instances`);

    // Process each bot instance
    const results = [];
    for (const instance of instances) {
      try {
        await processBotInstance(supabase, instance);
        results.push({ instance_id: instance.id, status: "processed" });
      } catch (error) {
        console.error(`Error processing instance ${instance.id}:`, error);
        results.push({
          instance_id: instance.id,
          status: "error",
          error: (error as Error).message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Bot Worker error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
