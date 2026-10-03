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
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Crosshair,
  Radio,
  RefreshCw,
  Target,
} from "lucide-react";
import { TradingChart } from "@/components/chart/TradingChart";
import { useMarketFeed } from "@/hooks/useMarketFeed";
import { supabase } from "@/integrations/supabase/client";
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

  const { candles, price, lastTick, status, diagnostics } = useMarketFeed({
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

  // Save real-candle SyntX signals (and their WIN/LOSS results) to the Signals tab.
  useEffect(() => {
    if (!instrument.syntxFamily || candles.length < 50 || !signals.length) return;
    const recentSigs = signals.slice(-20).map((s) => ({
      symbol: instrument.mt5Symbol, timeframe: s.timeframe, direction: s.direction,
      strategy: s.strategy, strategyId: s.strategyId, confidence: s.confidence,
      entry: s.entry, stopLoss: s.stopLoss, takeProfit: s.takeProfit,
      time: s.time, result: s.result, reason: s.reason?.slice(0, 500), family: instrument.syntxFamily,
    }));
    const key = JSON.stringify(recentSigs.map((s) => [s.time, s.result]));
    const t = setTimeout(async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return;
      const cacheKey = `botvio.syntx.sync.${instrument.mt5Symbol}.${prefs.timeframe}`;
      if (sessionStorage.getItem(cacheKey) === key) return;
      const { data } = await supabase.functions.invoke("record-syntx-signals", { body: { signals: recentSigs } });
      if (data?.ok) sessionStorage.setItem(cacheKey, key);
    }, 3000);
    return () => clearTimeout(t);
  }, [signals, candles.length, instrument, prefs.timeframe]);

  const categoryInstruments = useMemo(
    () => WELTRADE_INSTRUMENTS.filter((i) => i.category === prefs.category),
    [prefs.category]
  );

  const selectInstrument = (inst: WeltradeInstrument) =>
    setPrefs((p) => ({ ...p, instrument: inst.key, category: inst.category }));

  const bridgeOffline = instrument.source === "weltrade-bridge" && (status === "unavailable" || status === "error");

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {WELTRADE_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={prefs.category === cat ? "secondary" : "outline"}
            className="h-7 px-3 text-xs font-bold"
            onClick={() =>
              setPrefs((p) => {
                if (p.category === cat) return p;
                const first = WELTRADE_INSTRUMENTS.find((i) => i.category === cat);
                return { ...p, category: cat, instrument: first?.key ?? p.instrument };
              })
            }
          >
            {WELTRADE_CATEGORY_LABEL[cat]}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Instrument selector */}
        <Card className="order-2 border-border/60 lg:order-1">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-wide text-muted-foreground">
              {WELTRADE_CATEGORY_LABEL[prefs.category]} · {categoryInstruments.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <ScrollArea className="h-[220px] lg:h-[420px]">
              <div className="space-y-1 pr-2">
                {categoryInstruments.map((inst) => {
                  const active = inst.key === instrument.key;
                  return (
                    <button
                      key={inst.key}
                      onClick={() => selectInstrument(inst)}
                      className={cn(
                        "w-full rounded-lg border p-2 text-left transition-colors",
                        active
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/40 hover:border-border hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-xs font-bold", active ? "text-primary" : "text-foreground")}>
                          {inst.label}
                        </span>
                        {inst.syntxFamily ? (
                          <Badge variant="outline" className="text-[9px] font-bold">
                            {getSyntxProfile(inst.syntxFamily)?.label}
                          </Badge>
                        ) : inst.bias !== "both" && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-bold",
                              inst.bias === "buy"
                                ? "border-success/40 text-success"
                                : "border-destructive/40 text-destructive"
                            )}
                          >
                            {inst.bias.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                        {inst.blurb}
                      </p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chart + signals */}
        <div className="order-1 min-w-0 space-y-4 lg:order-2">
          {familyProfile && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-black text-foreground">{familyProfile.label}</p>
                    {familyProfile.badges.map((badge) => <Badge key={badge} variant="outline" className="text-[9px]">{badge}</Badge>)}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">How this index behaves:</strong> {familyProfile.behaviour}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Observed chart state:</strong> {familyState?.label ?? "Data unavailable"}. {familyState?.detail}</p>
                </div>
                <div>
                  <label htmlFor="syntx-strategy-mode" className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Strategy mode</label>
                  <Select value={strategyMode} onValueChange={(value) => setStrategyMode(value as SyntxStrategyMode)}>
                    <SelectTrigger id="syntx-strategy-mode" className="min-h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{familyProfile.modes.map((mode) => <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
          <TradingChart
            candles={candles}
            indicators={indicators}
            status={status}
            sourceLabel={diagnostics.sourceLabel}
            brokerLabel="WELTRADE"
            symbolLabel={`${instrument.label} (${instrument.mt5Symbol})`}
            timeframe={prefs.timeframe}
            onTimeframeChange={(tf) => setPrefs((p) => ({ ...p, timeframe: tf }))}
            price={price}
            bid={lastTick?.bid ?? null}
            ask={lastTick?.ask ?? null}
            decimals={instrument.decimals}
            signals={signals}
            activeSignal={activeSignal}
            focusSignal={focusSignal}
            unavailableMessage={
              bridgeOffline ? "Weltrade market data unavailable" : "Market data unavailable"
            }
            errorDetail={
              bridgeOffline
                ? diagnostics.lastError ??
                  `${instrument.label} is a proprietary Weltrade index. Its live prices come from your own MT5 terminal via the BOTVIO Bridge EA — start the EA to stream this chart. No prices are ever simulated.`
                : diagnostics.lastError
            }
          />

          {instrument.referenceFeed && (
            <p className="flex items-start gap-1.5 rounded-lg border border-border/40 bg-muted/30 p-2 text-[10px] leading-relaxed text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
              <span>
                <strong className="text-foreground">Reference feed:</strong> {instrument.label} candles stream from a
                public market feed for the same underlying market. Trade on Weltrade ticker{" "}
                <span className="font-mono text-foreground">{instrument.mt5Symbol}</span> — your broker's spread and
                exact quotes may differ slightly.
              </span>
            </p>
          )}

          {/* Signal engine panel */}
          <Card className="border-border/60">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 p-3 pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-black">
                <Crosshair className="h-4 w-4 text-primary" /> Weltrade Signals Engine
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] font-bold">
                  {stats.total} signals
                </Badge>
                <Badge variant="outline" className="border-success/40 text-[10px] font-bold text-success">
                  {stats.wins}W
                </Badge>
                <Badge variant="outline" className="border-destructive/40 text-[10px] font-bold text-destructive">
                  {stats.losses}L
                </Badge>
                {stats.winRate != null && (
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {stats.winRate.toFixed(0)}% hit rate
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                 {familyProfile ? `${familyProfile.label} signals use only its compatible ${strategyMode} framework. ` : "Signals use the standard market framework. "}
                 Signals are computed from the exact candles shown above ({prefs.timeframe},{" "}
                {diagnostics.candleCount} bars) and anchored to the candle that triggered them. Outcomes are resolved by
                walking forward through the same dataset — this is historical performance on this timeframe, not a
                predicted or guaranteed win rate.
              </p>

              {candles.length === 0 ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : recent.length === 0 ? (
                <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-center">
                  <Radio className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" />
                  <p className="text-xs font-bold text-foreground">No valid setup right now</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                     {familyProfile?.modes[0]?.value === "progression"
                       ? "This family needs tick-level progression evidence. Data unavailable means Botvio will not invent a setup."
                       : "The selected family-compatible framework has not confirmed a setup. Try another timeframe or instrument."}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[260px]">
                  <div className="space-y-2 pr-2">
                    {recent.map((s) => {
                      const isBuy = s.direction === "BUY";
                      return (
                        <button
                          key={s.id}
                          onClick={() => setFocusSignal(s)}
                          className={cn(
                            "w-full rounded-lg border p-2.5 text-left transition-colors",
                            focusSignal?.id === s.id
                              ? "border-primary/60 bg-primary/5"
                              : "border-border/40 hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "flex items-center gap-1 text-xs font-black",
                                isBuy ? "text-success" : "text-destructive"
                              )}
                            >
                              {isBuy ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                              {s.direction} {instrument.mt5Symbol}
                            </span>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[9px] font-bold">
                                {s.confidence}%
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] font-bold",
                                  s.result === "WIN"
                                    ? "border-success/40 text-success"
                                    : s.result === "LOSS"
                                      ? "border-destructive/40 text-destructive"
                                      : "border-warning/40 text-warning"
                                )}
                              >
                                {s.result === "WIN" ? (
                                  <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                                ) : s.result === "OPEN" ? (
                                  <Activity className="mr-0.5 h-2.5 w-2.5" />
                                ) : null}
                                {s.result}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-1 grid grid-cols-3 gap-1 font-mono text-[10px]">
                            <span className="text-muted-foreground">
                              Entry <span className="text-foreground">{s.entry.toFixed(instrument.decimals)}</span>
                            </span>
                            <span className="text-muted-foreground">
                              SL <span className="text-destructive">{s.stopLoss.toFixed(instrument.decimals)}</span>
                            </span>
                            <span className="text-muted-foreground">
                              TP <span className="text-success">{s.takeProfit.toFixed(instrument.decimals)}</span>
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                            <Target className="mr-1 inline h-2.5 w-2.5" />
                            {s.reason}
                          </p>
                          <p className="mt-0.5 text-[9px] text-muted-foreground">
                            {new Date(s.time * 1000).toLocaleString()} · tap to locate on chart
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Feed diagnostics */}
          <Card className="border-border/60">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" /> Feed Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 p-3 pt-0 sm:grid-cols-3 lg:grid-cols-4">
              {([
                ["Source", diagnostics.sourceLabel],
                ["Feed symbol", diagnostics.feedSymbol],
                ["MT5 ticker", instrument.mt5Symbol],
                ["Timeframe", diagnostics.timeframe],
                ["Status", diagnostics.status],
                ["Transport", diagnostics.wsState],
                ["API", diagnostics.apiStatus],
                ["Candles", String(diagnostics.candleCount)],
                [
                  "Last tick",
                  diagnostics.lastTickAt ? new Date(diagnostics.lastTickAt).toLocaleTimeString() : "—",
                ],
                [
                  "Last candle",
                  diagnostics.lastCandleAt ? new Date(diagnostics.lastCandleAt).toLocaleTimeString() : "—",
                ],
                ["Reconnects", String(diagnostics.reconnects)],
                ["Price", price != null ? price.toFixed(instrument.decimals) : "—"],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border/40 bg-muted/20 p-2">
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="truncate font-mono text-[11px] font-bold text-foreground">{value}</p>
                </div>
              ))}
              {diagnostics.lastError && (
                <div className="col-span-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 sm:col-span-3 lg:col-span-4">
                  <p className="text-[9px] uppercase tracking-wide text-destructive">Last error</p>
                  <p className="text-[11px] leading-relaxed text-foreground">{diagnostics.lastError}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};