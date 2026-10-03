import { Link } from "react-router-dom";
import { Clock3, Crosshair, Timer, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSymbolStrategy } from "@/lib/marketData/symbolStrategies";

const MODES = [
  { tf: "1M", query: "M1", name: "SCALPING", expiry: "5 min", icon: Crosshair, suffix: "Fast entry + micro confirmation" },
  { tf: "15M", query: "M15", name: "INTRADAY", expiry: "1 hour", icon: Timer, suffix: "Session trend + breakout/pullback" },
  { tf: "1H", query: "H1", name: "SWING", expiry: "4 hours", icon: TrendingUp, suffix: "Structure + higher-timeframe confirmation" },
  { tf: "1D", query: "D1", name: "POSITION", expiry: "3 days", icon: Clock3, suffix: "Daily structure + macro trend" },
] as const;

export function TradingHubSignalHorizons({
  symbol,
  strategyNames,
  compact = false,
}: {
  symbol: string;
  strategyNames?: Partial<Record<(typeof MODES)[number]["name"], string>>;
  compact?: boolean;
}) {
  const profile = getSymbolStrategy(symbol);
  const fallback = profile.label;

  return (
    <section className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[9px] font-black">
            BOTVIO SIGNAL HORIZONS
          </Badge>
          <h2 className="mt-1 text-lg font-black">Choose the {symbol} trading horizon</h2>
          <p className="text-[11px] leading-5 text-muted-foreground">
            The same market gets a different confirmation depth at each horizon. Strategy selection is tied to the active symbol.
          </p>
        </div>
        <Link to="/signals" className="text-[10px] font-bold text-primary hover:underline">
          View all signals →
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {MODES.map(({ tf, query, name, expiry, icon: Icon, suffix }) => {
          const strategy = strategyNames?.[name] ?? fallback;
          return (
            <Link
              key={tf}
              to={`/signals?timeframe=${query}&symbol=${encodeURIComponent(symbol)}`}
              className="group rounded-2xl border border-border/60 bg-card/70 p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <Badge variant="outline" className="text-[9px] font-black">{tf}</Badge>
              </div>
              <div className="mt-2 text-xs font-black tracking-wide">{name}</div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-primary">
                <Timer className="h-3 w-3" /> {expiry} expiry
              </div>
              <div className="mt-2 line-clamp-2 text-[10px] font-bold text-foreground">{strategy}</div>
              <p className="mt-1 text-[9px] leading-4 text-muted-foreground">{suffix}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
