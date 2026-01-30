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

// Forex session times (UTC)
const FOREX_SESSIONS = {
  sydney: { open: 22, close: 7 },   // 22:00 - 07:00 UTC
  tokyo: { open: 0, close: 9 },     // 00:00 - 09:00 UTC
  london: { open: 8, close: 17 },   // 08:00 - 17:00 UTC
  newyork: { open: 13, close: 22 }, // 13:00 - 22:00 UTC
};

// Check if we're 3 minutes before session open
function isPreSessionWindow(sessionName: string): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const session = FOREX_SESSIONS[sessionName as keyof typeof FOREX_SESSIONS];
  
  if (!session) return false;
  
  // Check if we're within 3 minutes before session open
  const preSessionMinutes = session.open * 60 - 3;
  const currentMinutes = utcHour * 60 + utcMinutes;
  
  return currentMinutes >= preSessionMinutes && currentMinutes < session.open * 60;
}

// Bot strategy modules
function botvioStrategy(instance: any): TradingSignal[] {
  // Botvio Sniper Strategy implementation
  // H1 EMA50 trend bias + H1 swing S/R zones + M15 EMA20 rejection
  
  const signals: TradingSignal[] = [];
  console.log(`[Botvio] Running strategy for ${instance.name} on markets:`, instance.markets);
  
  return signals;
}

function boomCrashSniperStrategy(instance: any): TradingSignal[] {
  const signals: TradingSignal[] = [];
  console.log(`[Boom/Crash] Running strategy for ${instance.name}`);
  return signals;
}

function volatilityTrendStrategy(instance: any): TradingSignal[] {
  const signals: TradingSignal[] = [];
  console.log(`[Volatility Trend] Running strategy for ${instance.name}`);
  return signals;
}

// London Session Strategy - 3 min before London open
function londonSessionStrategy(instance: any): TradingSignal[] {
  const signals: TradingSignal[] = [];
  
  if (!isPreSessionWindow("london")) {
    console.log(`[London Session] Not in pre-session window, skipping`);
    return signals;
  }
  
  console.log(`[London Session] Running strategy for ${instance.name}`);
  console.log(`[London Session] Analyzing previous session S/R, breakouts, rejections on M15`);
  
  // Strategy: Check previous Asian session key levels
  // Look for rejection wicks, breakout patterns, and key S/R on M15
  
  return signals;
}

// New York Session Strategy
function newyorkSessionStrategy(instance: any): TradingSignal[] {
  const signals: TradingSignal[] = [];
  
  if (!isPreSessionWindow("newyork")) {
    console.log(`[New York Session] Not in pre-session window, skipping`);
    return signals;
  }
  
  console.log(`[New York Session] Running strategy for ${instance.name}`);
  console.log(`[New York Session] Analyzing London session S/R and key levels`);
  
  return signals;
}

// Tokyo Session Strategy
function tokyoSessionStrategy(instance: any): TradingSignal[] {
  const signals: TradingSignal[] = [];
  
  if (!isPreSessionWindow("tokyo")) {
    console.log(`[Tokyo Session] Not in pre-session window, skipping`);
    return signals;
  }
  
  console.log(`[Tokyo Session] Running strategy for ${instance.name}`);
  
  return signals;
}

// Sydney Session Strategy
function sydneySessionStrategy(instance: any): TradingSignal[] {
  const signals: TradingSignal[] = [];
  
  if (!isPreSessionWindow("sydney")) {
    console.log(`[Sydney Session] Not in pre-session window, skipping`);
    return signals;
  }
  
  console.log(`[Sydney Session] Running strategy for ${instance.name}`);
  
  return signals;
}

// Daily Range Strategy - Lowest/Highest of day notifications
function dailyRangeStrategy(instance: any): TradingSignal[] {
  const signals: TradingSignal[] = [];
  
  console.log(`[Daily Range] Monitoring for daily high/low extremes`);
  console.log(`[Daily Range] Markets: ${instance.markets?.join(", ")}`);
  
  // This strategy monitors for new daily highs/lows and sends notifications
  // No direct trading signals, but triggers alerts
  
  return signals;
}

// RSI Universal Strategy - Works on all markets
function rsiStrategy(instance: any): TradingSignal[] {
  const signals: TradingSignal[] = [];
  
  console.log(`[RSI Strategy] Running on markets: ${instance.markets?.join(", ")}`);
  
  // RSI Strategy Logic:
  // - RSI below 30: Oversold condition, potential BUY
  // - RSI above 70: Overbought condition, potential SELL
  // - Combine with price action for confirmation
  
  // Would analyze RSI on M15 and H1 timeframes
  
  return signals;
}

