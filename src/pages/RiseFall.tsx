import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { useDeriv } from "@/contexts/DerivContext";
import { getStyleById } from "@/config/tradingStyles";
import { rsi, riseFallEngine, type SignalResult } from "@/lib/signalEngines";
import { TickChart } from "@/components/deriv-app/TickChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DerivConnectionBar } from "@/components/trading/DerivConnectionBar";
import { TradingNav } from "@/components/trading/TradingNav";
import { StrategyCards } from "@/components/trading/StrategyCards";
import { AssetSelector } from "@/components/trading/AssetSelector";
import { TradeExecutionStatus, type TradeFeedback } from "@/components/trading/TradeExecutionStatus";
import { useDerivSymbols } from "@/hooks/useDerivSymbols";
import { friendlyTradeError, validateTradeRequest } from "@/services/deriv/derivValidation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Activity, Bot, Gauge, Loader2, Settings2, Sparkles, TrendingDown, TrendingUp, Wallet } from "lucide-react";

type Dir = "RISE" | "FALL" | "NEUTRAL";

/** Deriv contract types behind the Rise/Fall ticket. */
const RISE_FALL_CONTRACTS = ["CALL", "PUT"];

interface LogRow { id: number; time: string; message: string; tone: "info" | "success" | "error" }

