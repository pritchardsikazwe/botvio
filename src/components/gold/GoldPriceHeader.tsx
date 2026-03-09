import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown } from "lucide-react";

interface QuoteData {
  price: number;
  change_percent_24h: number;
}

export function GoldPriceHeader() {
  const { data: quote } = useQuery<QuoteData | null>({
    queryKey: ["gold-hub-quote"],
    queryFn: async () => {
      const res = await supabase
        .from("market_quotes")
        .select("price, change_percent_24h")
        .eq("symbol", "XAUUSD")
        .order("fetched_at", { ascending: false })
        .limit(1)
        .single();
      return (res.data as QuoteData | null) ?? null;
    },
    refetchInterval: 15000,
  });

  const price = quote?.price ?? 0;
  const change = quote?.change_percent_24h ?? 0;
  const isUp = change >= 0;

  return (
    <div className="flex items-center gap-4 bg-card/80 border border-border/50 rounded-xl px-5 py-3">
      <div>
        <p className="text-xs text-muted-foreground font-mono">XAU/USD</p>
        <p className="text-2xl font-extrabold font-mono text-foreground">
          {price > 0 ? `$${price.toFixed(2)}` : "—"}
        </p>
      </div>
      {price > 0 && (
        <div className={`flex items-center gap-1 text-sm font-bold ${isUp ? "text-success" : "text-destructive"}`}>
          {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isUp ? "+" : ""}{change.toFixed(2)}%
        </div>
      )}
    </div>
  );
}
