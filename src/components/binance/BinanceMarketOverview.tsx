import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3, Shield, Globe, Users, CheckCircle2 } from "lucide-react";

interface TickerData {
  symbol: string;
  priceChangePercent: string;
  lastPrice: string;
  quoteVolume: string;
}

function useMarketOverview() {
  return useQuery({
    queryKey: ["binance-market-overview"],
    queryFn: async () => {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      if (!res.ok) throw new Error("Failed to fetch");
      const all: TickerData[] = await res.json();
      const usdt = all.filter(t => t.symbol.endsWith("USDT") && !t.symbol.includes("_"));

      const sorted = [...usdt].sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));
      const gainers = sorted.slice(0, 5);
      const losers = sorted.slice(-5).reverse();

      const byVolume = [...usdt].sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
      const topVolume = byVolume.slice(0, 5);

      const totalVolume = usdt.reduce((s, t) => s + parseFloat(t.quoteVolume), 0);
      const btc = usdt.find(t => t.symbol === "BTCUSDT");
      const eth = usdt.find(t => t.symbol === "ETHUSDT");

      const avgChange = usdt.reduce((s, t) => s + parseFloat(t.priceChangePercent), 0) / usdt.length;
      const positiveCount = usdt.filter(t => parseFloat(t.priceChangePercent) > 0).length;
      const sentiment = Math.round((positiveCount / usdt.length) * 200 - 100);
      const health = Math.min(10, Math.max(1, 5 + avgChange * 0.5)).toFixed(1);

      return { gainers, losers, topVolume, totalVolume, btc, eth, sentiment, health };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function BinanceMarketOverview() {
  const { data, isLoading } = useMarketOverview();

  if (isLoading || !data) {
    return <div className="h-64 bg-secondary/20 rounded-xl animate-pulse" />;
  }

  const fmt = (v: number) => v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : `$${(v / 1e6).toFixed(0)}M`;

  return (
    <div className="space-y-4">
      {/* Market Stats */}
      <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-background">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-yellow-500" />
            <h2 className="font-bold text-lg">Market Analysis</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="24h Volume" value={fmt(data.totalVolume)} />
            <Stat label="BTC Price" value={data.btc ? `$${parseFloat(data.btc.lastPrice).toLocaleString()}` : "—"} />
            <Stat label="🔸 Health Score" value={`${data.health} / 10`} />
            <Stat label="🔸 Sentiment" value={`${data.sentiment}%`} sub="(-100% to 100%)" />
          </div>
        </CardContent>
      </Card>

      {/* Gainers / Losers / Volume */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RankingCard title="🟢 Top Gainers" items={data.gainers} type="gainer" />
        <RankingCard title="🔴 Top Losers" items={data.losers} type="loser" />
        <RankingCard title="📊 Largest Volume" items={data.topVolume} type="volume" />
      </div>

      {/* Why Botvio */}
      <Card className="border-primary/20">
        <CardContent className="py-4">
          <h3 className="font-bold mb-3 text-sm">Why Botvio Crypto Signals?</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              "92%+ Historical Accuracy",
              "Futures/Spot/Alt Signals",
              "Scalps, Swing & Long Term",
              "Insider News & Alerts",
              "Technical & Sentiment Analysis",
              "Risk Management Built-in",
              "Global Team of Analysts",
              "24/7 Signal Coverage",
            ].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-secondary/40 rounded-lg p-2.5">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className="font-mono font-bold text-sm">{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function RankingCard({ title, items, type }: { title: string; items: TickerData[]; type: "gainer" | "loser" | "volume" }) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <h4 className="font-bold text-xs mb-2">{title}</h4>
        <div className="space-y-1.5">
          {items.map((t, i) => {
            const sym = t.symbol.replace("USDT", "");
            const pct = parseFloat(t.priceChangePercent);
            const vol = parseFloat(t.quoteVolume);
            return (
              <div key={t.symbol} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{i + 1}. <span className="font-semibold text-foreground">{sym}</span></span>
                {type === "volume" ? (
                  <span className="font-mono text-muted-foreground">{vol >= 1e9 ? `$${(vol / 1e9).toFixed(1)}B` : `$${(vol / 1e6).toFixed(0)}M`}</span>
                ) : (
                  <span className={`font-mono font-semibold ${pct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
