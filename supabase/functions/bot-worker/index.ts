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

interface TickData {
  symbol: string;
  quote: number;
  epoch: number;
}

interface MarketData {
  symbol: string;
  ticks: TickData[];
  ema20?: number;
  ema50?: number;
  rsi14?: number;
  trend?: "bullish" | "bearish" | "sideways";
  volatility?: number;
  lastSpike?: { direction: "up" | "down"; epoch: number } | null;
}

// Cache for market data across strategy runs
const marketDataCache = new Map<string, MarketData>();

// Forex session times (UTC)
const FOREX_SESSIONS = {
  sydney: { open: 22, close: 7 },
  tokyo: { open: 0, close: 9 },
  london: { open: 8, close: 17 },
  newyork: { open: 13, close: 22 },
};

// ============= REAL-TIME MARKET DATA INTEGRATION =============

/**
 * Fetch live tick history from Deriv WebSocket
 */
async function fetchTickHistory(
  symbol: string,
  count = 100
): Promise<TickData[]> {
  return new Promise((resolve, reject) => {
    const ticks: TickData[] = [];
    let timeoutId: number;
    
    try {
      const ws = new WebSocket(DERIV_WS_URL);
      
      timeoutId = setTimeout(() => {
        ws.close();
        console.log(`[MarketData] Timeout fetching ${symbol}, returning cached or empty`);
        resolve(ticks);
      }, 15000);

      ws.onopen = () => {
        console.log(`[MarketData] Fetching ${count} ticks for ${symbol}`);
        ws.send(JSON.stringify({
          ticks_history: symbol,
          adjust_start_time: 1,
          count: count,
          end: "latest",
          style: "ticks",
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.error) {
          console.error(`[MarketData] Error for ${symbol}:`, data.error.message);
          clearTimeout(timeoutId);
          ws.close();
          resolve([]);
          return;
        }

        if (data.msg_type === "history" && data.history) {
          const prices = data.history.prices || [];
          const times = data.history.times || [];
          
          for (let i = 0; i < prices.length; i++) {
            ticks.push({
              symbol,
              quote: prices[i],
              epoch: times[i],
            });
          }
          
          console.log(`[MarketData] Received ${ticks.length} ticks for ${symbol}`);
          clearTimeout(timeoutId);
          ws.close();
          resolve(ticks);
        }
      };

      ws.onerror = () => {
        clearTimeout(timeoutId);
        console.error(`[MarketData] WebSocket error for ${symbol}`);
        resolve([]);
      };

      ws.onclose = () => {
        clearTimeout(timeoutId);
      };
    } catch (error) {
      console.error(`[MarketData] Exception fetching ${symbol}:`, error);
      resolve([]);
    }
  });
}

/**
 * Subscribe to live ticks and collect for a short period
 */
async function fetchLiveTicks(
  symbol: string,
  durationMs = 5000
): Promise<TickData[]> {
  return new Promise((resolve) => {
    const ticks: TickData[] = [];
    
    try {
      const ws = new WebSocket(DERIV_WS_URL);
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(ticks);
      }, durationMs);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          ticks: symbol,
          subscribe: 1,
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.msg_type === "tick" && data.tick) {
          ticks.push({
            symbol: data.tick.symbol,
            quote: data.tick.quote,
            epoch: data.tick.epoch,
          });
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(ticks);
      };
    } catch {
      resolve([]);
    }
  });
}

// ============= TECHNICAL INDICATORS =============

/**
 * Calculate Exponential Moving Average
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

/**
 * Calculate Relative Strength Index
 */
function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate volatility (standard deviation of returns)
 */
function calculateVolatility(prices: number[], period = 20): number {
  if (prices.length < period) return 0;
  
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const recentReturns = returns.slice(-period);
  const mean = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
  const squaredDiffs = recentReturns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  
  return Math.sqrt(variance) * 100; // Return as percentage
}

/**
 * Detect spike patterns for Boom/Crash markets
 */
function detectSpike(
  ticks: TickData[],
  threshold = 0.001
): { direction: "up" | "down"; epoch: number } | null {
  if (ticks.length < 10) return null;
  
  const recentTicks = ticks.slice(-10);
  
  for (let i = 1; i < recentTicks.length; i++) {
    const priceChange = (recentTicks[i].quote - recentTicks[i - 1].quote) / recentTicks[i - 1].quote;
    
    if (Math.abs(priceChange) > threshold) {
      return {
        direction: priceChange > 0 ? "up" : "down",
        epoch: recentTicks[i].epoch,
      };
    }
  }
  
  return null;
}

