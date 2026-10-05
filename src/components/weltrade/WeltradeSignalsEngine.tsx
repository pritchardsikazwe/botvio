import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  Cpu,
  Loader2,
  Pause,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Crosshair,
  Radio,
  RefreshCw,
  Target,
} from "lucide-react";
import { BrokerCandleChart } from "@/components/chart/BrokerCandleChart";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { useMarketFeed } from "@/hooks/useMarketFeed";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { computeIndicators } from "@/lib/marketData/indicators";
import { computeSignals, summarizeSignals, type EngineSignal } from "@/lib/marketData/signalEngine";
import { getSyntxProfile, type SyntxStrategyMode } from "@/lib/marketData/syntxStrategy";
import { computeSyntxSignalsV2, getSyntxStateV2 } from "@/lib/marketData/syntxSignalEngineV2";
import type { Timeframe } from "@/lib/marketData/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  WELTRADE_CATEGORIES,
  WELTRADE_CATEGORY_LABEL,
  WELTRADE_INSTRUMENTS,
  type WeltradeCategory,
  type WeltradeInstrument,
} from "@/config/weltradeInstruments";

const STORAGE_KEY = "botvio.weltrade.chart.prefs";

interface Prefs {
  instrument: string;
  timeframe: Timeframe;
  category: WeltradeCategory;
}

function loadPrefs(): Prefs {
  const fallback: Prefs = { instrument: "gainx-400", timeframe: "5m", category: "syntx" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    const inst = WELTRADE_INSTRUMENTS.find((i) => i.key === parsed.instrument);
    if (!inst) return fallback;
    return {
      instrument: inst.key,
      timeframe: (parsed.timeframe as Timeframe) ?? "5m",
      category: inst.category,
    };
  } catch {
    return fallback;
  }
}

