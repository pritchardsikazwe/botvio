import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Signal {
  id: string;
  strategy_name: string;
  symbol: string;
  timeframe: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  zone_min: number | null;
  zone_max: number | null;
  reason: string | null;
  confidence: number | null;
  status: string;
  created_at: string;
}

interface Zone {
  min: number;
  max: number;
  mid: number;
}

interface AnalysisResult {
  signal: Signal | null;
  supportZones: Zone[];
  resistanceZones: Zone[];
  analysisTime: string;
}

export const useBotvioSignals = (symbol: string = "XAUUSD", timeframe: string = "M5") => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing signals from database
  const fetchSignals = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("trading_signals")
        .select("*")
        .eq("strategy_name", "Botvio Sniper")
        .eq("symbol", symbol)
        .order("created_at", { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;
      
      // Type cast with proper validation
      const typedData: Signal[] = (data || []).map(item => ({
        ...item,
        direction: item.direction as "BUY" | "SELL"
      }));
      setSignals(typedData);
    } catch (err) {
      console.error("Error fetching signals:", err);
      setError("Failed to fetch signals");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Run Botvio Sniper analysis via edge function
  const runAnalysis = useCallback(async (candles?: any[]) => {
    setAnalyzing(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke("botvio-sniper", {
        body: { symbol, timeframe, candles },
      });

      if (funcError) throw funcError;

      setLastAnalysis(data);

      // Refresh signals if a new one was created
      if (data?.signal) {
        await fetchSignals();
      }

      return data;
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Analysis failed");
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [symbol, timeframe, fetchSignals]);

  // Initial fetch
  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  return {
    signals,
    loading,
    analyzing,
    lastAnalysis,
    error,
    runAnalysis,
    refetch: fetchSignals,
  };
};