/**
 * Determine trend direction
 */
function determineTrend(
  ema20: number,
  ema50: number,
  currentPrice: number
): "bullish" | "bearish" | "sideways" {
  const emaDiff = (ema20 - ema50) / ema50;
  const priceVsEma = (currentPrice - ema20) / ema20;
  
  if (ema20 > ema50 && priceVsEma > 0.001) return "bullish";
  if (ema20 < ema50 && priceVsEma < -0.001) return "bearish";
  return "sideways";
}

/**
 * Analyze market and build comprehensive data
 */
async function analyzeMarket(symbol: string): Promise<MarketData> {
  // Check cache first (valid for 30 seconds)
  const cached = marketDataCache.get(symbol);
  if (cached && cached.ticks.length > 0) {
    const lastTick = cached.ticks[cached.ticks.length - 1];
    if (Date.now() / 1000 - lastTick.epoch < 30) {
      console.log(`[MarketData] Using cached data for ${symbol}`);
      return cached;
    }
  }

  console.log(`[MarketData] Analyzing ${symbol}...`);
  
  // Fetch historical ticks
  const ticks = await fetchTickHistory(symbol, 100);
  
  if (ticks.length === 0) {
    console.log(`[MarketData] No data available for ${symbol}`);
    return { symbol, ticks: [] };
  }

  const prices = ticks.map(t => t.quote);
  const currentPrice = prices[prices.length - 1];
  
  // Calculate indicators
  const ema20 = calculateEMA(prices, 20);
  const ema50 = calculateEMA(prices, 50);
  const rsi14 = calculateRSI(prices, 14);
  const volatility = calculateVolatility(prices, 20);
  const trend = determineTrend(ema20, ema50, currentPrice);
  const lastSpike = detectSpike(ticks);

  const marketData: MarketData = {
    symbol,
    ticks,
    ema20,
    ema50,
    rsi14,
    trend,
    volatility,
    lastSpike,
  };

  // Update cache
  marketDataCache.set(symbol, marketData);
  
  console.log(`[MarketData] ${symbol}: Price=${currentPrice.toFixed(5)}, EMA20=${ema20.toFixed(5)}, RSI=${rsi14.toFixed(1)}, Trend=${trend}`);
  
  return marketData;
}

// ============= STRATEGY HELPERS =============

function isPreSessionWindow(sessionName: string): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const session = FOREX_SESSIONS[sessionName as keyof typeof FOREX_SESSIONS];
  
  if (!session) return false;
  
  const preSessionMinutes = session.open * 60 - 3;
  const currentMinutes = utcHour * 60 + utcMinutes;
  
  return currentMinutes >= preSessionMinutes && currentMinutes < session.open * 60;
}

// ============= STRATEGY MODULES WITH LIVE DATA =============

async function botvioStrategy(instance: any): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  const markets = instance.markets || ["R_100"];
  
  console.log(`[Botvio] Running strategy with live data for ${instance.name}`);
  
  for (const symbol of markets) {
    const data = await analyzeMarket(symbol);
    
    if (!data.ticks.length || !data.ema20 || !data.rsi14) continue;
    
    const currentPrice = data.ticks[data.ticks.length - 1].quote;
    
    // H1 EMA50 trend bias + M15 EMA20 rejection + RSI confirmation
    if (data.trend === "bullish" && data.rsi14 < 70 && currentPrice > data.ema20) {
      // Price above EMA20 in bullish trend, not overbought
      signals.push({
        symbol,
        direction: "BUY",
        stake: instance.max_stake || 1,
        duration: 5,
        duration_unit: "m",
        confidence: 75 + (70 - data.rsi14) * 0.3, // Higher confidence when RSI is lower
        reason: `Botvio: Bullish trend, RSI=${data.rsi14.toFixed(1)}, Price above EMA20`,
      });
    } else if (data.trend === "bearish" && data.rsi14 > 30 && currentPrice < data.ema20) {
      signals.push({
        symbol,
        direction: "SELL",
        stake: instance.max_stake || 1,
        duration: 5,
        duration_unit: "m",
        confidence: 75 + (data.rsi14 - 30) * 0.3,
        reason: `Botvio: Bearish trend, RSI=${data.rsi14.toFixed(1)}, Price below EMA20`,
      });
    }
  }
  
  return signals;
}