export default function RiseFall() {
  const {
    authorized, isDerivConnected, balance, lastTick, subscribeTicks, unsubscribeTicks,
    placeTrade, subscribeContract, accountInfo,
  } = useDeriv();

  const style = getStyleById("rise-fall-scalping");
  const instruments = useMemo(() => style?.instruments ?? [], [style]);

  // Live Deriv availability for every candidate asset (CALL/PUT = Rise/Fall)
  const {
    assets, loading: assetsLoading, refresh: refreshAssets, getAsset,
  } = useDerivSymbols(instruments, RISE_FALL_CONTRACTS);

  const [symbol, setSymbol] = useState("1HZ100V");
  const [stake, setStake] = useState("1");
  const [duration, setDuration] = useState("5");
  const [busy, setBusy] = useState(false);

  // RSI settings
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [overbought, setOverbought] = useState(70);
  const [oversold, setOversold] = useState(30);
  const [minConfidence, setMinConfidence] = useState(65);

  // Bot
  const [botOn, setBotOn] = useState(false);
  const [mode, setMode] = useState<"signals" | "auto">("signals");
  const [maxTrades, setMaxTrades] = useState(10);
  const [botTrades, setBotTrades] = useState(0);
  const [feedback, setFeedback] = useState<TradeFeedback>({ phase: "idle" });

  const [rsiValue, setRsiValue] = useState<number | null>(null);
  const [engineSignal, setEngineSignal] = useState<SignalResult | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [ticks, setTicks] = useState<number[]>([]);
  const ticksRef = useRef<number[]>([]);
  const logId = useRef(0);
  const botBusy = useRef(false);
  const lastBotAt = useRef(0);

  const asset = getAsset(symbol);
  const symbolLabel = asset?.displayName ?? instruments.find((i) => i.symbol === symbol)?.displayName ?? symbol;
  const assetBlocked = asset?.status === "unavailable";

  const addLog = useCallback((message: string, tone: LogRow["tone"] = "info") => {
    logId.current += 1;
    setLogs((p) => [{ id: logId.current, time: new Date().toLocaleTimeString(), message, tone }, ...p].slice(0, 30));
  }, []);

  // Never leave the user on an asset Deriv has just closed or suspended.
  useEffect(() => {
    if (!assetBlocked) return;
    const fallback = assets.find((a) => a.status === "available");
    if (fallback && fallback.symbol !== symbol) {
      setSymbol(fallback.symbol);
      addLog(`${asset?.displayName ?? symbol} is unavailable — switched to ${fallback.displayName}`, "info");
    }
  }, [assetBlocked, assets, symbol, asset, addLog]);

  // Live ticks
  useEffect(() => {
    if (!authorized || !symbol) return;
    ticksRef.current = [];
    setTicks([]);
    setRsiValue(null);
    setEngineSignal(null);
    subscribeTicks(symbol).catch(() => addLog(`Could not stream ${symbol}`, "error"));
    return () => { unsubscribeTicks(symbol).catch(() => {}); };
  }, [authorized, symbol, subscribeTicks, unsubscribeTicks, addLog]);

  useEffect(() => {
    if (lastTick?.quote == null) return;
    ticksRef.current = [...ticksRef.current, lastTick.quote].slice(-300);
    setTicks(ticksRef.current);
    if (ticksRef.current.length >= rsiPeriod + 1) {
      try { setRsiValue(rsi(ticksRef.current, rsiPeriod)); } catch { /* warm-up */ }
    }
    if (ticksRef.current.length >= 30) {
      try { setEngineSignal(riseFallEngine(ticksRef.current)); } catch { /* warm-up */ }
    }
  }, [lastTick, rsiPeriod]);

  // RSI-driven signal, blended with the Botvio rise/fall engine
  const signal = useMemo<{ direction: Dir; confidence: number; reason: string }>(() => {
    if (rsiValue == null) return { direction: "NEUTRAL", confidence: 0, reason: "Collecting ticks…" };
    let direction: Dir = "NEUTRAL";
    let confidence = 0;
    let reason = `RSI ${rsiValue.toFixed(1)} is neutral — waiting for a stretch`;

    if (rsiValue <= oversold) {
      direction = "RISE";
      confidence = Math.min(95, 55 + Math.round((oversold - rsiValue) * 2));
      reason = `RSI ${rsiValue.toFixed(1)} oversold (≤ ${oversold}) — mean-reversion RISE`;
    } else if (rsiValue >= overbought) {
      direction = "FALL";
      confidence = Math.min(95, 55 + Math.round((rsiValue - overbought) * 2));
      reason = `RSI ${rsiValue.toFixed(1)} overbought (≥ ${overbought}) — mean-reversion FALL`;
    }

    const eng = engineSignal?.signal;
    if (direction !== "NEUTRAL" && (eng === "RISE" || eng === "FALL")) {
      if (eng === direction) {
        confidence = Math.min(97, confidence + 10);
        reason += " · confirmed by Botvio momentum engine";
      } else {
        confidence = Math.max(0, confidence - 20);
        reason += " · momentum engine disagrees";
      }
    }
    return { direction, confidence, reason };
  }, [rsiValue, overbought, oversold, engineSignal]);

  const handleBuy = useCallback(async (contract: "CALL" | "PUT", label: string, viaBot = false) => {
    const amount = Number(stake);
    setBusy(true);
    setFeedback({ phase: "validating", message: `Checking ${label} on ${symbolLabel}…` });

    const check = await validateTradeRequest({
      connected: isDerivConnected,
      authorized,
      symbol,
      displayName: symbolLabel,
      contractType: contract,
      stake: amount,
      duration: Number(duration),
      durationUnit: "t",
      balance: balance?.balance ?? null,
    });

    if (!check.ok) {
      const recovery =
        check.step === "connection" || check.step === "authorization"
          ? "connection"
          : check.step === "contract_type" || check.step === "trading_availability" || check.step === "symbol"
            ? "asset"
            : "retry";
      setFeedback({ phase: "error", message: check.message, technical: check.technical, recovery });
      addLog(check.message ?? "Trade blocked", "error");
      toast.error(check.message);
      setBusy(false);
      return;
    }

    setFeedback({ phase: "submitting", message: `Placing ${label} on ${symbolLabel}…` });
    addLog(`${viaBot ? "🤖 Bot " : ""}Placing ${label} on ${symbolLabel} · $${amount.toFixed(2)} · ${duration}t`);
    try {
      const result = await placeTrade({
        symbol,
        contract_type: contract,
        amount,
        duration: Number(duration),
        duration_unit: "t",
      });
      await subscribeContract(result.contract_id);
      setFeedback({
        phase: "open",
        message: `${label} is running on ${symbolLabel}.`,
        contract: {
          contractId: result.contract_id,
          symbol: symbolLabel,
          contractType: contract,
          stake: Number(result.buy_price ?? amount),
          payout: Number(result.payout ?? 0),
          currency: balance?.currency,
        },
      });
      addLog(`${label} filled — #${result.contract_id} @ $${result.buy_price}`, "success");
      toast.success(`${label} placed on ${symbolLabel}`);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Trade failed";
      const message = friendlyTradeError(raw, symbolLabel);
      setFeedback({
        phase: "error",
        message,
        technical: raw,
        recovery: /unavailable|contract type/i.test(message) ? "asset" : "retry",
      });
      addLog(message, "error");
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }, [isDerivConnected, authorized, stake, symbol, symbolLabel, duration, balance, placeTrade, subscribeContract, addLog]);

  // Auto bot — picks signals from the RSI engine
  useEffect(() => {
    if (!botOn || !isDerivConnected) return;
    if (signal.direction === "NEUTRAL" || signal.confidence < minConfidence) return;
    if (botTrades >= maxTrades) return;
    if (botBusy.current) return;
    if (Date.now() - lastBotAt.current < 15000) return;

    botBusy.current = true;
    lastBotAt.current = Date.now();
    setBotTrades((n) => n + 1);
    const dir = signal.direction === "RISE" ? "CALL" : "PUT";
    handleBuy(dir, signal.direction, true).finally(() => { botBusy.current = false; });
  }, [botOn, isDerivConnected, signal, minConfidence, botTrades, maxTrades, handleBuy]);

  useEffect(() => {
    if (botOn && botTrades >= maxTrades) {
      setBotOn(false);
      addLog(`Bot stopped — session limit of ${maxTrades} trades reached`, "info");
    }
  }, [botOn, botTrades, maxTrades, addLog]);

  const change = ticks.length > 1 ? ticks[ticks.length - 1] - ticks[0] : 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Deriv Rise/Fall Trading — Live Tick Chart & RSI Signal Bot"
        description="Trade Deriv Rise/Fall with a real-time tick chart, configurable RSI settings, a live RSI signal engine and an auto bot that picks and executes signals for you."
      />
      <Header />

      <main className="container mx-auto max-w-3xl px-3 py-4 space-y-4">
        <DerivConnectionBar />
        <TradingNav />

        {/* Account bar */}
        <Card className="glass-card">
          <CardContent className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Wallet className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">
                  {accountInfo ? (accountInfo.is_virtual ? "Demo account" : "Real account") : "Not connected"}
                </p>
                <p className="text-lg font-black text-success tabular-nums truncate">
                  {balance ? `${balance.balance.toFixed(2)} ${balance.currency}` : "—"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-[10px]">{accountInfo?.loginid ?? "—"}</Badge>
              {!isDerivConnected && (
                <div className="mt-1">
                  <Button asChild size="sm" variant="secondary" className="h-7 text-[11px]">
                    <Link to="/connections">Connect Deriv</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-success/5 overflow-hidden">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge className="mb-2"><Sparkles className="mr-1 h-3 w-3" /> BOTVIO DERIV OPTIONS</Badge>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">Rise / Fall</h1>
                <p className="mt-1 text-xs text-muted-foreground">One simple workspace for your Deriv account: live signals, manual trading and automated execution.</p>
              </div>
              <Badge variant="outline" className={cn(isDerivConnected ? "border-success/40 text-success" : "border-warning/40 text-warning")}>{isDerivConnected ? "Connected" : "Connect account"}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[["1","Connect Deriv"],["2","Choose market"],["3","Trade or automate"]].map(([n,label]) => (
                <div key={n} className="rounded-xl border bg-background/40 p-2 text-center">
                  <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">{n}</span>
                  <p className="mt-1 text-[10px] font-semibold">{label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant={mode === "signals" ? "default" : "outline"} onClick={() => { setMode("signals"); setBotOn(false); }} className="h-10 text-xs"><Sparkles className="mr-1 h-4 w-4" /> Signals</Button>
              <Button variant={mode === "auto" ? "default" : "outline"} onClick={() => setMode("auto")} className="h-10 text-xs"><Bot className="mr-1 h-4 w-4" /> Automated</Button>
            </div>
            {!isDerivConnected && <Button asChild className="w-full"><Link to="/connections">Connect Deriv account</Link></Button>}
          </CardContent>
        </Card>

        {/* Symbol + price + chart */}
        <Card className="glass-card">
          <CardContent className="p-3 space-y-3">
            <AssetSelector
              assets={assets}
              value={symbol}
              onChange={setSymbol}
              loading={assetsLoading}
              onRefresh={refreshAssets}
            />

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-black tabular-nums">
                  {lastTick?.quote ?? "—"}
                  <span className={cn("ml-2 text-xs font-bold", change >= 0 ? "text-success" : "text-destructive")}>
                    {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(4)}
                  </span>
                </p>
              </div>
              <Badge variant="outline" className={cn("text-[10px]", isDerivConnected ? "border-success/40 text-success" : "text-muted-foreground")}>
                <Activity className="h-3 w-3 mr-1" />{isDerivConnected ? "Live" : "Offline"}
              </Badge>
            </div>

            <TickChart
              ticks={ticks}
              height={220}
              prediction={dismissed ? null : { direction: signal.direction, confidence: signal.confidence, label: `NEXT ${duration} TICKS` }}
              onDismissPrediction={() => setDismissed(true)}
            />
          </CardContent>
        </Card>

        <TradeExecutionStatus
          feedback={feedback}
          onRetry={() => setFeedback({ phase: "idle" })}
          onChangeAsset={refreshAssets}
        />

        {/* RSI settings */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-warning" /> RSI Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">RSI ({rsiPeriod}) — {symbolLabel}</p>
                <p className="text-2xl font-black tabular-nums">{rsiValue != null ? rsiValue.toFixed(1) : "—"}</p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  rsiValue != null && rsiValue >= overbought && "border-destructive/40 text-destructive",
                  rsiValue != null && rsiValue <= oversold && "border-success/40 text-success",
                )}
              >
                {rsiValue == null ? "Warming up" : rsiValue >= overbought ? "Overbought" : rsiValue <= oversold ? "Oversold" : "Neutral"}
              </Badge>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  rsiValue != null && rsiValue >= overbought ? "bg-destructive" : rsiValue != null && rsiValue <= oversold ? "bg-success" : "bg-primary",
                )}
                style={{ width: `${Math.min(100, Math.max(0, rsiValue ?? 0))}%` }}
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs flex justify-between"><span>Period</span><span className="tabular-nums">{rsiPeriod}</span></Label>
                <Slider value={[rsiPeriod]} min={5} max={30} step={1} onValueChange={([v]) => setRsiPeriod(v)} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs flex justify-between"><span>Overbought (FALL)</span><span className="tabular-nums">{overbought}</span></Label>
                <Slider value={[overbought]} min={55} max={90} step={1} onValueChange={([v]) => setOverbought(v)} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs flex justify-between"><span>Oversold (RISE)</span><span className="tabular-nums">{oversold}</span></Label>
                <Slider value={[oversold]} min={10} max={45} step={1} onValueChange={([v]) => setOversold(v)} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signal engine */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> RSI Signal Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-2xl font-black",
                signal.direction === "RISE" ? "text-success" : signal.direction === "FALL" ? "text-destructive" : "text-muted-foreground",
              )}>
                {signal.direction === "RISE" ? "RISE" : signal.direction === "FALL" ? "FALL" : "WAITING"}
              </p>
              <Badge variant="outline" className="text-xs tabular-nums">{signal.confidence}% confidence</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{signal.reason}</p>
            <p className="text-[10px] text-muted-foreground/80">
              <Gauge className="h-3 w-3 inline mr-1" />
              Signals are probabilistic reads of live ticks — no win rate is guaranteed.
            </p>
          </CardContent>
        </Card>

        {/* Auto bot */}
        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Auto Bot</span>
              <Switch checked={botOn} onCheckedChange={(v) => { setBotOn(v); if (v) { setBotTrades(0); addLog("Auto bot started", "info"); } else addLog("Auto bot stopped", "info"); }} disabled={!isDerivConnected || mode !== "auto"} />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className="text-xs text-muted-foreground">
              The bot takes the RSI engine's pick automatically, respecting your confidence threshold, stake, duration and a 15s cooldown between entries.
            </p>
            <div>
              <Label className="text-xs flex justify-between"><span>Min confidence</span><span className="tabular-nums">{minConfidence}%</span></Label>
              <Slider value={[minConfidence]} min={50} max={95} step={1} onValueChange={([v]) => setMinConfidence(v)} className="mt-2" />
            </div>
            <div>
              <Label className="text-xs flex justify-between"><span>Max trades this session</span><span className="tabular-nums">{maxTrades}</span></Label>
              <Slider value={[maxTrades]} min={1} max={30} step={1} onValueChange={([v]) => setMaxTrades(v)} className="mt-2" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Trades placed by bot</span>
              <Badge variant="outline" className="tabular-nums">{botTrades} / {maxTrades}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Ticket */}
        <Card className="glass-card">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Stake (USD)</Label>
                <Input inputMode="decimal" value={stake} onChange={(e) => setStake(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Duration (ticks)</Label>
                <Input inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                disabled={busy || !isDerivConnected || assetBlocked}
                onClick={() => handleBuy("CALL", "Rise")}
                className="h-14 text-base font-bold bg-success hover:bg-success/90 text-success-foreground"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <span className="flex flex-col items-center leading-tight">
                    <span className="flex items-center"><TrendingUp className="h-5 w-5 mr-1" /> Rise</span>
                    <span className="text-[10px] opacity-80">{symbolLabel}</span>
                  </span>
                )}
              </Button>
              <Button
                size="lg"
                disabled={busy || !isDerivConnected || assetBlocked}
                onClick={() => handleBuy("PUT", "Fall")}
                className="h-14 text-base font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <span className="flex flex-col items-center leading-tight">
                    <span className="flex items-center"><TrendingDown className="h-5 w-5 mr-1" /> Fall</span>
                    <span className="text-[10px] opacity-80">{symbolLabel}</span>
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Activity</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-40 pr-3">
              {logs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity yet in this session.</p>
              ) : (
                <ul className="space-y-1.5">
                  {logs.map((l) => (
                    <li key={l.id} className="text-xs flex gap-2">
                      <span className="text-muted-foreground shrink-0">{l.time}</span>
                      <span className={cn(l.tone === "success" && "text-success", l.tone === "error" && "text-destructive")}>{l.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <StrategyCards currentStyleId="rise-fall-scalping" />
      </main>
    </div>
  );
}
