import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDeriv } from "@/contexts/DerivContext";
import { getStyleById } from "@/config/tradingStyles";
import { runEngine, rsi, type EngineType, type SignalResult } from "@/lib/signalEngines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Activity, ArrowDownRight, ArrowUpRight, Gauge, Loader2, Sparkles, UserCircle2 } from "lucide-react";

interface DerivTradePanelProps {
  styleId: "rise-fall-scalping" | "multipliers";
  engine: EngineType;
}

interface TradeLog {
  id: number;
  time: string;
  message: string;
  tone: "info" | "success" | "error";
}

export const DerivTradePanel = ({ styleId, engine }: DerivTradePanelProps) => {
  const {
    authorized, isDerivConnected, balance, lastTick, subscribeTicks, unsubscribeTicks,
    placeTrade, subscribeContract, accountInfo,
  } = useDeriv();

  const style = getStyleById(styleId);
  const contractType = style?.contractTypes[0];
  const instruments = useMemo(() => style?.instruments ?? [], [style]);

  const [symbol, setSymbol] = useState(instruments[0]?.symbol ?? "R_75");
  const [stake, setStake] = useState("1");
  const [duration, setDuration] = useState("5");
  const [multiplier, setMultiplier] = useState("100");
  const [busy, setBusy] = useState(false);
  const [signal, setSignal] = useState<SignalResult | null>(null);
  const [rsiValue, setRsiValue] = useState<number | null>(null);
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const ticks = useRef<number[]>([]);
  const logId = useRef(0);

  const isMultipliers = styleId === "multipliers";
  const symbolLabel = instruments.find((i) => i.symbol === symbol)?.displayName ?? symbol;

  const addLog = useCallback((message: string, tone: TradeLog["tone"] = "info") => {
    logId.current += 1;
    setLogs((prev) => [
      { id: logId.current, time: new Date().toLocaleTimeString(), message, tone },
      ...prev,
    ].slice(0, 25));
  }, []);

  // Live tick stream for the selected symbol
  useEffect(() => {
    if (!authorized || !symbol) return;
    ticks.current = [];
    setSignal(null);
    setRsiValue(null);
    subscribeTicks(symbol).catch(() => addLog(`Could not stream ${symbol}`, "error"));
    return () => { unsubscribeTicks(symbol).catch(() => {}); };
  }, [authorized, symbol, subscribeTicks, unsubscribeTicks, addLog]);

  // Feed the signal engine
  useEffect(() => {
    if (!lastTick?.quote) return;
    ticks.current = [...ticks.current, lastTick.quote].slice(-200);
    if (ticks.current.length >= 15) {
      try { setRsiValue(rsi(ticks.current, 14)); } catch { /* warm-up */ }
    }
    if (ticks.current.length >= 30) {
      try { setSignal(runEngine(engine, ticks.current)); } catch { /* engine warm-up */ }
    }
  }, [lastTick, engine]);

  const handleBuy = async (contract: string, label: string) => {
    if (!isDerivConnected) { toast.error("Connect your Deriv account first"); return; }
    const amount = Number(stake);
    if (!amount || amount <= 0) { toast.error("Enter a valid stake"); return; }

    setBusy(true);
    addLog(`Placing ${label} on ${symbol} for $${amount.toFixed(2)}...`);
    try {
      const result = await placeTrade({
        symbol,
        contract_type: contract,
        amount,
        ...(isMultipliers
          ? { multiplier: Number(multiplier) }
          : { duration: Number(duration), duration_unit: "t" as const }),
      });
      await subscribeContract(result.contract_id);
      addLog(`${label} filled — contract #${result.contract_id} @ $${result.buy_price}`, "success");
      toast.success(`${label} placed on ${symbol}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Trade failed";
      addLog(message, "error");
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const directionTone = signal?.signal === "RISE" || signal?.signal === "UP"
    ? "text-success"
    : signal?.signal === "FALL" || signal?.signal === "DOWN"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div className="space-y-4">
      {/* Signed-in Deriv account */}
      <Card className="glass-card">
        <CardContent className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <UserCircle2 className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Signed-in account</p>
              <p className="text-sm font-semibold truncate">
                {accountInfo?.loginid ?? "Not connected"}
              </p>
            </div>
          </div>
          <div className="text-right">
            {accountInfo && (
              <Badge variant="outline" className="text-[10px]">
                {accountInfo.is_virtual ? "DEMO" : "REAL"}
              </Badge>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              {balance ? `${balance.currency} ${balance.balance.toFixed(2)}` : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Live price */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{instruments.find((i) => i.symbol === symbol)?.displayName ?? symbol}</p>
            <p className="text-2xl font-bold tabular-nums">
              {lastTick?.quote != null ? lastTick.quote : "—"}
            </p>
          </div>
          <div className="text-right space-y-1">
            <Badge variant="outline" className={cn("text-xs", isDerivConnected ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground")}>
              <Activity className="h-3 w-3 mr-1" />{isDerivConnected ? "Live" : "Offline"}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Balance {balance ? `${balance.currency} ${balance.balance.toFixed(2)}` : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI signal */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Botvio AI Signal
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          <p className={cn("text-2xl font-black tracking-tight", directionTone)}>
            {signal?.signal ?? "WAITING"}
          </p>
          <p className="text-xs text-muted-foreground">
            {signal
              ? `${signal.confidence}% confidence — ${signal.reasons?.[0] ?? "Live market read"}`
              : "Collecting live ticks to score the market..."}
          </p>
        </CardContent>
      </Card>

      {/* RSI (separate momentum read) */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4 text-warning" /> RSI (14) — {symbolLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex items-end justify-between">
            <p className="text-2xl font-black tabular-nums">
              {rsiValue != null ? rsiValue.toFixed(1) : "—"}
            </p>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                rsiValue == null && "text-muted-foreground",
                rsiValue != null && rsiValue >= 70 && "border-destructive/40 text-destructive",
                rsiValue != null && rsiValue <= 30 && "border-success/40 text-success",
              )}
            >
              {rsiValue == null ? "Warming up" : rsiValue >= 70 ? "Overbought" : rsiValue <= 30 ? "Oversold" : "Neutral"}
            </Badge>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                rsiValue != null && rsiValue >= 70 ? "bg-destructive" : rsiValue != null && rsiValue <= 30 ? "bg-success" : "bg-primary",
              )}
              style={{ width: `${Math.min(100, Math.max(0, rsiValue ?? 0))}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Above 70 favours FALL setups, below 30 favours RISE setups. Computed live from the tick stream.
          </p>
        </CardContent>
      </Card>

      {/* Ticket */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Market</Label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-72">
                {instruments.map((i) => (
                  <SelectItem key={i.symbol} value={i.symbol}>{i.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Stake (USD)</Label>
              <Input inputMode="decimal" value={stake} onChange={(e) => setStake(e.target.value)} />
            </div>
            {isMultipliers ? (
              <div className="space-y-1.5">
                <Label className="text-xs">Multiplier</Label>
                <Select value={multiplier} onValueChange={setMultiplier}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {["10", "20", "30", "50", "100", "200", "400"].map((m) => (
                      <SelectItem key={m} value={m}>{m}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs">Duration (ticks)</Label>
                <Input inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {(contractType?.buyButtons ?? []).map((btn) => (
              <Button
                key={btn.contractType}
                size="lg"
                disabled={busy || !isDerivConnected}
                onClick={() => handleBuy(btn.contractType, btn.label)}
                className={cn(
                  "h-14 text-base font-bold",
                  btn.variant === "destructive"
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    : "bg-success hover:bg-success/90 text-success-foreground",
                )}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <span className="flex flex-col items-center leading-tight">
                    <span className="flex items-center">
                      {btn.variant === "destructive"
                        ? <ArrowDownRight className="h-5 w-5 mr-1" />
                        : <ArrowUpRight className="h-5 w-5 mr-1" />}
                      {btn.label}
                    </span>
                    <span className="text-[10px] font-medium opacity-80">{symbolLabel}</span>
                  </span>
                )}
              </Button>
            ))}
          </div>
          {!isDerivConnected && (
            <p className="text-xs text-muted-foreground text-center">Connect a Deriv account in the Account tab to enable trading.</p>
          )}
        </CardContent>
      </Card>

      {/* Activity */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Activity</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-40 pr-3">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No trades yet in this session.</p>
            ) : (
              <ul className="space-y-1.5">
                {logs.map((l) => (
                  <li key={l.id} className="text-xs flex gap-2">
                    <span className="text-muted-foreground shrink-0">{l.time}</span>
                    <span className={cn(
                      l.tone === "success" && "text-success",
                      l.tone === "error" && "text-destructive",
                    )}>{l.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};