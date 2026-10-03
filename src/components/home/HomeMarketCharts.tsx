import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useMarketFeed } from "@/hooks/useMarketFeed";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Activity } from "lucide-react";

type MiniProps = {
  title: string;
  symbol: string;
  source: "deriv" | "weltrade-bridge";
  feedSymbol: string;
  decimals: number;
  to: string;
  tag: string;
};

function MiniMarketChart({ title, symbol, source, feedSymbol, decimals, to, tag }: MiniProps) {
  const { candles, price, status } = useMarketFeed({
    source, feedSymbol, timeframe: "5m", historyLimit: 80, flushMs: 1000, enabled: true,
  });

  const points = useMemo(() => {
    const data = candles.slice(-55);
    if (data.length < 2) return "";
    const lo = Math.min(...data.map(c => c.low));
    const hi = Math.max(...data.map(c => c.high));
    const range = hi - lo || 1;
    return data.map((c, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 8 + ((hi - c.close) / range) * 84;
      return x.toFixed(2) + "," + y.toFixed(2);
    }).join(" ");
  }, [candles]);

  const rising = candles.length >= 2 ? candles.at(-1)!.close >= candles.at(-2)!.close : true;
  const live = status === "live";
  const gradientId = "mini-fill-" + feedSymbol.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <Link to={to} className="group block overflow-hidden rounded-xl border border-border/60 bg-card/80 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
      <div className="flex items-center justify-between gap-2 border-b border-border/40 px-3 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-black">{title}</span>
            <Badge variant="outline" className="text-[7px]">{tag}</Badge>
          </div>
          <span className="text-[9px] text-muted-foreground">{symbol}</span>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-[8px] font-bold">
            <span className={live ? "h-1.5 w-1.5 rounded-full bg-success" : "h-1.5 w-1.5 rounded-full bg-muted-foreground"} />
            {live ? "LIVE" : status.toUpperCase()}
          </div>
          <div className="font-mono text-[11px] font-black">{price == null ? "—" : price.toFixed(decimals)}</div>
        </div>
      </div>
      <div className="relative h-28 bg-background/70 px-2 py-2">
        <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" aria-label={title + " live chart"}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity=".20" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="92" x2="100" y2="92" className="stroke-border" strokeWidth=".7" />
          {points ? (
            <>
              <polyline points={"0,100 " + points + " 100,100"} fill={"url(#" + gradientId + ")"} />
              <polyline points={points} fill="none" className={rising ? "stroke-success" : "stroke-destructive"} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
            </>
          ) : (
            <text x="50" y="52" textAnchor="middle" className="fill-muted-foreground" fontSize="5">Waiting for live data…</text>
          )}
        </svg>
        <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[8px] text-muted-foreground"><Activity className="h-2.5 w-2.5" /> 5m live view</div>
      </div>
      <div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
        <span className="text-[9px] font-semibold text-muted-foreground">Open trading hub</span>
        <ArrowRight className="h-3 w-3 text-primary transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export function HomeMarketCharts() {
  return (
    <section className="border-b border-border/50 bg-card/20">
      <div className="container mx-auto px-4 py-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-widest text-primary">Live market charts</p><h2 className="mt-1 text-lg font-black">Markets at a glance</h2></div>
          <Link to="/markets" className="text-[10px] font-bold text-primary">All markets <ArrowRight className="inline h-3 w-3" /></Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MiniMarketChart title="Synthetic" symbol="BOOM 500 Index" source="deriv" feedSymbol="BOOM500" decimals={3} to="/synthetic-hub" tag="DERIV" />
          <MiniMarketChart title="Weltrade" symbol="GainX 400" source="weltrade-bridge" feedSymbol="GainX 400" decimals={3} to="/weltrade" tag="MT5" />
          <MiniMarketChart title="Bitcoin" symbol="BTC/USD" source="deriv" feedSymbol="cryBTCUSD" decimals={2} to="/bitcoin" tag="24/7" />
        </div>
      </div>
    </section>
  );
}