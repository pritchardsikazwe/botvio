import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDeriv } from "@/contexts/DerivContext";
import { DerivConnectionPanel } from "@/components/broker/DerivConnectionPanel";
import { getStyleById, type ContractTypeConfig } from "@/config/tradingStyles";
import { runEngine, rsi, type EngineType, type SignalResult } from "@/lib/signalEngines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDerivSymbols } from "@/hooks/useDerivSymbols";
import { toast } from "sonner";
import { Activity, ArrowDownRight, ArrowUpRight, Gauge, Loader2, Sparkles, UserCircle2, Bot, UserRound, RefreshCw } from "lucide-react";

interface DerivTradePanelProps {
  styleId: string;
  engine: EngineType;
}
interface TradeLog { id: number; time: string; message: string; tone: "info" | "success" | "error"; }
interface PriceQuote { ask: number; payout: number; longcode: string; }

const UNIT_LABELS: Record<string, string> = { t: "ticks", s: "seconds", m: "minutes", h: "hours", d: "days" };

export const DerivTradePanel = ({ styleId, engine }: DerivTradePanelProps) => {
  const {
    authorized, isDerivConnected, balance, lastTick, subscribeTicks, unsubscribeTicks,
    placeTrade, getProposal, sellContract, onContractUpdate, accountInfo,
    derivTokens, activeDerivToken, switchDerivToken, initializing,
  } = useDeriv();

  const style = getStyleById(styleId);
  const instruments = useMemo(() => style?.instruments ?? [], [style]);
  const contractTypes = style?.contractTypes ?? [];
  const [contractId, setContractId] = useState(contractTypes[0]?.id ?? "");
  const contractType = contractTypes.find(c => c.id === contractId) ?? contractTypes[0];
  const buyButtons = contractType?.buyButtons ?? [];
  const requiredContractTypes = useMemo(() => buyButtons.map(b => b.contractType), [buyButtons]);
  const liveSymbols = useDerivSymbols(instruments, requiredContractTypes, authorized && instruments.length > 0);
  const tradableInstruments = liveSymbols.tradableAssets.map(a => ({ symbol: a.symbol, displayName: a.displayName }));
  const [symbol, setSymbol] = useState(instruments[0]?.symbol ?? "R_75");
  const [stake, setStake] = useState("1");
  const [duration, setDuration] = useState(contractType?.tickDuration ? "5" : "5");
  const [durationUnit, setDurationUnit] = useState(contractType?.tickDuration ? "t" : "m");
  const [barrier, setBarrier] = useState("5");
  const [multiplier, setMultiplier] = useState("100");
  const [growthRate, setGrowthRate] = useState("2");
  const [busy, setBusy] = useState(false);
  const [pricing, setPricing] = useState(false);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [signal, setSignal] = useState<SignalResult | null>(null);
  const [rsiValue, setRsiValue] = useState<number | null>(null);
  const [activeContract, setActiveContract] = useState<{ id: number; buy: number; payout: number; profit: number; validToSell: boolean; status: string } | null>(null);
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const [tradeMode, setTradeMode] = useState<"manual" | "auto">("manual");
  const [autoBusy, setAutoBusy] = useState(false);
  const autoCooldownUntil = useRef(0);
  const autoZone = useRef<"neutral" | "oversold" | "overbought">("neutral");
  const ticks = useRef<number[]>([]);
  const logId = useRef(0);

  const isMultipliers = contractType?.buyButtons.some(b => ["MULTUP", "MULTDOWN"].includes(b.contractType)) ?? false;
  const isAccumulator = contractType?.buyButtons.some(b => b.contractType === "ACCU") ?? false;
  const needsBarrier = contractType?.needsDigit || contractType?.buyButtons.some(b => ["CALL", "PUT", "ONETOUCH", "NOTOUCH", "HIGHER", "LOWER"].includes(b.contractType)) && ["higher-lower", "touch-no-touch"].includes(styleId);
  const symbolLabel = tradableInstruments.find(i => i.symbol === symbol)?.displayName ?? symbol;
  const capability = liveSymbols.bySymbol.get(symbol)?.capability;
  const contractSpecs = useMemo(
    () => Object.fromEntries(buyButtons.map(b => [b.contractType, capability?.contracts?.[b.contractType] ?? null])),
    [buyButtons, capability],
  ) as Record<string, typeof capability extends null ? never : any>;
  const primarySpec = contractSpecs[buyButtons[0]?.contractType];
  const isRiseFall = styleId === "rise-fall-scalping" && contractId === "rise_fall";
  const isAutoMode = tradeMode === "auto" && isRiseFall;
  const connectedAccounts = derivTokens ?? [];
  const currency = balance?.currency ?? accountInfo?.currency ?? "USD";
  const allowedDurationUnits = primarySpec?.durationUnits?.length ? primarySpec.durationUnits : ["t", "s", "m", "h", "d"];

  const addLog = useCallback((message: string, tone: TradeLog["tone"] = "info") => {
    logId.current += 1;
    setLogs(prev => [{ id: logId.current, time: new Date().toLocaleTimeString(), message, tone }, ...prev].slice(0, 25));
  }, []);

  useEffect(() => {
    if (!liveSymbols.loading && tradableInstruments.length > 0 && !tradableInstruments.some(i => i.symbol === symbol)) {
      setSymbol(tradableInstruments[0].symbol);
    }
  }, [liveSymbols.loading, tradableInstruments, symbol]);

  useEffect(() => {
    setQuote(null);
    setActiveContract(null);
    setDurationUnit(contractType?.tickDuration ? "t" : styleId === "turbo" ? "s" : "m");
  }, [contractId, styleId, contractType?.tickDuration]);

  useEffect(() => {
    if (!authorized || !symbol) return;
    ticks.current = [];
    setSignal(null);
    setRsiValue(null);
    subscribeTicks(symbol).catch(() => addLog(`Could not stream ${symbol}`, "error"));
    return () => { unsubscribeTicks(symbol).catch(() => {}); };
  }, [authorized, symbol, subscribeTicks, unsubscribeTicks, addLog]);

  useEffect(() => {
    if (!lastTick?.quote) return;
    ticks.current = [...ticks.current, lastTick.quote].slice(-200);
    if (ticks.current.length >= 15) { try { setRsiValue(rsi(ticks.current, 14)); } catch {} }
    if (ticks.current.length >= 30) { try { setSignal(runEngine(engine, ticks.current)); } catch {} }
  }, [lastTick, engine]);

  useEffect(() => {
    if (!authorized) return;
    return onContractUpdate(update => {
      setActiveContract(prev => prev?.id === update.contract_id ? {
        id: update.contract_id,
        buy: Number(update.buy_price),
        payout: Number(update.payout),
        profit: Number(update.profit),
        validToSell: !!update.is_valid_to_sell,
        status: update.status,
      } : prev);
      if (["won", "lost", "sold"].includes(update.status)) {
        addLog(`Contract #${update.contract_id} ${update.status} — P/L ${Number(update.profit).toFixed(2)}`, update.status === "won" ? "success" : update.status === "lost" ? "error" : "info");
      }
    });
  }, [authorized, onContractUpdate, addLog]);

  const buildParams = useCallback((ct: string) => {
    const amount = Number(stake);
    const params: any = {
      symbol, contract_type: ct, amount,
      currency, basis: "stake",
      duration: Number(duration), duration_unit: durationUnit,
    };
    if (needsBarrier) params.barrier = barrier;
    if (isMultipliers) params.multiplier = Number(multiplier);
    if (isAccumulator) params.growth_rate = Number(growthRate);
    return params;
  }, [stake, symbol, currency, duration, durationUnit, needsBarrier, barrier, isMultipliers, multiplier, isAccumulator, growthRate]);

  const validateTrade = (ct: string) => {
    const s = contractSpecs[ct];
    const amount = Number(stake);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid stake.");
    if (!s) throw new Error("Deriv has not confirmed this contract for the selected symbol.");
    if (s.minStake != null && amount < s.minStake) throw new Error(`Minimum stake for this contract is ${s.minStake} ${currency}.`);
    if (s.maxStake != null && amount > s.maxStake) throw new Error(`Maximum stake for this contract is ${s.maxStake} ${currency}.`);
    if (durationUnit && s.durationUnits.length > 0 && !s.durationUnits.includes(durationUnit)) {
      throw new Error(`Deriv does not allow ${UNIT_LABELS[durationUnit] ?? durationUnit} for this contract.`);
    }
    const d = Number(duration);
    if (!Number.isFinite(d) || d <= 0) throw new Error("Enter a valid duration.");
    if (s.minDuration != null && d < s.minDuration) throw new Error(`Minimum duration is ${s.minDuration} ${UNIT_LABELS[durationUnit] ?? durationUnit}.`);
    if (s.maxDuration != null && d > s.maxDuration) throw new Error(`Maximum duration is ${s.maxDuration} ${UNIT_LABELS[durationUnit] ?? durationUnit}.`);
  };

  const handlePrice = async () => {
    if (!isDerivConnected) { toast.error("Connect your Deriv account first"); return; }
    try { validateTrade(buyButtons[0]?.contractType ?? ""); } catch (e) {
      const message = e instanceof Error ? e.message : "Trade parameters are not allowed by Deriv.";
      toast.error(message); addLog(message, "error"); return;
    }
    setPricing(true);
    try {
      const p = await getProposal(buildParams(buyButtons[0]?.contractType ?? ""));
      setQuote({ ask: Number(p.ask_price), payout: Number(p.payout), longcode: p.longcode });
      addLog(`Price ${Number(p.ask_price).toFixed(2)} → payout ${Number(p.payout).toFixed(2)}`, "success");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to price contract";
      setQuote(null); addLog(message, "error"); toast.error(message);
    } finally { setPricing(false); }
  };

  const handleBuy = async (contract: string, label: string) => {
    if (!isDerivConnected) { toast.error("Connect your Deriv account first"); return; }
    try { validateTrade(contract); } catch (e) {
      const message = e instanceof Error ? e.message : "Trade parameters are not allowed by Deriv.";
      toast.error(message); addLog(message, "error"); return;
    }
    if (activeContract?.status === "open" && activeContract.validToSell) {
      toast.error("Finish or sell the current contract before opening another.");
      return;
    }
    setBusy(true);
    addLog(`Buying ${label} on ${symbol} for ${currency} ${amount.toFixed(2)}...`);
    try {
      const result = await placeTrade(buildParams(contract));
      setQuote(null);
      setActiveContract({ id: result.contract_id, buy: Number(result.buy_price), payout: Number(result.payout), profit: 0, validToSell: true, status: "open" });
      addLog(`${label} filled — #${result.contract_id} @ ${Number(result.buy_price).toFixed(2)}`, "success");
      toast.success(`${label} placed on ${symbolLabel}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Trade failed";
      addLog(message, "error"); toast.error(message);
    } finally { setBusy(false); }
  };

  useEffect(() => {
    if (!isAutoMode || !isDerivConnected || liveSymbols.loading || !tradableInstruments.length || !rsiValue || autoBusy || busy) return;
    if (activeContract?.status === "open" && activeContract.validToSell) return;
    const now = Date.now();
    if (now < autoCooldownUntil.current) return;

    // Trigger only when RSI enters an extreme zone, then wait for it to leave
    // the reset band before another automated trade can occur.
    if (rsiValue <= 30 && autoZone.current !== "oversold") {
      autoZone.current = "oversold";
      setAutoBusy(true);
      autoCooldownUntil.current = now + 30_000;
      handleBuy("CALL", "Auto Rise").catch(() => {}).finally(() => setAutoBusy(false));
    } else if (rsiValue >= 70 && autoZone.current !== "overbought") {
      autoZone.current = "overbought";
      setAutoBusy(true);
      autoCooldownUntil.current = now + 30_000;
      handleBuy("PUT", "Auto Fall").catch(() => {}).finally(() => setAutoBusy(false));
    } else if (rsiValue > 35 && rsiValue < 65) {
      autoZone.current = "neutral";
    }
  }, [isAutoMode, isDerivConnected, liveSymbols.loading, tradableInstruments.length, rsiValue, autoBusy, busy, activeContract?.status, activeContract?.validToSell, handleBuy]);

  const handleSell = async () => {
    if (!activeContract?.id || !activeContract.validToSell) return;
    setBusy(true);
    try {
      const result = await sellContract(activeContract.id, 0);
      addLog(`Contract #${activeContract.id} sold for ${Number(result.sold_for).toFixed(2)}`, "success");
      setActiveContract(prev => prev ? { ...prev, validToSell: false, status: "sold" } : prev);
      toast.success("Contract sold at market");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Early sell failed";
      addLog(message, "error"); toast.error(message);
    } finally { setBusy(false); }
  };

  const directionTone = signal?.signal === "RISE" || signal?.signal === "UP" ? "text-success" : signal?.signal === "FALL" || signal?.signal === "DOWN" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="space-y-4">
      {!isDerivConnected && (
        <Card className="glass-card border-primary/30">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div><p className="font-semibold">Connect Deriv to start trading</p><p className="text-xs text-muted-foreground">Stay here — no need to open Trading Connections.</p></div>
              <Badge variant="outline">Options</Badge>
            </div>
            <DerivConnectionPanel showAccountSelection={true} />
          </CardContent>
        </Card>
      )}
      <Card className="glass-card"><CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0"><UserCircle2 className="h-5 w-5 text-primary shrink-0" /><div><p className="text-[11px] text-muted-foreground">Deriv connection</p><p className="text-sm font-semibold truncate">{accountInfo?.loginid ?? "Not connected"}</p></div></div>
          <div className="text-right">{accountInfo && <Badge variant="outline">{accountInfo.is_virtual ? "DEMO" : "REAL"}</Badge>}<p className="text-[11px] text-muted-foreground mt-1">{balance ? `${balance.currency} ${balance.balance.toFixed(2)}` : "—"}</p></div>
        </div>
        {isDerivConnected && connectedAccounts.length > 0 && <div className="flex items-center gap-2">
          <Select value={activeDerivToken?.id ?? ""} onValueChange={(id) => switchDerivToken(id).catch(e => toast.error(e instanceof Error ? e.message : "Could not switch account"))} disabled={initializing}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Switch Deriv account" /></SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {connectedAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.is_virtual ? "DEMO" : "REAL"} · {a.loginid} · {a.currency}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" title="Refresh Deriv connection" onClick={() => switchDerivToken(activeDerivToken?.id ?? "").catch(e => toast.error(e instanceof Error ? e.message : "Reconnect failed"))} disabled={!activeDerivToken || initializing}><RefreshCw className={cn("h-4 w-4", initializing && "animate-spin")} /></Button>
        </div>}
        {isDerivConnected && connectedAccounts.length === 0 && <p className="text-[11px] text-muted-foreground">Only the currently connected Deriv account is saved. Connect another Demo or Real account from the Deriv account manager to make it switchable here.</p>}
      </CardContent></Card>

      <Card className="glass-card"><CardContent className="p-4 flex items-center justify-between">
        <div><p className="text-xs text-muted-foreground">{symbolLabel}</p><p className="text-2xl font-bold tabular-nums">{lastTick?.quote ?? "—"}</p></div>
        <Badge variant="outline" className={cn("text-xs", isDerivConnected ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground")}><Activity className="h-3 w-3 mr-1" />{isDerivConnected ? "Live" : "Offline"}</Badge>
      </CardContent></Card>

      <Card className="glass-card"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Botvio AI Signal</CardTitle></CardHeader><CardContent className="pt-0"><p className={cn("text-2xl font-black", directionTone)}>{signal?.signal ?? "WAITING"}</p><p className="text-xs text-muted-foreground">{signal ? `${signal.confidence}% confidence — ${signal.reasons?.[0] ?? "Live market read"}` : "Collecting live ticks..."}</p></CardContent></Card>

      <Card className="glass-card"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gauge className="h-4 w-4 text-warning" /> RSI (14) — Rise/Fall signal</CardTitle></CardHeader><CardContent className="pt-0 space-y-3">
        <div className="flex items-end justify-between"><div><p className="text-2xl font-black">{rsiValue != null ? rsiValue.toFixed(1) : "—"}</p><p className="text-[10px] text-muted-foreground">30 Oversold · 50 Neutral · 70 Overbought</p></div><Badge variant="outline" className={cn(rsiValue != null && rsiValue <= 30 ? "text-success border-success/30" : rsiValue != null && rsiValue >= 70 ? "text-destructive border-destructive/30" : "")}>{rsiValue == null ? "Warming up" : rsiValue >= 70 ? "OVERBOUGHT → Fall watch" : rsiValue <= 30 ? "OVERSOLD → Rise watch" : "Neutral"}</Badge></div>
        {isRiseFall && <div className="grid grid-cols-2 gap-2">
          <Button variant={tradeMode === "manual" ? "default" : "outline"} onClick={() => setTradeMode("manual")}><UserRound className="h-4 w-4 mr-1" /> Manual</Button>
          <Button variant={tradeMode === "auto" ? "default" : "outline"} onClick={() => setTradeMode("auto")}><Bot className="h-4 w-4 mr-1" /> RSI Auto</Button>
        </div>}
        {isAutoMode && <p className="text-[11px] text-muted-foreground">Auto mode watches live RSI: ≤30 can trigger Rise, ≥70 can trigger Fall. One open contract at a time and a 30-second cooldown prevent repeated entries.</p>}
      </CardContent></Card>

      <Card className="glass-card"><CardContent className="p-4 space-y-3">
        {contractTypes.length > 1 && <div className="space-y-1.5"><Label className="text-xs">Options type</Label><Select value={contractId} onValueChange={setContractId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="bg-popover z-50">{contractTypes.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent></Select></div>}
        <div className="space-y-1.5"><Label className="text-xs">Market</Label><Select value={symbol} onValueChange={setSymbol}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="bg-popover z-50 max-h-72">{tradableInstruments.map(i => <SelectItem key={i.symbol} value={i.symbol}>{i.displayName}</SelectItem>)}</SelectContent></Select></div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-xs">Stake ({currency})</Label><Input inputMode="decimal" value={stake} onChange={e => { setStake(e.target.value); setQuote(null); }} /></div>
          {isMultipliers ? <div className="space-y-1.5"><Label className="text-xs">Multiplier</Label><Select value={multiplier} onValueChange={setMultiplier}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="bg-popover z-50">{["10","20","30","50","100","200","400"].map(m => <SelectItem key={m} value={m}>{m}x</SelectItem>)}</SelectContent></Select></div>
          : <div className="space-y-1.5"><Label className="text-xs">Duration</Label><div className="flex gap-2"><Input className="min-w-0" inputMode="numeric" value={duration} min={primarySpec?.minDuration ?? undefined} max={primarySpec?.maxDuration ?? undefined} onChange={e => { setDuration(e.target.value); setQuote(null); }} /><Select value={allowedDurationUnits.includes(durationUnit) ? durationUnit : allowedDurationUnits[0]} onValueChange={v => { setDurationUnit(v); setQuote(null); }}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent className="bg-popover z-50">{allowedDurationUnits.map(v => <SelectItem key={v} value={v}>{UNIT_LABELS[v] ?? v}</SelectItem>)}</SelectContent></Select></div>}
        </div>

        {needsBarrier && <div className="space-y-1.5"><Label className="text-xs">{contractType?.needsDigit ? "Barrier / last digit (0–9)" : "Barrier"}</Label><Input inputMode="decimal" value={barrier} onChange={e => { setBarrier(e.target.value); setQuote(null); }} placeholder={contractType?.needsDigit ? "0 to 9" : "e.g. +0.50"} /></div>}
        {isAccumulator && <div className="space-y-1.5"><Label className="text-xs">Growth rate (%)</Label><Input inputMode="decimal" value={growthRate} onChange={e => { setGrowthRate(e.target.value); setQuote(null); }} /></div>}

        {primarySpec && <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground"><Badge variant="outline">{primarySpec.displayName}</Badge>{primarySpec.minStake != null && <Badge variant="outline">Min {primarySpec.minStake}</Badge>}{primarySpec.maxStake != null && <Badge variant="outline">Max {primarySpec.maxStake}</Badge>}{primarySpec.durationUnits.map(u => <Badge key={u} variant="outline">{UNIT_LABELS[u] ?? u}</Badge>)}</div>}

        {quote && <div className="rounded-xl border p-3 space-y-1"><div className="flex justify-between text-sm"><span>Ask / stake</span><strong>{currency} {quote.ask.toFixed(2)}</strong></div><div className="flex justify-between text-sm"><span>Payout</span><strong>{currency} {quote.payout.toFixed(2)}</strong></div><p className="text-[10px] text-muted-foreground">{quote.longcode}</p></div>}

        <Button variant="outline" className="w-full" disabled={pricing || busy || !isDerivConnected || liveSymbols.loading || !tradableInstruments.length} onClick={handlePrice}>{pricing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Live Price"}</Button>

        {liveSymbols.error && <p className="text-xs text-warning">Live Deriv capability validation is unavailable; markets remain blocked until verified.</p>}
        {!liveSymbols.loading && !tradableInstruments.length && <p className="text-xs text-destructive">No supported live Deriv markets are available for this contract type.</p>}

        <div className="grid grid-cols-2 gap-3 pt-1">{buyButtons.map(btn => <Button key={btn.contractType} size="lg" disabled={busy || autoBusy || isAutoMode || !isDerivConnected || liveSymbols.loading || !tradableInstruments.length || !contractSpecs[btn.contractType]} onClick={() => handleBuy(btn.contractType, btn.label)} className={cn("h-14 text-base font-bold", btn.variant === "destructive" ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : btn.variant === "success" ? "bg-success hover:bg-success/90 text-success-foreground" : "")}><span className="flex flex-col items-center leading-tight"><span className="flex items-center">{btn.variant === "destructive" ? <ArrowDownRight className="h-5 w-5 mr-1" /> : <ArrowUpRight className="h-5 w-5 mr-1" />}{btn.label}</span><span className="text-[10px] opacity-80">{symbolLabel}</span></span></Button>)}</div>

        {activeContract && <div className="rounded-xl border p-3 space-y-2"><div className="flex justify-between text-sm"><span>Open #{activeContract.id}</span><Badge variant="outline">{activeContract.status}</Badge></div><div className="flex justify-between text-sm"><span>Live P/L</span><strong className={activeContract.profit >= 0 ? "text-success" : "text-destructive"}>{activeContract.profit.toFixed(2)}</strong></div><Button variant="destructive" className="w-full" disabled={busy || !activeContract.validToSell} onClick={handleSell}>{activeContract.validToSell ? "Sell Early at Market" : "Early Sell Unavailable"}</Button></div>}

        {!isDerivConnected && <p className="text-xs text-muted-foreground text-center">Connect a Deriv account in the Account tab to enable trading.</p>}
      </CardContent></Card>

      <Card className="glass-card"><CardHeader className="pb-2"><CardTitle className="text-sm">Activity</CardTitle></CardHeader><CardContent className="pt-0"><ScrollArea className="h-40 pr-3">{logs.length === 0 ? <p className="text-xs text-muted-foreground">No trades yet in this session.</p> : <ul className="space-y-1.5">{logs.map(l => <li key={l.id} className="text-xs flex gap-2"><span className="text-muted-foreground shrink-0">{l.time}</span><span className={cn(l.tone === "success" && "text-success", l.tone === "error" && "text-destructive")}>{l.message}</span></li>)}</ul>}</ScrollArea></CardContent></Card>
    </div>
  );
};