export const WeltradeSignalsEngine = () => {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [focusSignal, setFocusSignal] = useState<EngineSignal | null>(null);
  const [strategyMode, setStrategyMode] = useState<SyntxStrategyMode>("trend");

  const instrument = useMemo<WeltradeInstrument>(
    () => WELTRADE_INSTRUMENTS.find((i) => i.key === prefs.instrument) ?? WELTRADE_INSTRUMENTS[0],
    [prefs.instrument]
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch { /* storage unavailable — non-fatal */ }
  }, [prefs]);

  const { user, loading: authLoading } = useAuth() as any;
  const [authOpen, setAuthOpen] = useState(false);
  const [busyTrade, setBusyTrade] = useState<"weltrade" | "mt5" | null>(null);
  const needsSignIn = instrument.source === "weltrade-api-studio" && !user;
  const { candles, price, lastTick, status, diagnostics } = useMarketFeed({
    enabled: !(instrument.source === "weltrade-api-studio" && (authLoading || !user)),
    source: instrument.source,
    feedSymbol: instrument.feedSymbol,
    timeframe: prefs.timeframe,
    historyLimit: 400,
  });

  // One indicator pass shared by the chart, the signal engine and the stats.
  const indicators = useMemo(() => computeIndicators(candles), [candles]);
  const signals = useMemo(
    () => {
      const options =
        {
          symbol: instrument.mt5Symbol,
          label: instrument.label,
          timeframe: prefs.timeframe,
          minConfidence: 65,
        };
      return instrument.syntxFamily
        ? computeSyntxSignalsV2(candles, { ...options, family: instrument.syntxFamily, mode: strategyMode }, indicators)
        : computeSignals(
        candles,
        options,
        indicators
      );
    },
    [candles, indicators, instrument, prefs.timeframe, strategyMode]
  );

  const familyProfile = useMemo(() => getSyntxProfile(instrument.syntxFamily), [instrument.syntxFamily]);
  const familyState = useMemo(
    () => instrument.syntxFamily ? getSyntxStateV2(candles, instrument.syntxFamily, indicators) : null,
    [candles, indicators, instrument.syntxFamily]
  );

  useEffect(() => {
    if (familyProfile && !familyProfile.modes.some((mode) => mode.value === strategyMode)) {
      setStrategyMode(familyProfile.modes[0].value);
    }
  }, [familyProfile, strategyMode]);

  const recent = useMemo(() => [...signals].reverse(), [signals]);
  const activeSignal = useMemo(
    () => recent.find((s) => s.result === "OPEN") ?? recent[0] ?? null,
    [recent]
  );
  const stats = useMemo(() => summarizeSignals(signals), [signals]);

  // Publish confirmed Weltrade signals from the real broker feed into the
  // central trading_signals table so Home, Signals and downstream routing see
  // the same signal. This is intentionally broker-wide, not SyntX-only.
  useEffect(() => {
    if (candles.length < 50 || !signals.length) return;

    const recentSigs = signals.slice(-20).map((s) => ({
      symbol: instrument.mt5Symbol,
      timeframe: s.timeframe,
      direction: s.direction,
      strategy: s.strategy,
      strategyId: s.strategyId,
      confidence: s.confidence,
      entry: s.entry,
      stopLoss: s.stopLoss,
      takeProfit: s.takeProfit,
      time: s.time,
      result: s.result,
      reason: s.reason?.slice(0, 500),
      family: instrument.syntxFamily,
      category: instrument.category,
      instrumentLabel: instrument.label,
    }));

    const key = JSON.stringify(recentSigs.map((s) => [s.time, s.result, s.direction]));
    const t = setTimeout(async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return;

      const cacheKey = `botvio.weltrade.sync.${instrument.mt5Symbol}.${prefs.timeframe}`;
      if (sessionStorage.getItem(cacheKey) === key) return;

      const { data, error } = await supabase.functions.invoke("record-weltrade-signals", {
        body: { signals: recentSigs },
      });

      if (error) {
        console.error("Weltrade signal publish failed:", error);
        return;
      }
      if (data?.ok) sessionStorage.setItem(cacheKey, key);
    }, 1500);

    return () => clearTimeout(t);
  }, [signals, candles.length, instrument, prefs.timeframe]);

  const categoryInstruments = useMemo(
    () => WELTRADE_INSTRUMENTS.filter((i) => i.category === prefs.category),
    [prefs.category]
  );

  const selectInstrument = (inst: WeltradeInstrument) =>
    setPrefs((p) => ({ ...p, instrument: inst.key, category: inst.category }));

  const bridgeOffline = instrument.source === "weltrade-bridge" && (status === "unavailable" || status === "error");

  const queueTrade = async (direction: "BUY" | "SELL", route: "weltrade" | "mt5") => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setBusyTrade(route);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("No active session");
      const url = "https://" + import.meta.env.VITE_SUPABASE_PROJECT_ID + ".supabase.co/functions/v1/queue-hub-trade";
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + accessToken },
        body: JSON.stringify({
          symbol: instrument.mt5Symbol,
          direction,
          source: route === "weltrade" ? "weltrade-" + instrument.category : "weltrade-mt5",
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error ?? "MT5 queue failed");
      toast({
        title: route === "weltrade" ? "Weltrade " + direction + " queued" : "MT5 " + direction + " queued",
        description: instrument.mt5Symbol + " • Volume " + (json.volume ?? "auto") + " • Terminal " + (json.terminal_uid?.slice?.(0, 8) ?? "connected") + "…",
      });
    } catch (e: any) {
      toast({
        title: route === "weltrade" ? "Weltrade trade failed" : "MT5 trade failed",
        description: e?.message ?? "Connect your Weltrade Bridge EA terminal under Connections.",
        variant: "destructive",
      });
    } finally {
      setBusyTrade(null);
    }
  };

  const signalDirection: "BUY" | "SELL" | null =
    activeSignal?.direction === "BUY" || activeSignal?.direction === "SELL" ? activeSignal.direction : null;
  const signalTone = signalDirection === "BUY"
    ? { text: "text-success", border: "border-success/50", bg: "from-success/15 via-success/5 to-transparent", Icon: ArrowUpRight }
    : signalDirection === "SELL"
      ? { text: "text-destructive", border: "border-destructive/50", bg: "from-destructive/15 via-destructive/5 to-transparent", Icon: ArrowDownRight }
      : { text: "text-warning", border: "border-warning/50", bg: "from-warning/15 via-warning/5 to-transparent", Icon: Pause };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card/70 p-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {WELTRADE_CATEGORIES.map((cat) => (
            <Button key={cat} size="sm" variant={prefs.category === cat ? "secondary" : "ghost"} className="h-7 px-3 text-[10px] font-bold"
              onClick={() => {
                const first = WELTRADE_INSTRUMENTS.find((i) => i.category === cat);
                setPrefs((p) => ({ ...p, category: cat, instrument: first?.key ?? p.instrument }));
              }}>
              {WELTRADE_CATEGORY_LABEL[cat]}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 lg:min-w-[300px]">
          <Badge variant="outline" className="shrink-0 text-[9px] border-success/30 text-success">
            <Activity className="mr-1 h-2.5 w-2.5" /> {status === "live" ? "LIVE" : status.toUpperCase()}
          </Badge>
          <Select value={instrument.key} onValueChange={(value) => {
            const next = WELTRADE_INSTRUMENTS.find((i) => i.key === value);
            if (next) selectInstrument(next);
          }}>
            <SelectTrigger className="h-8 text-xs font-bold"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categoryInstruments.map((inst) => <SelectItem key={inst.key} value={inst.key}>{inst.label} · {inst.mt5Symbol}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {needsSignIn && !authLoading && (
        <div className="flex flex-col items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 sm:flex-row">
          <p className="text-xs text-foreground">Sign in to see live Weltrade prices, charts and signals from your connected Weltrade feed.</p>
          <Button size="sm" onClick={() => setAuthOpen(true)}>Sign in</Button>
          <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[250px_minmax(0,1fr)]">
        <Card className={cn("relative overflow-hidden border-2 bg-gradient-to-br", signalTone.border, signalTone.bg)}>
          <CardContent className="space-y-3 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <Crosshair className="h-3.5 w-3.5 text-primary" /> BOTVIO AI SIGNAL
                </div>
                <h2 className="mt-0.5 truncate text-sm font-black text-foreground">{instrument.label}</h2>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-muted-foreground">{instrument.blurb}</p>
              </div>
              <Badge variant="outline" className={cn("shrink-0 text-[9px] font-bold", signalTone.border, signalTone.text)}>
                <Activity className="mr-1 h-2.5 w-2.5" /> {status === "live" ? "LIVE" : status.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
              <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-background/40", signalTone.border)}>
                <signalTone.Icon className={cn("h-6 w-6", signalTone.text)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className={cn("text-xl font-black tracking-tight", signalTone.text)}>{signalDirection ?? "WAIT"}</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: (activeSignal?.confidence ?? 0) + "%" }} />
                  </div>
                  <span className="text-[10px] font-bold">{activeSignal?.confidence ?? 0}%</span>
                </div>
                {price != null && <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">Last: {price.toFixed(instrument.decimals)}</div>}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border/40 bg-background/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">BOTVIO SCALPING ENGINE</span>
                <Badge variant="outline" className="text-[9px]">{prefs.timeframe}</Badge>
              </div>
              <p className="line-clamp-3 text-[10px] leading-relaxed text-muted-foreground">
                {activeSignal?.reason ?? (familyState?.detail ?? "Connecting to live market data and waiting for a confirmed setup.")}
              </p>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div><div className="text-[8px] text-muted-foreground">Signals</div><div className="text-[11px] font-bold">{stats.total}</div></div>
                <div><div className="text-[8px] text-muted-foreground">Wins</div><div className="text-[11px] font-bold text-success">{stats.wins}</div></div>
                <div><div className="text-[8px] text-muted-foreground">Losses</div><div className="text-[11px] font-bold text-destructive">{stats.losses}</div></div>
                <div><div className="text-[8px] text-muted-foreground">Hit rate</div><div className="text-[11px] font-bold">{stats.winRate == null ? "—" : stats.winRate.toFixed(0) + "%"}</div></div>
              </div>
            </div>

            {activeSignal && (
              <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[9px]">
                <div className="rounded-md bg-muted/50 p-1.5"><div className="text-muted-foreground">Entry</div><div className="font-bold">{activeSignal.entry.toFixed(instrument.decimals)}</div></div>
                <div className="rounded-md bg-destructive/5 p-1.5"><div className="text-destructive">SL</div><div className="font-bold">{activeSignal.stopLoss.toFixed(instrument.decimals)}</div></div>
                <div className="rounded-md bg-success/5 p-1.5"><div className="text-success">TP</div><div className="font-bold">{activeSignal.takeProfit.toFixed(instrument.decimals)}</div></div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" disabled={busyTrade !== null || !signalDirection} onClick={() => signalDirection && queueTrade(signalDirection, "weltrade")} className="h-8 text-[10px] font-black">
                {busyTrade === "weltrade" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Zap className="mr-1 h-3 w-3" />} Trade on Weltrade
              </Button>
              <Button size="sm" variant="outline" disabled={busyTrade !== null || !signalDirection} onClick={() => signalDirection && queueTrade(signalDirection, "mt5")} className="h-8 border-primary/40 text-[10px] font-black">
                {busyTrade === "mt5" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Cpu className="mr-1 h-3 w-3" />} Send to MT5
              </Button>
            </div>

            {!signalDirection && (
              <div className="border-t border-border/30 pt-2">
                <span className="text-[9px] text-muted-foreground">Manual:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(instrument.bias === "buy" || instrument.bias === "both") && (
                    <>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[9px] text-success" onClick={() => queueTrade("BUY", "weltrade")}>BUY · Weltrade</Button>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[9px] text-success" onClick={() => queueTrade("BUY", "mt5")}>BUY · MT5</Button>
                    </>
                  )}
                  {(instrument.bias === "sell" || instrument.bias === "both") && (
                    <>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[9px] text-destructive" onClick={() => queueTrade("SELL", "weltrade")}>SELL · Weltrade</Button>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[9px] text-destructive" onClick={() => queueTrade("SELL", "mt5")}>SELL · MT5</Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="min-w-0">
          <BrokerCandleChart
            candles={candles}
            indicators={indicators}
            status={status}
            sourceLabel={diagnostics.sourceLabel}
            brokerLabel="WELTRADE"
            symbolLabel={instrument.label + " (" + instrument.mt5Symbol + ")"}
            timeframe={prefs.timeframe}
            onTimeframeChange={(tf) => setPrefs((p) => ({ ...p, timeframe: tf }))}
            price={price}
            bid={lastTick?.bid ?? null}
            ask={lastTick?.ask ?? null}
            decimals={instrument.decimals}
            signals={signals}
            activeSignal={activeSignal}
            showHauza
            unavailableMessage={bridgeOffline ? "Weltrade market data unavailable" : "Market data unavailable"}
          />
        </div>
      </div>

      {familyProfile && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-black text-foreground">{familyProfile.label}</p>
                {familyProfile.badges.map((badge) => <Badge key={badge} variant="outline" className="text-[9px]">{badge}</Badge>)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground"><strong className="text-foreground">Observed state:</strong> {familyState?.label ?? "Data unavailable"} · {familyState?.detail}</p>
            </div>
            <div>
              <label htmlFor="weltrade-strategy-mode" className="mb-1 block text-[9px] font-bold uppercase text-muted-foreground">Strategy mode</label>
              <Select value={strategyMode} onValueChange={(value) => setStrategyMode(value as SyntxStrategyMode)}>
                <SelectTrigger id="weltrade-strategy-mode" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{familyProfile.modes.map((mode) => <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {instrument.referenceFeed && (
        <p className="flex items-start gap-1.5 rounded-lg border border-warning/30 bg-warning/5 p-2.5 text-[10px] leading-relaxed text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
          <span><strong className="text-foreground">Reference feed:</strong> {instrument.label} candles come from the same underlying market via a public reference feed. Weltrade execution uses <span className="font-mono text-foreground">{instrument.mt5Symbol}</span>; broker spread and exact quotes can differ.</span>
        </p>
      )}

      <Card className="border-border/60">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 p-3 pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm font-black"><Crosshair className="h-4 w-4 text-primary" /> Weltrade Signal History</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px]">{stats.total} signals</Badge>
            <Badge variant="outline" className="border-success/40 text-[10px] text-success">{stats.wins}W</Badge>
            <Badge variant="outline" className="border-destructive/40 text-[10px] text-destructive">{stats.losses}L</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {candles.length === 0 ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : recent.length === 0 ? (
            <div className="rounded-lg border border-border/40 bg-muted/20 p-5 text-center">
              <Radio className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground">No confirmed setup right now</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Botvio will not invent a signal when the selected Weltrade feed has not confirmed one.</p>
            </div>
          ) : (
            <ScrollArea className="h-[240px]">
              <div className="space-y-2 pr-2">
                {recent.map((s) => {
                  const isBuy = s.direction === "BUY";
                  return (
                    <button key={s.id} onClick={() => setFocusSignal(s)} className={cn("w-full rounded-lg border p-2.5 text-left transition-colors", focusSignal?.id === s.id ? "border-primary/60 bg-primary/5" : "border-border/40 hover:bg-muted/30")}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("flex items-center gap-1 text-xs font-black", isBuy ? "text-success" : "text-destructive")}>
                          {isBuy ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          {s.direction} {instrument.mt5Symbol}
                        </span>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[9px]">{s.confidence}%</Badge>
                          <Badge variant="outline" className={cn("text-[9px]", s.result === "WIN" ? "border-success/40 text-success" : s.result === "LOSS" ? "border-destructive/40 text-destructive" : "border-warning/40 text-warning")}>{s.result}</Badge>
                        </div>
                      </div>
                      <div className="mt-1 grid grid-cols-3 gap-1 font-mono text-[10px]">
                        <span className="text-muted-foreground">Entry <span className="text-foreground">{s.entry.toFixed(instrument.decimals)}</span></span>
                        <span className="text-muted-foreground">SL <span className="text-destructive">{s.stopLoss.toFixed(instrument.decimals)}</span></span>
                        <span className="text-muted-foreground">TP <span className="text-success">{s.takeProfit.toFixed(instrument.decimals)}</span></span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground"><Target className="mr-1 inline h-2.5 w-2.5" />{s.reason}</p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="p-3 pb-2"><CardTitle className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-muted-foreground"><RefreshCw className="h-3.5 w-3.5" /> Feed Diagnostics</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 p-3 pt-0 sm:grid-cols-3 lg:grid-cols-4">
          {([
            ["Source", diagnostics.sourceLabel], ["Feed symbol", diagnostics.feedSymbol], ["MT5 ticker", instrument.mt5Symbol],
            ["Timeframe", diagnostics.timeframe], ["Status", diagnostics.status], ["Transport", diagnostics.wsState],
            ["API", diagnostics.apiStatus], ["Candles", String(diagnostics.candleCount)],
            ["Last tick", diagnostics.lastTickAt ? new Date(diagnostics.lastTickAt).toLocaleTimeString() : "—"],
            ["Last candle", diagnostics.lastCandleAt ? new Date(diagnostics.lastCandleAt).toLocaleTimeString() : "—"],
            ["Reconnects", String(diagnostics.reconnects)], ["Price", price != null ? price.toFixed(instrument.decimals) : "—"],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border/40 bg-muted/20 p-2">
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="truncate font-mono text-[11px] font-bold text-foreground">{value}</p>
            </div>
          ))}
          {diagnostics.lastError && <div className="col-span-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 sm:col-span-3 lg:col-span-4"><p className="text-[9px] uppercase tracking-wide text-destructive">Last error</p><p className="text-[11px] leading-relaxed text-foreground">{diagnostics.lastError}</p></div>}
        </CardContent>
      </Card>
    </div>
  );

};