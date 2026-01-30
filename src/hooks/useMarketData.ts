import { useState, useEffect, useCallback, useRef } from "react";
import { DerivWebSocketService } from "@/services/derivWebSocket";
import type { DerivTick } from "@/types/deriv";

const DEFAULT_APP_ID = "123162";

export interface MarketIndicators {
  symbol: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  ema20: number;
  ema50: number;
  rsi14: number;
  trend: "bullish" | "bearish" | "sideways";
  volatility: number;
  high24h: number;
  low24h: number;
  tickCount: number;
  lastUpdate: number;
}

interface MarketDataState {
  [symbol: string]: MarketIndicators;
}

// Calculate EMA
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// Calculate RSI
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

// Calculate volatility
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
  
  return Math.sqrt(variance) * 100;
}

// Determine trend
function determineTrend(
  ema20: number,
  ema50: number,
  currentPrice: number
): "bullish" | "bearish" | "sideways" {
  const emaDiff = (ema20 - ema50) / ema50;
  const priceVsEma = (currentPrice - ema20) / ema20;
  
  if (ema20 > ema50 && priceVsEma > 0.0005) return "bullish";
  if (ema20 < ema50 && priceVsEma < -0.0005) return "bearish";
  return "sideways";
}

export function useMarketData(symbols: string[]) {
  const [data, setData] = useState<MarketDataState>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const serviceRef = useRef<DerivWebSocketService | null>(null);
  const priceHistoryRef = useRef<Record<string, number[]>>({});
  const highLowRef = useRef<Record<string, { high: number; low: number }>>({});

  // Map symbol to Deriv format
  const toDerivSymbol = useCallback((symbol: string) => {
    const s = symbol.trim();
    if (!s) return s;
    if (s.includes("_") || s.startsWith("frx") || s.startsWith("cry")) return s;
    if (s === "XAUUSD") return "frxXAUUSD";
    if (s === "BTCUSD") return "cryBTCUSD";
    if (s === "ETHUSD") return "cryETHUSD";
    return `frx${s}`;
  }, []);

  const updateIndicators = useCallback((symbol: string, tick: DerivTick) => {
    const history = priceHistoryRef.current[symbol] || [];
    history.push(tick.quote);
    
    // Keep last 200 ticks for calculations
    if (history.length > 200) {
      history.shift();
    }
    priceHistoryRef.current[symbol] = history;

    // Update high/low
    const hl = highLowRef.current[symbol] || { high: tick.quote, low: tick.quote };
    hl.high = Math.max(hl.high, tick.quote);
    hl.low = Math.min(hl.low, tick.quote);
    highLowRef.current[symbol] = hl;

    // Calculate indicators
    const currentPrice = tick.quote;
    const previousPrice = history.length > 1 ? history[history.length - 2] : currentPrice;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;
    
    const ema20 = calculateEMA(history, 20);
    const ema50 = calculateEMA(history, 50);
    const rsi14 = calculateRSI(history, 14);
    const volatility = calculateVolatility(history, 20);
    const trend = determineTrend(ema20, ema50, currentPrice);

    setData(prev => ({
      ...prev,
      [symbol]: {
        symbol,
        currentPrice,
        previousPrice,
        priceChange,
        priceChangePercent,
        ema20,
        ema50,
        rsi14,
        trend,
        volatility,
        high24h: hl.high,
        low24h: hl.low,
        tickCount: history.length,
        lastUpdate: Date.now(),
      },
    }));
  }, []);

  useEffect(() => {
    if (symbols.length === 0) return;

    const service = new DerivWebSocketService({ appId: DEFAULT_APP_ID });
    serviceRef.current = service;

    const connect = async () => {
      try {
        await service.open();
        setConnected(true);
        setError(null);

        // Subscribe to all symbols
        for (const symbol of symbols) {
          const derivSymbol = toDerivSymbol(symbol);
          await service.subscribeTicks(derivSymbol);
        }
      } catch (e: any) {
        setError(e.message || "Connection failed");
        setConnected(false);
      }
    };

    service.onStatus((status) => {
      setConnected(status === "open");
    });

    service.onError((msg) => {
      setError(msg);
    });

    service.onTick((tick) => {
      updateIndicators(tick.symbol, tick);
    });

    connect();

    return () => {
      service.close();
      serviceRef.current = null;
    };
  }, [symbols.join(","), toDerivSymbol, updateIndicators]);

  const refresh = useCallback(async () => {
    // Clear history and reconnect
    priceHistoryRef.current = {};
    highLowRef.current = {};
    setData({});
    
    if (serviceRef.current) {
      serviceRef.current.close();
      try {
        await serviceRef.current.open();
        for (const symbol of symbols) {
          const derivSymbol = toDerivSymbol(symbol);
          await serviceRef.current.subscribeTicks(derivSymbol);
        }
      } catch (e: any) {
        setError(e.message);
      }
    }
  }, [symbols, toDerivSymbol]);

  return {
    data,
    connected,
    error,
    refresh,
  };
}