async function boomCrashSniperStrategy(instance: any): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  const markets = instance.markets || ["BOOM1000", "CRASH1000"];
  
  console.log(`[Boom/Crash] Running with live spike detection`);
  
  for (const symbol of markets) {
    const data = await analyzeMarket(symbol);
    
    if (!data.ticks.length) continue;
    
    const isBoom = symbol.includes("BOOM");
    const isCrash = symbol.includes("CRASH");
    
    // Check for consecutive moves against spike direction
    const recentTicks = data.ticks.slice(-20);
    let consecutiveDown = 0;
    let consecutiveUp = 0;
    
    for (let i = 1; i < recentTicks.length; i++) {
      if (recentTicks[i].quote < recentTicks[i - 1].quote) {
        consecutiveDown++;
        consecutiveUp = 0;
      } else {
        consecutiveUp++;
        consecutiveDown = 0;
      }
    }
    
    // Boom: After many consecutive down ticks, expect spike up
    if (isBoom && consecutiveDown >= 8) {
      signals.push({
        symbol,
        direction: "BUY",
        stake: instance.max_stake || 1,
        duration: 5,
        duration_unit: "t",
        confidence: 70 + Math.min(consecutiveDown, 15),
        reason: `Boom spike anticipation: ${consecutiveDown} consecutive down ticks`,
      });
    }
    
    // Crash: After many consecutive up ticks, expect spike down
    if (isCrash && consecutiveUp >= 8) {
      signals.push({
        symbol,
        direction: "SELL",
        stake: instance.max_stake || 1,
        duration: 5,
        duration_unit: "t",
        confidence: 70 + Math.min(consecutiveUp, 15),
        reason: `Crash spike anticipation: ${consecutiveUp} consecutive up ticks`,
      });
    }
  }
  
  return signals;
}

async function volatilityTrendStrategy(instance: any): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  const markets = instance.markets || ["R_100", "R_50", "R_75"];
  
  console.log(`[Volatility Trend] Running with live EMA crossover detection`);
  
  for (const symbol of markets) {
    const data = await analyzeMarket(symbol);
    
    if (!data.ema20 || !data.ema50 || !data.rsi14) continue;
    
    const currentPrice = data.ticks[data.ticks.length - 1]?.quote;
    if (!currentPrice) continue;
    
    // EMA crossover strategy with RSI filter
    const emaCrossUp = data.ema20 > data.ema50 && data.rsi14 < 65;
    const emaCrossDown = data.ema20 < data.ema50 && data.rsi14 > 35;
    
    // Only trade in direction of trend with confirmation
    if (emaCrossUp && data.trend === "bullish") {
      signals.push({
        symbol,
        direction: "BUY",
        stake: instance.max_stake || 1,
        duration: 5,
        duration_unit: "t",
        confidence: 75,
        reason: `EMA20 above EMA50, RSI=${data.rsi14.toFixed(1)}, Trend=bullish`,
      });
    } else if (emaCrossDown && data.trend === "bearish") {
      signals.push({
        symbol,
        direction: "SELL",
        stake: instance.max_stake || 1,
        duration: 5,
        duration_unit: "t",
        confidence: 75,
        reason: `EMA20 below EMA50, RSI=${data.rsi14.toFixed(1)}, Trend=bearish`,
      });
    }
  }
  
  return signals;
}

async function rsiStrategy(instance: any): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  const markets = instance.markets || ["R_100", "frxEURUSD"];
  
  console.log(`[RSI Strategy] Running with live RSI calculation`);
  
  for (const symbol of markets) {
    const data = await analyzeMarket(symbol);
    
    if (!data.rsi14) continue;
    
    // RSI oversold/overbought with trend confirmation
    if (data.rsi14 < 30 && data.trend !== "bearish") {
      signals.push({
        symbol,
        direction: "BUY",
        stake: instance.max_stake || 1,
        duration: 5,
        duration_unit: "m",
        confidence: 80 + (30 - data.rsi14),
        reason: `RSI oversold: ${data.rsi14.toFixed(1)}`,
      });
    } else if (data.rsi14 > 70 && data.trend !== "bullish") {
      signals.push({
        symbol,
        direction: "SELL",
        stake: instance.max_stake || 1,
        duration: 5,
        duration_unit: "m",
        confidence: 80 + (data.rsi14 - 70),
        reason: `RSI overbought: ${data.rsi14.toFixed(1)}`,
      });
    }
  }
  
  return signals;
}

