import { useEffect, useMemo, useRef, useState } from "react";
import { useDeriv } from "@/contexts/DerivContext";
import { runEngine, type EngineType, type SignalResult } from "@/lib/signalEngines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Radar, Timer, Gauge } from "lucide-react";

const ENGINES: { id: EngineType; label: string }[] = [
  { id: "momentum", label: "⭐ Momentum — Default" },
  { id: "momentum", label: "⭐ Momentum — Default" },
  { id: "higher_lower", label: "Barrier — Higher / Lower" },
  { id: "even_odd", label: "Digits — Even / Odd" },
  { id: "over_under", label: "Digits — Over / Under" },
  { id: "match_differ", label: "Digits — Match / Differ" },
];

const MARKETS = [
  { symbol: "R_10", displayName: "Volatility 10" },
  { symbol: "R_25", displayName: "Volatility 25" },
  { symbol: "R_50", displayName: "Volatility 50" },
  { symbol: "R_75", displayName: "Volatility 75" },
  { symbol: "R_100", displayName: "Volatility 100" },
  { symbol: "1HZ75V", displayName: "Vol 75 (1s)" },
  { symbol: "BOOM1000", displayName: "Boom 1000" },
  { symbol: "CRASH1000", displayName: "Crash 1000" },
  { symbol: "stpRNG", displayName: "Step Index" },
];

export const SignalEngineTab = () => {
  const { authorized, lastTick, subscribeTicks, unsubscribeTicks } = useDeriv();
  const [engine, setEngine] = useState<EngineType>("momentum");
  const [symbol, setSymbol] = useState("R_75");
  const [signal, setSignal] = useState<SignalResult | null>(null);
  const ticks = useRef<number[]>([]);
  const [tickCount, setTickCount] = useState(0);

  useEffect(() => {
    if (!authorized) return;
    ticks.current = [];
    setTickCount(0);
    setSignal(null);
    subscribeTicks(symbol).catch(() => {});
    return () => { unsubscribeTicks(symbol).catch(() => {}); };
  }, [authorized, symbol, subscribeTicks, unsubscribeTicks]);

  useEffect(() => {
    if (!lastTick?.quote) return;
    ticks.current = [...ticks.current, lastTick.quote].slice(-300);
    setTickCount(ticks.current.length);
    if (ticks.current.length >= 30) {
      try { setSignal(runEngine(engine, ticks.current)); } catch { /* warm-up */ }
    }
  }, [lastTick, engine]);

  const tone = useMemo(() => {
    const s = signal?.signal;
    if (!s || s === "WAIT") return "text-muted-foreground";
    if (["FALL", "DOWN", "LOWER", "UNDER"].includes(s)) return "text-destructive";
    return "text-success";
  }, [signal]);

  return (
    <div className="space-y-4">
      <Card className="glass-card border-primary/30">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between"><Label className="text-xs">Options Strategy</Label><Badge variant="outline" className="text-[10px]">Momentum default</Badge></div>
            <Select value={engine} onValueChange={(v) => setEngine(v as EngineType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {ENGINES.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Market</Label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {MARKETS.map((m) => <SelectItem key={m.symbol} value={m.symbol}>{m.displayName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" /> Live read
            <Badge variant="outline" className="ml-auto text-[10px]">{tickCount} ticks</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-2">
            <p className={cn("text-4xl font-black tracking-tight", tone)}>{signal?.signal ?? "WAIT"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Momentum reads live price movement, EMA structure, RSI and multi-window confirmation. {authorized ? `Streaming ${symbol}` : "Connect your Deriv account to stream live ticks"}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Gauge className="h-3 w-3" /> Confidence</span>
              <span className="font-semibold">{signal?.confidence ?? 0}%</span>
            </div>
            <Progress value={signal?.confidence ?? 0} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-muted-foreground flex items-center gap-1"><Timer className="h-3 w-3" /> Valid for</p>
              <p className="font-semibold mt-0.5">{signal?.validFor ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-muted-foreground">Timing</p>
              <p className="font-semibold mt-0.5">{signal?.timing ?? "—"}</p>
            </div>
          </div>

          {signal?.reasons?.length ? (
            <ul className="space-y-1">
              {signal.reasons.map((r, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-primary">•</span>{r}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};