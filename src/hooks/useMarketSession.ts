import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface MarketSession {
  id: string;
  market_type: string;
  market_name: string;
  timezone: string;
  open_time: string | null;
  close_time: string | null;
  open_days: number[];
  is_24_7: boolean;
  is_active: boolean;
}

const symbolToMarketType: Record<string, string> = {
  // Forex
  EURUSD: "forex",
  GBPUSD: "forex",
  USDJPY: "forex",
  AUDUSD: "forex",
  USDCAD: "forex",
  USDCHF: "forex",
  XAUUSD: "forex", // Gold trades with forex hours
  frxEURUSD: "forex",
  frxGBPUSD: "forex",
  frxXAUUSD: "forex",
  
  // Synthetic indices
  R_100: "synthetic",
  R_75: "synthetic",
  R_50: "synthetic",
  R_25: "synthetic",
  R_10: "synthetic",
  "1HZ100V": "synthetic",
  "1HZ75V": "synthetic",
  BOOM_500: "synthetic",
  CRASH_500: "synthetic",
  BOOM_1000: "synthetic",
  CRASH_1000: "synthetic",
  
  // Crypto
  BTCUSD: "crypto",
  ETHUSD: "crypto",
  cryBTCUSD: "crypto",
  cryETHUSD: "crypto",
  
  // Indices
  US30: "indices",
  US100: "indices",
  US500: "indices",
  UK100: "indices",
  DE40: "indices",
};

export const useMarketSession = (symbol?: string) => {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["market-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_sessions")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as MarketSession[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const marketType = useMemo(() => {
    if (!symbol) return null;

    // Pattern-based detection (covers all Deriv synthetics, crypto, etc.)
    const s = symbol.toUpperCase().replace(/\s+/g, "");

    // Synthetic indices (24/7): Boom/Crash, Volatility (R_*, *V, 1HZ*V), Jump, Step, Range Break
    if (
      /BOOM|CRASH/.test(s) ||
      /^R_\d+/.test(s) ||
      /^\d+HZ\d+V/.test(s) ||
      /VOLATILITY/.test(s) ||
      /^JD?\d+/.test(s) ||
      /JUMP\d+/.test(s) ||
      /STEP/.test(s) ||
      /RANGE.*BREAK|RB\d+/.test(s) ||
      /^DEX\d+/.test(s) ||
      /GAINX|PAINX|TRENDX/.test(s)
    ) {
      return "synthetic";
    }

    // Crypto (24/7)
    if (/BTC|ETH|XRP|LTC|BNB|SOL|ADA|DOGE|USDT/.test(s)) {
      return "crypto";
    }

    // Direct match
    if (symbolToMarketType[symbol]) return symbolToMarketType[symbol];
    const cleanSymbol = symbol.replace(/^(frx|cry)/, "");
    if (symbolToMarketType[cleanSymbol]) return symbolToMarketType[cleanSymbol];

    // Default to forex if unknown
    return "forex";
  }, [symbol]);

  const isMarketOpen = useMemo(() => {
    if (!sessions || !marketType) return true; // Default to open if no data
    
    const session = sessions.find(s => s.market_type === marketType);
    if (!session) return true;
    
    // 24/7 markets are always open
    if (session.is_24_7) return true;
    
    // For forex, we use a simplified check (Sunday 22:00 UTC to Friday 22:00 UTC)
    if (marketType === "forex") {
      const now = new Date();
      const day = now.getUTCDay(); // 0 = Sunday
      const hour = now.getUTCHours();
      
      // Market closed from Friday 22:00 to Sunday 22:00 UTC
      if (day === 6) return false; // Saturday
      if (day === 0 && hour < 22) return false; // Sunday before 22:00
      if (day === 5 && hour >= 22) return false; // Friday after 22:00
      
      return true;
    }
    
    // For other markets with specific hours
    if (session.open_time && session.close_time) {
      const now = new Date();
      const day = now.getDay();
      
      // Check if today is a trading day
      if (!session.open_days.includes(day)) return false;
      
      // Simple time check (assumes UTC for now)
      const currentTime = now.toISOString().split("T")[1].substring(0, 5);
      return currentTime >= session.open_time && currentTime < session.close_time;
    }
    
    return true;
  }, [sessions, marketType]);

  const sessionInfo = useMemo(() => {
    if (!sessions || !marketType) return null;
    return sessions.find(s => s.market_type === marketType) || null;
  }, [sessions, marketType]);

  return {
    isLoading,
    isMarketOpen,
    marketType,
    sessionInfo,
    sessions,
  };
};