async function customStrategyExecutor(instance: any): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  const config = instance.config_json || {};
  
  console.log(`[Custom Strategy] Running for ${instance.name}`);
  
  const {
    symbol = "R_100",
    direction = "BUY",
    stake = 1,
    duration = 5,
    duration_unit = "t",
    entry_conditions = [],
    confidence_threshold = 70,
    auto_execute = false,
    use_live_data = true,
  } = config;
  
  if (!auto_execute) {
    console.log(`[Custom Strategy] Auto-execute disabled, skipping`);
    return signals;
  }
  
  // Get live market data if enabled
  let marketData: MarketData | null = null;
  if (use_live_data) {
    marketData = await analyzeMarket(symbol);
  }
  
  let conditionsMet = true;
  let confidence = 80;
  
  for (const condition of entry_conditions) {
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
    
    // Live data conditions
    if (marketData && condition.type === "rsi_below" && marketData.rsi14) {
      if (marketData.rsi14 >= condition.value) {
        conditionsMet = false;
        break;
      }
      confidence += 5;
    }
    
    if (marketData && condition.type === "rsi_above" && marketData.rsi14) {
      if (marketData.rsi14 <= condition.value) {
        conditionsMet = false;
        break;
      }
      confidence += 5;
    }
    
    if (marketData && condition.type === "trend_is") {
      if (marketData.trend !== condition.value) {
        conditionsMet = false;
        break;
      }
      confidence += 10;
    }
    
    if (marketData && condition.type === "volatility_above") {
      if (!marketData.volatility || marketData.volatility < condition.value) {
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
      confidence: Math.min(confidence, 95),
      reason: `Custom strategy: ${instance.name}${marketData ? ` (RSI=${marketData.rsi14?.toFixed(1)}, Trend=${marketData.trend})` : ""}`,
    });
  }
  
  return signals;
}

async function boomCrashCFDStrategy(instance: any): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  const config = instance.config_json || {};
  const markets = instance.markets || ["BOOM1000", "CRASH1000"];
  
  console.log(`[Boom/Crash CFD] Running with live data`);
  
  const {
    stake = 1,
    duration = 5,
    duration_unit = "t",
    auto_execute = false,
    min_consecutive = 6,
  } = config;
  
  if (!auto_execute) {
    console.log(`[Boom/Crash CFD] Auto-execute disabled`);
    return signals;
  }
  
  for (const market of markets) {
    const data = await analyzeMarket(market);
    
    if (!data.ticks.length) continue;
    
    const isBoom = market.includes("BOOM");
    
    // Analyze tick direction pattern
    const recentTicks = data.ticks.slice(-30);
    let consecutiveAgainst = 0;
    
    for (let i = 1; i < recentTicks.length; i++) {
      const priceUp = recentTicks[i].quote > recentTicks[i - 1].quote;
      
      if (isBoom && !priceUp) {
        consecutiveAgainst++;
      } else if (!isBoom && priceUp) {
        consecutiveAgainst++;
      } else {
        consecutiveAgainst = 0;
      }
    }
    
    if (consecutiveAgainst >= min_consecutive) {
      signals.push({
        symbol: market,
        direction: isBoom ? "BUY" : "SELL",
        stake,
        duration,
        duration_unit,
        confidence: 70 + Math.min(consecutiveAgainst * 2, 20),
        reason: `${market} spike anticipation: ${consecutiveAgainst} consecutive ticks against`,
      });
    }
  }
  
  return signals;
}

