import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getStyleById, type ContractTypeConfig } from "@/config/tradingStyles";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { DerivConnectCTA } from "@/components/trading/DerivConnectCTA";
import { useDeriv } from "@/contexts/DerivContext";
import { useContractCapabilities } from "@/hooks/useContractCapabilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Activity, CheckCircle2, XCircle, Bot, AlertTriangle, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SignalPanel } from "@/components/trading/SignalPanel";
import { TradeStatusPanel, type TradeRecord } from "@/components/trading/TradeStatusPanel";
import { runEngine, generateDemoSignal, type SignalResult, type EngineType } from "@/lib/signalEngines";
import {
  createDefaultRiskSession, checkCanTrade, getMinInterval,
  recordTradeResult, shouldAutoTrade, safeStake,
  type RiskSession,
} from "@/lib/riskGuardrails";

interface LogEntry {
  id: number;
  time: string;
  type: "info" | "success" | "error";
  message: string;
}

const StyleTrade = () => {
  const { styleId } = useParams<{ styleId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    authorized, balance, lastTick, subscribeTicks, unsubscribeTicks,
    getProposal, buyContract, subscribeContract, onContractUpdate, refreshBalance,
    accountInfo, activeDerivToken,
  } = useDeriv();
  const style = getStyleById(styleId || "");

  const [selectedSymbol, setSelectedSymbol] = useState(() => searchParams.get("symbol") || "");
  const [activeContract, setActiveContract] = useState("");
  const [stake, setStake] = useState("1");
  const [duration, setDuration] = useState("5");
  const [digit, setDigit] = useState("5");
  const [multiplier, setMultiplier] = useState("100");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [buying, setBuying] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>([]);

  // Signal engine state
  const tickBuffer = useRef<number[]>([]);
  const [currentSignal, setCurrentSignal] = useState<SignalResult | null>(null);
  const [riskSession, setRiskSession] = useState<RiskSession>(
    createDefaultRiskSession(balance?.balance)
  );
  const [autoMode, setAutoMode] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const consecutiveSameRef = useRef(0);
  const lastSignalRef = useRef<string>("WAIT");

  // Capability gating
  const { isSupported, getAllowedMultipliers, loading: capsLoading, supportedTypes } = useContractCapabilities(
    authorized ? selectedSymbol : null
  );

  // Init defaults
  useEffect(() => {
    if (style) {
      if (style.instruments.length > 0 && !selectedSymbol) {
        setSelectedSymbol(style.instruments[0].symbol);
      }
      if (style.contractTypes.length > 0 && !activeContract) {
        setActiveContract(style.contractTypes[0].id);
      }
      const isDigitStyle = style.contractTypes.some(ct => 
        ct.id === "even_odd" || ct.id === "over_under" || ct.id === "match_differ"
      );
      if (isDigitStyle) {
        setDuration("5");
      }
    }
  }, [style]);

  // Set multiplier from capability when available
  useEffect(() => {
    const allowed = getAllowedMultipliers();
    if (allowed.length > 0 && !allowed.includes(parseInt(multiplier))) {
      setMultiplier(String(allowed[0]));
    }
  }, [getAllowedMultipliers, selectedSymbol]);

  // Persist last instrument per style
  useEffect(() => {
    if (styleId && selectedSymbol) {
      localStorage.setItem(`botvio_last_instrument_${styleId}`, selectedSymbol);
    }
  }, [styleId, selectedSymbol]);

  useEffect(() => {
    if (styleId && !searchParams.get("symbol")) {
      const saved = localStorage.getItem(`botvio_last_instrument_${styleId}`);
      if (saved && style?.instruments.some(i => i.symbol === saved)) {
        setSelectedSymbol(saved);
      }
    }
  }, [styleId]);

  // Subscribe to ticks
  useEffect(() => {
    if (authorized && selectedSymbol) {
      tickBuffer.current = [];
      subscribeTicks(selectedSymbol);
      return () => { unsubscribeTicks(selectedSymbol); };
    }
  }, [authorized, selectedSymbol]);

  // Track price + buffer ticks for engine
  useEffect(() => {
    if (lastTick && lastTick.symbol === selectedSymbol) {
      setCurrentPrice(lastTick.quote);
      tickBuffer.current.push(lastTick.quote);
      if (tickBuffer.current.length > 300) tickBuffer.current = tickBuffer.current.slice(-300);
    }
  }, [lastTick, selectedSymbol]);

  // Refs for settlement handler (declared after addLog below, initialized lazily)
  const addLogRef = useRef<typeof addLog | null>(null);
  const styleIdRef = useRef(styleId);
  useEffect(() => { styleIdRef.current = styleId; }, [styleId]);

  useEffect(() => {
    if (!authorized) return;
    const unsub = onContractUpdate((update) => {
      const isSettled = update.is_sold || update.is_expired || ["won", "lost", "sold"].includes(update.status);

      // Update local trade records
      setTradeRecords(prev => prev.map(t => {
        if (t.contractId === update.contract_id) {
          if (isSettled) {
            const won = update.status === "won" || (update.profit !== undefined && update.profit > 0);
            const pnl = update.profit ?? (won ? (t.stake * 0.8) : -t.stake);
            return { ...t, status: won ? "won" as const : "lost" as const, pnl };
          }
        }
        return t;
      }));

      if (isSettled) {
        const won = update.status === "won" || (update.profit !== undefined && update.profit > 0);
        const pnl = update.profit ?? 0;
        setRiskSession(prev => recordTradeResult(prev, won, pnl, styleIdRef.current || ""));
        addLogRef.current?.(
          won ? "success" : "error",
          won ? `🎉 Trade WON +$${Math.abs(pnl).toFixed(2)}` : `❌ Trade LOST -$${Math.abs(pnl).toFixed(2)}`
        );

        // Force multiple balance refreshes after settlement (same pattern that makes Ticks work)
        setTimeout(() => refreshBalance().catch(() => {}), 300);
        setTimeout(() => refreshBalance().catch(() => {}), 1500);
        setTimeout(() => refreshBalance().catch(() => {}), 4000);
      }
    });
    return () => { unsub(); };
  }, [authorized, onContractUpdate, refreshBalance]);

  // Run signal engine every ~2 seconds
  useEffect(() => {
    if (!activeContract) return;

    const interval = setInterval(() => {
      const engineType = activeContract as EngineType;

      let result: SignalResult;
      if (demoMode) {
        result = generateDemoSignal(engineType);
      } else if (tickBuffer.current.length >= 20) {
        result = runEngine(engineType, tickBuffer.current);
      } else {
        return;
      }

      if (result.signal === lastSignalRef.current && result.signal !== "WAIT") {
        consecutiveSameRef.current++;
      } else {
        consecutiveSameRef.current = result.signal === "WAIT" ? 0 : 1;
      }
      lastSignalRef.current = result.signal;

      setCurrentSignal(result);

      if (result.suggestedDuration) {
        setDuration(String(result.suggestedDuration));
      }
      if (result.suggestedBarrier !== undefined) {
        setDigit(String(result.suggestedBarrier));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeContract, demoMode]);

  // Auto-mode trade execution
  useEffect(() => {
    if (!autoMode || !currentSignal || currentSignal.signal === "WAIT") return;

    const canAuto = shouldAutoTrade(
      { ...riskSession, autoMode: true },
      currentSignal.confidence,
      currentSignal.timing,
      consecutiveSameRef.current,
    );

    if (!canAuto) return;

    const ct = style?.contractTypes.find(c => c.id === activeContract);
    if (!ct) return;

    const matchBtn = ct.buyButtons.find(btn => {
      const sig = currentSignal.signal;
      if (sig === "RISE" && btn.contractType === "CALL") return true;
      if (sig === "FALL" && btn.contractType === "PUT") return true;
      if (sig === "EVEN" && btn.contractType === "DIGITEVEN") return true;
      if (sig === "ODD" && btn.contractType === "DIGITODD") return true;
      if (sig === "OVER" && btn.contractType === "DIGITOVER") return true;
      if (sig === "UNDER" && btn.contractType === "DIGITUNDER") return true;
      if (sig === "MATCH" && btn.contractType === "DIGITMATCH") return true;
      if (sig === "DIFFER" && btn.contractType === "DIGITDIFF") return true;
      if (sig === "UP" && btn.contractType === "MULTUP") return true;
      if (sig === "DOWN" && btn.contractType === "MULTDOWN") return true;
      if (sig === "BUY" && btn.contractType === "ACCU") return true;
      if (sig === "HIGHER" && btn.contractType === "CALL") return true;
      if (sig === "LOWER" && btn.contractType === "PUT") return true;
      return false;
    });

    if (matchBtn) {
      handleBuy(matchBtn);
    }
  }, [currentSignal, autoMode]);

  // Update risk session when balance changes
  useEffect(() => {
    if (balance?.balance) {
      setStake(String(safeStake(balance.balance).toFixed(2)));
    }
  }, [balance?.balance]);

  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    setLogs(prev => [{
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      type,
      message,
    }, ...prev].slice(0, 50));
  }, []);

  // Now that addLog is declared, keep ref updated for settlement handler
  useEffect(() => { addLogRef.current = addLog; }, [addLog]);

  const currentContractConfig = style?.contractTypes.find(c => c.id === activeContract);

  const tradeCheck = currentSignal
    ? checkCanTrade(riskSession, currentSignal.confidence, getMinInterval(styleId || ""))
    : { allowed: false, reason: null as any, message: "Waiting for signal" };

  const handleBuy = async (button: ContractTypeConfig["buyButtons"][0]) => {
    if (!authorized) {
      toast.error("Connect your Deriv account first");
      return;
    }
    if (!selectedSymbol) return;

    // Capability check
    if (!isSupported(button.contractType)) {
      toast.error(`${button.contractType} is not available for ${selectedSymbol}`);
      return;
    }

    setBuying(true);
    addLog("info", `Placing ${button.label} on ${selectedSymbol} — stake $${stake}`);

    try {
      const ct = button.contractType;
      const isMultiplier = ct === "MULTUP" || ct === "MULTDOWN";
      const isAccu = ct === "ACCU";
      const isDigit = ct.startsWith("DIGIT");
      const needsBarrier = ct === "DIGITMATCH" || ct === "DIGITDIFF" || ct === "DIGITOVER" || ct === "DIGITUNDER";

      const proposalParams: any = {
        symbol: selectedSymbol,
        contract_type: ct,
        amount: parseFloat(stake),
        basis: "stake",
        currency: "USD",
      };

      if (isMultiplier) {
        proposalParams.multiplier = parseInt(multiplier);
        if (stopLoss) proposalParams.limit_order = { ...(proposalParams.limit_order || {}), stop_loss: parseFloat(stopLoss) };
        if (takeProfit) proposalParams.limit_order = { ...(proposalParams.limit_order || {}), take_profit: parseFloat(takeProfit) };
      } else if (isAccu) {
        proposalParams.growth_rate = 0.01;
        if (takeProfit) proposalParams.limit_order = { take_profit: parseFloat(takeProfit) };
      } else if (isDigit) {
        const tickDur = Math.max(1, Math.min(10, parseInt(duration)));
        proposalParams.duration = tickDur;
        proposalParams.duration_unit = "t";
        if (needsBarrier) {
          proposalParams.barrier = parseInt(digit);
        }
      } else {
        proposalParams.duration = Math.max(1, parseInt(duration));
        proposalParams.duration_unit = "m";
      }

      if (!isMultiplier && !isAccu && stopLoss) {
        addLog("info", `Stop loss set at $${stopLoss}`);
      }

      console.log("[StyleTrade] proposalParams:", JSON.stringify(proposalParams));
      const proposalRes = await getProposal(proposalParams);
      addLog("info", `Proposal received — payout $${proposalRes.payout}`);

      const contract = await buyContract(proposalRes.id, proposalRes.ask_price);
      addLog("success", `✅ Trade opened — Contract ID ${contract.contract_id}`);
      toast.success("Trade placed successfully!");

      // Track trade locally as RUNNING
      const tradeRecord: TradeRecord = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        symbol: selectedSymbol,
        contractType: button.contractType,
        stake: parseFloat(stake),
        status: "running",
        contractId: contract.contract_id,
      };
      setTradeRecords(prev => [tradeRecord, ...prev]);

      // Subscribe to contract for real settlement tracking
      await subscribeContract(contract.contract_id);
      addLog("info", `Watching contract ${contract.contract_id} for settlement...`);

      // Refresh balance immediately (stake deducted)
      refreshBalance().catch(() => {});

      setRiskSession(prev => ({ ...prev, tradesThisSession: prev.tradesThisSession + 1, lastTradeAt: Date.now() }));
    } catch (err: any) {
      addLog("error", `Error: ${err.message}`);
      toast.error(err.message);
      setRiskSession(prev => recordTradeResult(prev, false, -parseFloat(stake), styleId || ""));
    } finally {
      setBuying(false);
    }
  };

  if (!style) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Style not found</h1>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </main>
      </div>
    );
  }

  const isDisabledBySignal = false;

  // Compute allowed multipliers for the selected symbol
  const allowedMultipliers = getAllowedMultipliers();
  const multiplierOptions = allowedMultipliers.length > 0
    ? allowedMultipliers.map(String)
    : ["10","20","50","100","150","200","300","500","1000"]; // fallback

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${style.title} Trading`} description={style.description} noIndex />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Title bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{style.title}</h1>
            <p className="text-sm text-muted-foreground">{style.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{style.riskTag}</Badge>
            <Badge variant="outline">{style.tempoTag}</Badge>
          </div>
          {/* Auto / Demo toggles */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Manual</Label>
              <Switch checked={autoMode} onCheckedChange={setAutoMode} />
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Bot className="h-3 w-3" /> Auto
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Demo</Label>
              <Switch checked={demoMode} onCheckedChange={setDemoMode} />
            </div>
          </div>
        </div>

        {!authorized ? (
          <DerivConnectCTA />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left – Instrument Selector */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Instrument</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger><SelectValue placeholder="Select pair" /></SelectTrigger>
                    <SelectContent>
                      {style.instruments.map(inst => (
                        <SelectItem key={inst.symbol} value={inst.symbol}>
                          {inst.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {capsLoading && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading capabilities...
                    </div>
                  )}

                  {currentPrice !== null && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
                      <div className="text-xs text-muted-foreground">Live Price</div>
                      <div className="text-2xl font-mono font-bold">{currentPrice.toFixed(4)}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Signal Panel */}
              <SignalPanel
                signal={currentSignal}
                riskSession={riskSession}
                blockReason={tradeCheck.reason}
                blockMessage={tradeCheck.message}
              />
            </div>

            {/* Center – Contract Tabs + Trade UI */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="glass-card">
                <Tabs value={activeContract} onValueChange={setActiveContract}>
                  <CardHeader className="pb-2">
                    <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                      {style.contractTypes.map(ct => {
                        // Check if any of this tab's contract types are supported
                        const tabSupported = ct.buyButtons.some(btn => isSupported(btn.contractType));
                        return (
                          <TabsTrigger
                            key={ct.id}
                            value={ct.id}
                            className="text-xs"
                            disabled={!tabSupported && supportedTypes.length > 0}
                          >
                            {ct.label}
                            {!tabSupported && supportedTypes.length > 0 && (
                              <span className="ml-1 text-[8px] text-muted-foreground">(N/A)</span>
                            )}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </CardHeader>

                  {style.contractTypes.map(ct => {
                    const isMultiplierType = ct.id === "multipliers";
                    const isAccuType = ct.id === "accumulators";
                    const isDigitType = ct.id === "even_odd" || ct.id === "over_under" || ct.id === "match_differ";
                    const hidesDuration = isMultiplierType || isAccuType;

                    const guideMap: Record<string, { title: string; steps: string[] }> = {
                      rise_fall: {
                        title: "Rise/Fall Guide",
                        steps: [
                          "1. Select an instrument (e.g. Volatility 100)",
                          "2. Set your stake amount in USD",
                          "3. Set duration in minutes (1-1440)",
                          "4. Click 'Rise' if you think price will go UP",
                          "5. Click 'Fall' if you think price will go DOWN",
                          "6. Trade settles at end of duration — profit if correct!",
                        ],
                      },
                      higher_lower: {
                        title: "Higher/Lower Guide",
                        steps: [
                          "1. Select instrument and set stake",
                          "2. Set duration in minutes",
                          "3. Click 'Higher' if price will be ABOVE entry at expiry",
                          "4. Click 'Lower' if price will be BELOW entry at expiry",
                        ],
                      },
                      even_odd: {
                        title: "Even/Odd Guide",
                        steps: [
                          "1. Select instrument and set stake",
                          "2. Set duration in TICKS (1-10)",
                          "3. Click 'Even' — you win if the last digit is 0,2,4,6,8",
                          "4. Click 'Odd' — you win if the last digit is 1,3,5,7,9",
                          "5. No digit selection needed — it's automatic!",
                        ],
                      },
                      over_under: {
                        title: "Over/Under Guide",
                        steps: [
                          "1. Select instrument and set stake",
                          "2. Set duration in TICKS (1-10)",
                          "3. Choose your prediction digit (0-9)",
                          "4. Click 'Over' — you win if last digit > your prediction",
                          "5. Click 'Under' — you win if last digit < your prediction",
                        ],
                      },
                      match_differ: {
                        title: "Matches/Differs Guide",
                        steps: [
                          "1. Select instrument and set stake",
                          "2. Set duration in TICKS (1-10)",
                          "3. Choose the digit you want to predict (0-9)",
                          "4. Click 'Matches' — you win if last digit = your digit",
                          "5. Click 'Differs' — you win if last digit ≠ your digit",
                        ],
                      },
                      multipliers: {
                        title: "Multipliers Guide",
                        steps: [
                          "1. Select instrument and set stake",
                          "2. Choose your multiplier — higher = more risk/reward",
                          "3. Optionally set Stop Loss & Take Profit in USD",
                          "4. Click 'Up' if you think price will rise",
                          "5. Click 'Down' if you think price will fall",
                          "6. Trade stays open until you sell or hit SL/TP",
                        ],
                      },
                      accumulators: {
                        title: "Accumulators Guide",
                        steps: [
                          "1. Select instrument and set stake",
                          "2. Optionally set Take Profit in USD",
                          "3. Click 'Buy' — your profit grows each tick the price stays in range",
                          "4. Trade closes automatically if price moves out of range",
                        ],
                      },
                      turbo: {
                        title: "Turbo Guide",
                        steps: [
                          "1. Select instrument and set stake",
                          "2. Set a short duration (1-5 minutes recommended)",
                          "3. Click 'Rise' or 'Fall' for ultra-fast breakout trades",
                          "4. Ideal for quick scalping on volatile instruments",
                        ],
                      },
                    };
                    const guide = guideMap[ct.id];

                    return (
                    <TabsContent key={ct.id} value={ct.id}>
                      <CardContent className="space-y-4">
                        {/* Trading Guide */}
                        {guide && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                              <Info className="h-4 w-4" />
                              {guide.title}
                            </div>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {guide.steps.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Stake (USD)</Label>
                            <Input
                              type="number"
                              min="0.35"
                              step="0.01"
                              value={stake}
                              onChange={e => setStake(e.target.value)}
                            />
                          </div>
                          {!hidesDuration && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">
                                {isDigitType ? "Duration (ticks, 1-10)" : "Duration (minutes)"}
                              </Label>
                              <Input
                                type="number"
                                min={isDigitType ? "1" : "1"}
                                max={isDigitType ? "10" : "1440"}
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                              />
                            </div>
                          )}
                          {isMultiplierType && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">
                                Multiplier
                                {allowedMultipliers.length > 0 && (
                                  <span className="ml-1 text-[10px] text-muted-foreground">(allowed for this symbol)</span>
                                )}
                              </Label>
                              <Select value={multiplier} onValueChange={setMultiplier}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {multiplierOptions.map(m => (
                                    <SelectItem key={m} value={m}>{m}x</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {/* Stop Loss / Take Profit */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Stop Loss (USD) — optional</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="e.g. 5.00"
                              value={stopLoss}
                              onChange={e => setStopLoss(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Take Profit (USD) — optional</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="e.g. 10.00"
                              value={takeProfit}
                              onChange={e => setTakeProfit(e.target.value)}
                            />
                          </div>
                        </div>

                        {ct.needsDigit && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">Last Digit Prediction (0–9)</Label>
                            <Select value={digit} onValueChange={setDigit}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {[0,1,2,3,4,5,6,7,8,9].map(d => (
                                  <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="flex gap-3">
                          {ct.buyButtons.map(btn => {
                            const btnSupported = isSupported(btn.contractType);
                            return (
                              <Button
                                key={btn.contractType}
                                className="flex-1 h-12 text-base font-bold"
                                variant={btn.variant === "success" ? "default" : btn.variant === "destructive" ? "destructive" : "default"}
                                disabled={buying || !selectedSymbol || (!btnSupported && supportedTypes.length > 0)}
                                onClick={() => handleBuy(btn)}
                                title={!btnSupported && supportedTypes.length > 0 ? `${btn.contractType} not available for ${selectedSymbol}` : undefined}
                              >
                                {buying ? "Placing…" : btn.label}
                              </Button>
                            );
                          })}
                        </div>

                      </CardContent>
                    </TabsContent>
                    );
                  })}
                </Tabs>
              </Card>
            </div>

            {/* Right – Trade Status + Risk Settings + Activity Log */}
            <div className="lg:col-span-3 space-y-4">
              {/* Trade Status Panel */}
              <TradeStatusPanel trades={tradeRecords} />

              {/* Risk / Loss Limit Settings */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Risk Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Trades / Session</Label>
                    <Input type="number" min="1" max="100" value={riskSession.maxTradesPerSession}
                      onChange={e => setRiskSession(prev => ({ ...prev, maxTradesPerSession: Math.max(1, parseInt(e.target.value) || 20) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Consecutive Losses</Label>
                    <Input type="number" min="1" max="20" value={riskSession.maxLossesInRow}
                      onChange={e => setRiskSession(prev => ({ ...prev, maxLossesInRow: Math.max(1, parseInt(e.target.value) || 5) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Daily Loss Limit (USD)</Label>
                    <Input type="number" min="0" step="10" value={riskSession.maxDailyLossUsd}
                      onChange={e => setRiskSession(prev => ({ ...prev, maxDailyLossUsd: Math.max(0, parseFloat(e.target.value) || 0) }))} />
                    <p className="text-[10px] text-muted-foreground">Set to 0 to disable daily loss limit</p>
                  </div>
                  <div className="pt-2 border-t border-border/50 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trades today</span>
                      <span>{riskSession.tradesThisSession}/{riskSession.maxTradesPerSession}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Losses in row</span>
                      <span>{riskSession.lossesInRow}/{riskSession.maxLossesInRow}</span>
                    </div>
                    {riskSession.maxDailyLossUsd > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily loss</span>
                        <span>${riskSession.dailyLossUsd.toFixed(2)} / ${riskSession.maxDailyLossUsd.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-xs"
                    onClick={() => setRiskSession(createDefaultRiskSession(balance?.balance))}>
                    Reset Session
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    {logs.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">Place a trade to see activity here.</p>
                    ) : (
                      <div className="space-y-2">
                        {logs.map(log => (
                          <div key={log.id} className="flex items-start gap-2 text-xs">
                            {log.type === "success" ? <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> :
                             log.type === "error" ? <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" /> :
                             <Activity className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />}
                            <div>
                              <span className="text-muted-foreground">{log.time}</span>
                              <span className="ml-1.5">{log.message}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StyleTrade;
