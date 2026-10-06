import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDerivPublicWebSocketUrl } from "@/config/derivEnv";
import { ArrowRight, TrendingDown, TrendingUp, Activity } from "lucide-react";

const SYMBOLS: { symbol: string; label: string }[] = [
  { symbol: "R_10", label: "Volatility 10" },
  { symbol: "R_75", label: "Volatility 75" },
  { symbol: "R_100", label: "Volatility 100" },
  { symbol: "1HZ100V", label: "Volatility 100 (1s)" },
  { symbol: "BOOM1000", label: "Boom 1000" },
  { symbol: "CRASH1000", label: "Crash 1000" },
];

const MAX_POINTS = 60;

type Series = Record<string, number[]>;

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  const path = useMemo(() => {
    if (points.length < 2) return "";
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    return points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * 100;
        const y = 30 - ((p - min) / span) * 28 - 1;
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points]);

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-12 w-full" aria-hidden="true">
      <path
        d={path}
        fill="none"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        className={up ? "stroke-success" : "stroke-destructive"}
      />
    </svg>
  );
}

/** Live Deriv options movement + auto signal per symbol (public market data, no login). */
export const DerivOptionsHome = () => {
  const [series, setSeries] = useState<Series>({});
  const [live, setLive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let closed = false;
    let ws: WebSocket;
    try {
      ws = new WebSocket(getDerivPublicWebSocketUrl());
    } catch {
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      if (closed) return;
      setLive(true);
      SYMBOLS.forEach((s, i) =>
        ws.send(JSON.stringify({ ticks: s.symbol, subscribe: 1, req_id: 100 + i })),
      );
    };
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        const tick = data?.tick;
        if (!tick?.symbol || typeof tick.quote !== "number") return;
        setSeries((prev) => {
          const next = [...(prev[tick.symbol] ?? []), tick.quote];
          return { ...prev, [tick.symbol]: next.slice(-MAX_POINTS) };
        });
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onclose = () => setLive(false);
    ws.onerror = () => setLive(false);

    return () => {
      closed = true;
      setLive(false);
      try {
        ws.close();
      } catch {
        /* noop */
      }
    };
  }, []);

  return (
    <section aria-labelledby="deriv-options-home">
      <Card className="glass-card border-primary/30">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 id="deriv-options-home" className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Deriv Options — Live Movements
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Real-time synthetic price action with an automated Rise/Fall bias on each chart.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={live ? "default" : "secondary"} className="text-[10px]">
                {live ? "LIVE" : "CONNECTING…"}
              </Badge>
              <Link to="/options">
                <Button size="sm" className="gap-1 text-xs font-bold">
                  Trade Options <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {SYMBOLS.map(({ symbol, label }) => {
              const points = series[symbol] ?? [];
              const last = points[points.length - 1];
              const first = points[0];
              const changePct = first && last ? ((last - first) / first) * 100 : 0;
              const avg = points.length ? points.reduce((a, b) => a + b, 0) / points.length : 0;
              const up = points.length > 4 ? last >= avg : changePct >= 0;
              const strength = Math.min(99, Math.round(50 + Math.abs(changePct) * 400));

              return (
                <Link key={symbol} to={`/options?symbol=${symbol}`} className="block">
                  <div className="rounded-lg border border-border/60 bg-card/60 p-3 hover:border-primary/50 transition-colors h-full">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold truncate">{label}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] gap-1 ${up ? "text-success border-success/40" : "text-destructive border-destructive/40"}`}
                      >
                        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {up ? "RISE" : "FALL"}
                      </Badge>
                    </div>

                    <Sparkline points={points} up={up} />

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold">
                        {last !== undefined ? last.toFixed(3) : "—"}
                      </span>
                      <span className={up ? "text-success" : "text-destructive"}>
                        {changePct >= 0 ? "+" : ""}
                        {changePct.toFixed(3)}%
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      Signal bias {strength}% · {points.length} ticks
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground">
            Signal bias is a short-term momentum read from live ticks, not financial advice or a guaranteed outcome.
          </p>
        </CardContent>
      </Card>
    </section>
  );
};