async function volatilityCFDStrategy(instance: any): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  const config = instance.config_json || {};
  const markets = instance.markets || ["R_100", "R_50"];
  
  console.log(`[Volatility CFD] Running with live EMA/RSI analysis`);
  
  const {
    stake = 1,
    duration = 5,
    duration_unit = "t",
    auto_execute = false,
    trend_direction = "both",
    min_rsi_diff = 10,
  } = config;
  
  if (!auto_execute) return signals;
  
  for (const symbol of markets) {
    const data = await analyzeMarket(symbol);
    
    if (!data.ema20 || !data.ema50 || !data.rsi14) continue;
    
    // Only trade when RSI is not neutral
    const rsiSignal = data.rsi14 < (50 - min_rsi_diff) ? "BUY" : 
                      data.rsi14 > (50 + min_rsi_diff) ? "SELL" : null;
    
    if (!rsiSignal) continue;
    
    // Confirm with trend
    if (rsiSignal === "BUY" && (trend_direction === "buy" || trend_direction === "both")) {
      if (data.trend === "bullish" || data.trend === "sideways") {
        signals.push({
          symbol,
          direction: "BUY",
          stake,
          duration,
          duration_unit,
          confidence: 75,
          reason: `Volatility CFD: RSI=${data.rsi14.toFixed(1)}, Trend=${data.trend}`,
        });
      }
    }
    
    if (rsiSignal === "SELL" && (trend_direction === "sell" || trend_direction === "both")) {
      if (data.trend === "bearish" || data.trend === "sideways") {
        signals.push({
          symbol,
          direction: "SELL",
          stake,
          duration,
          duration_unit,
          confidence: 75,
          reason: `Volatility CFD: RSI=${data.rsi14.toFixed(1)}, Trend=${data.trend}`,
        });
      }
    }
  }
  
  return signals;
}

// Session strategies (keep sync for now, fetch data only when session active)
async function londonSessionStrategy(instance: any): Promise<TradingSignal[]> {
  if (!isPreSessionWindow("london")) return [];
  
  console.log(`[London Session] Running pre-session analysis`);
  const data = await analyzeMarket("frxEURUSD");
  
  if (data.trend === "bullish" && data.rsi14 && data.rsi14 < 60) {
    return [{
      symbol: "frxEURUSD",
      direction: "BUY",
      stake: instance.max_stake || 1,
      duration: 5,
      duration_unit: "m",
      confidence: 70,
      reason: `London session: EUR bullish momentum building`,
    }];
  }
  
  return [];
}

async function newyorkSessionStrategy(instance: any): Promise<TradingSignal[]> {
  if (!isPreSessionWindow("newyork")) return [];
  
  console.log(`[New York Session] Running pre-session analysis`);
  const data = await analyzeMarket("frxEURUSD");
  
  if (data.trend && data.rsi14) {
    const direction = data.trend === "bullish" ? "BUY" : data.trend === "bearish" ? "SELL" : null;
    if (direction) {
      return [{
        symbol: "frxEURUSD",
        direction,
        stake: instance.max_stake || 1,
        duration: 5,
        duration_unit: "m",
        confidence: 70,
        reason: `NY session: ${data.trend} continuation`,
      }];
    }
  }
  
  return [];
}

async function tokyoSessionStrategy(instance: any): Promise<TradingSignal[]> {
  if (!isPreSessionWindow("tokyo")) return [];
  
  console.log(`[Tokyo Session] Running pre-session analysis`);
  const data = await analyzeMarket("frxUSDJPY");
  
  if (data.trend && data.rsi14) {
    const direction = data.trend === "bullish" ? "BUY" : data.trend === "bearish" ? "SELL" : null;
    if (direction) {
      return [{
        symbol: "frxUSDJPY",
        direction,
        stake: instance.max_stake || 1,
        duration: 5,
        duration_unit: "m",
        confidence: 70,
        reason: `Tokyo session: ${data.trend} bias on JPY`,
      }];
    }
  }
  
  return [];
}

async function sydneySessionStrategy(instance: any): Promise<TradingSignal[]> {
  if (!isPreSessionWindow("sydney")) return [];
  
  console.log(`[Sydney Session] Running pre-session analysis`);
  const data = await analyzeMarket("frxAUDUSD");
  
  if (data.trend && data.rsi14) {
    const direction = data.trend === "bullish" ? "BUY" : data.trend === "bearish" ? "SELL" : null;
    if (direction) {
      return [{
        symbol: "frxAUDUSD",
        direction,
        stake: instance.max_stake || 1,
        duration: 5,
        duration_unit: "m",
        confidence: 70,
        reason: `Sydney session: ${data.trend} bias on AUD`,
      }];
    }
  }
  
  return [];
}