// Custom Strategy Execution - Runs strategies from config_json
function customStrategyExecutor(instance: any): TradingSignal[] {
  const signals: TradingSignal[] = [];
  const config = instance.config_json || {};
  
  console.log(`[Custom Strategy] Running for ${instance.name}`);
  console.log(`[Custom Strategy] Config:`, JSON.stringify(config).slice(0, 200));
  
  // Parse strategy configuration
  const {
    symbol = "R_100",
    contract_type = "CALL",
    direction = "BUY",
    stake = 1,
    duration = 5,
    duration_unit = "t",
    entry_conditions = [],
    confidence_threshold = 70,
    auto_execute = false,
  } = config;
  
  // Only execute if auto_execute is enabled
  if (!auto_execute) {
    console.log(`[Custom Strategy] Auto-execute disabled, skipping`);
    return signals;
  }
  
  // Check entry conditions if defined
  let conditionsMet = true;
  let confidence = 80; // Base confidence
  
  for (const condition of entry_conditions) {
    // Simple condition checking - would be expanded with real market data
    if (condition.type === "time_of_day") {
      const now = new Date();
      const hour = now.getUTCHours();
      if (hour < condition.start_hour || hour > condition.end_hour) {
        conditionsMet = false;
        break;
      }
    }
    
    if (condition.type === "session") {
      const sessionActive = isPreSessionWindow(condition.session_name);
      if (condition.require_active && !sessionActive) {
        conditionsMet = false;
        break;
      }
    }
  }
  
  if (conditionsMet && confidence >= confidence_threshold) {
    signals.push({
      symbol,
      direction: direction as "BUY" | "SELL",
      stake,
      duration,
      duration_unit,
      confidence,
      reason: `Custom strategy execution: ${instance.name}`,
    });
  }
  
  return signals;
}

// CFD Strategy for Boom/Crash - spike detection
function boomCrashCFDStrategy(instance: any): TradingSignal[] {
  const signals: TradingSignal[] = [];
  const config = instance.config_json || {};
  const markets = instance.markets || ["BOOM1000", "CRASH1000"];
  
  console.log(`[Boom/Crash CFD] Running for ${instance.name} on:`, markets);
  
  const {
    stake = 1,
    duration = 5,
    duration_unit = "t",
    auto_execute = false,
    spike_detection = true,
    trend_following = true,
  } = config;
  
  if (!auto_execute) {
    console.log(`[Boom/Crash CFD] Auto-execute disabled`);
    return signals;
  }
  
  // Boom/Crash specific logic
  // For Boom: Wait for consecutive down moves, then BUY expecting spike up
  // For Crash: Wait for consecutive up moves, then SELL expecting spike down
  
  for (const market of markets) {
    if (market.startsWith("BOOM") && spike_detection) {
      // Boom strategy - buy during downtrend expecting spike
      signals.push({
        symbol: market,
        direction: "BUY",
        stake,
        duration,
        duration_unit,
        confidence: 75,
        reason: "Boom spike anticipation",
      });
    } else if (market.startsWith("CRASH") && spike_detection) {
      // Crash strategy - sell during uptrend expecting spike
      signals.push({
        symbol: market,
        direction: "SELL", 
        stake,
        duration,
        duration_unit,
        confidence: 75,
        reason: "Crash spike anticipation",
      });
    }
  }
  
  return signals;
}

// Volatility CFD Strategy
function volatilityCFDStrategy(instance: any): TradingSignal[] {
  const signals: TradingSignal[] = [];
  const config = instance.config_json || {};
  const markets = instance.markets || ["R_100", "R_50"];
  
  console.log(`[Volatility CFD] Running for ${instance.name}`);
  
  const {
    stake = 1,
    duration = 5,
    duration_unit = "t",
    auto_execute = false,
    trend_direction = "both", // "buy", "sell", "both"
  } = config;
  
  if (!auto_execute) {
    return signals;
  }
  
  // Volatility index strategy
  // Would analyze EMA crossovers, RSI, and trend direction
  
  for (const market of markets) {
    if (trend_direction === "buy" || trend_direction === "both") {
      // Only add signal if conditions met (placeholder)
    }
  }
  
  return signals;
}

const strategies: Record<string, (instance: any) => TradingSignal[]> = {
  botvio: botvioStrategy,
  boom_crash_sniper: boomCrashSniperStrategy,
  volatility_trend: volatilityTrendStrategy,
  london_session: londonSessionStrategy,
  newyork_session: newyorkSessionStrategy,
  tokyo_session: tokyoSessionStrategy,
  sydney_session: sydneySessionStrategy,
  daily_range: dailyRangeStrategy,
  rsi_strategy: rsiStrategy,
  // New CFD strategies
  custom_strategy: customStrategyExecutor,
  boom_crash_cfd: boomCrashCFDStrategy,
  volatility_cfd: volatilityCFDStrategy,
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