async function dailyRangeStrategy(instance: any): Promise<TradingSignal[]> {
  console.log(`[Daily Range] Monitoring for extremes with live data`);
  
  const markets = instance.markets || ["frxXAUUSD"];
  const signals: TradingSignal[] = [];
  
  for (const symbol of markets) {
    const data = await analyzeMarket(symbol);
    
    if (!data.ticks.length || !data.rsi14) continue;
    
    // Detect extreme RSI for potential reversal
    if (data.rsi14 < 20) {
      signals.push({
        symbol,
        direction: "BUY",
        stake: instance.max_stake || 1,
        duration: 15,
        duration_unit: "m",
        confidence: 75,
        reason: `Daily extreme: RSI=${data.rsi14.toFixed(1)} severely oversold`,
      });
    } else if (data.rsi14 > 80) {
      signals.push({
        symbol,
        direction: "SELL",
        stake: instance.max_stake || 1,
        duration: 15,
        duration_unit: "m",
        confidence: 75,
        reason: `Daily extreme: RSI=${data.rsi14.toFixed(1)} severely overbought`,
      });
    }
  }
  
  return signals;
}

const strategies: Record<string, (instance: any) => Promise<TradingSignal[]>> = {
  botvio: botvioStrategy,
  boom_crash_sniper: boomCrashSniperStrategy,
  volatility_trend: volatilityTrendStrategy,
  london_session: londonSessionStrategy,
  newyork_session: newyorkSessionStrategy,
  tokyo_session: tokyoSessionStrategy,
  sydney_session: sydneySessionStrategy,
  daily_range: dailyRangeStrategy,
  rsi_strategy: rsiStrategy,
  custom_strategy: customStrategyExecutor,
  boom_crash_cfd: boomCrashCFDStrategy,
  volatility_cfd: volatilityCFDStrategy,
};

// ============= RISK MANAGEMENT =============

async function checkRiskLimits(
  supabase: any,
  instance: any
): Promise<{ canTrade: boolean; reason: string }> {
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

  const { count: openTradesCount } = await supabase
    .from("bot_trades")
    .select("*", { count: "exact", head: true })
    .eq("bot_instance_id", instance.id)
    .eq("status", "open");

  const maxOpenTrades = instance.max_open_trades || 3;
  if ((openTradesCount || 0) >= maxOpenTrades) {
    return { canTrade: false, reason: `Max open trades (${maxOpenTrades}) reached` };
  }

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

// ============= TRADE EXECUTION =============

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

// ============= BOT INSTANCE PROCESSING =============

async function processBotInstance(
  supabase: any,
  instance: any
): Promise<void> {
  const botCode = instance.bots?.code;
  const botName = instance.name;
  
  console.log(`Processing bot instance: ${botName} (${botCode})`);

  const riskCheck = await checkRiskLimits(supabase, instance);
  if (!riskCheck.canTrade) {
    console.log(`[${botName}] Cannot trade: ${riskCheck.reason}`);
    
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

  const strategyFn = strategies[botCode];
  if (!strategyFn) {
    console.log(`[${botName}] No strategy found for code: ${botCode}`);
    return;
  }

  // Run strategy to get signals (now async with live data)
  const signals = await strategyFn(instance);

  if (signals.length === 0) {
    console.log(`[${botName}] No trading signals generated`);
    return;
  }

  const apiKey = instance.trading_accounts?.api_key_encrypted;
  const maxStake = instance.max_stake || 10;

  for (const signal of signals) {
    const stake = Math.min(signal.stake, maxStake);

    console.log(`[${botName}] Executing trade: ${signal.direction} ${signal.symbol} @ $${stake} (Confidence: ${signal.confidence.toFixed(1)}%)`);

    const result = await executeDerivTrade(apiKey, { ...signal, stake });

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
          market_data: {
            confidence: signal.confidence,
            reason: signal.reason,
          },
        },
      });

      // Create notification for user
      await supabase.from("notifications").insert({
        user_id: instance.user_id,
        type: "trade",
        title: `Trade Executed: ${signal.symbol}`,
        message: `${signal.direction} $${stake} - ${signal.reason}`,
        metadata: {
          symbol: signal.symbol,
          direction: signal.direction,
          stake,
          confidence: signal.confidence,
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

// ============= USER STRATEGY SELECTIONS =============

async function getUserEnabledStrategies(
  supabase: any,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_strategy_selections")
    .select("strategy_code")
    .eq("user_id", userId)
    .eq("enabled", true);

  if (error || !data || data.length === 0) {
    // Default: only botvio enabled
    return ["botvio"];
  }

  return data.map((s: any) => s.strategy_code);
}

// ============= MAIN HANDLER =============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Bot Worker starting with live market data + user strategy selections...");

    // Fetch all active bot instances
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

    // Also check for users with enabled strategies who have trading accounts
    const { data: usersWithStrategies } = await supabase
      .from("user_strategy_selections")
      .select("user_id")
      .eq("enabled", true);

    const userIds = [...new Set((usersWithStrategies || []).map((u: any) => u.user_id))];
    
    console.log(`Found ${instances?.length || 0} bot instances, ${userIds.length} users with strategies`);

    const results = [];

    // Process traditional bot instances
    if (instances && instances.length > 0) {
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
    }

    // Process user strategy selections (for users without explicit bot instances)
    for (const userId of userIds) {
      try {
        // Check if user already has an active bot instance
        const hasInstance = instances?.some((i: any) => i.user_id === userId);
        if (hasInstance) continue;

        // Get user's trading account
        const { data: accounts } = await supabase
          .from("trading_accounts")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .limit(1);

        if (!accounts || accounts.length === 0) continue;

        const account = accounts[0];
        const enabledStrategies = await getUserEnabledStrategies(supabase, userId);
        
        console.log(`[User ${userId}] Enabled strategies: ${enabledStrategies.join(", ")}`);

        // Run each enabled strategy
        for (const strategyCode of enabledStrategies) {
          const strategyFn = strategies[strategyCode];
          if (!strategyFn) continue;

          // Create a virtual instance for the strategy
          const virtualInstance = {
            id: `virtual-${userId}-${strategyCode}`,
            user_id: userId,
            trading_account_id: account.id,
            trading_accounts: account,
            name: `${strategyCode} (auto)`,
            markets: ["R_100", "frxEURUSD"], // Default markets
            max_stake: 1,
            max_open_trades: 3,
            max_daily_loss_percent: 5,
            config_json: { auto_execute: true },
            bots: { code: strategyCode, name: strategyCode },
          };

          // Check risk limits
          const riskCheck = await checkRiskLimits(supabase, virtualInstance);
          if (!riskCheck.canTrade) {
            console.log(`[${strategyCode}] User ${userId} blocked: ${riskCheck.reason}`);
            continue;
          }

          // Get signals
          const signals = await strategyFn(virtualInstance);
          
          if (signals.length === 0) continue;

          // Execute trades
          for (const signal of signals) {
            const stake = Math.min(signal.stake, 1);
            console.log(`[${strategyCode}] User ${userId}: ${signal.direction} ${signal.symbol} @ $${stake}`);

            const result = await executeDerivTrade(account.api_key_encrypted, { ...signal, stake });

            if (result.success) {
              // Log trade
              await supabase.from("bot_trades").insert({
                bot_instance_id: virtualInstance.id,
                symbol: signal.symbol,
                side: signal.direction,
                stake,
                broker_trade_id: result.contract_id,
                status: "open",
              });

              // Create notification
              await supabase.from("notifications").insert({
                user_id: userId,
                type: "trade",
                title: `Auto Trade: ${signal.symbol}`,
                message: `${signal.direction} $${stake} via ${strategyCode} - ${signal.reason}`,
                metadata: { signal, contract_id: result.contract_id },
              });

              console.log(`[${strategyCode}] Trade executed: ${result.contract_id}`);
            } else {
              console.error(`[${strategyCode}] Trade failed: ${result.error}`);
            }
          }
        }

        results.push({ user_id: userId, status: "processed" });
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
        results.push({ user_id: userId, status: "error", error: (error as Error).message });
      }
    }

    // Clear cache after run
    marketDataCache.clear();

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
        market_data_fetched: true,
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
