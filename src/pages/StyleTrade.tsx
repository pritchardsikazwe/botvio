import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStyleById, type ContractTypeConfig } from "@/config/tradingStyles";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { DerivConnectCTA } from "@/components/trading/DerivConnectCTA";
import { useDeriv } from "@/contexts/DerivContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Activity, CheckCircle2, XCircle, Bot } from "lucide-react";
import { toast } from "sonner";
import { SignalPanel } from "@/components/trading/SignalPanel";
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
  const navigate = useNavigate();
  const { authorized, balance, lastTick, subscribeTicks, unsubscribeTicks, getProposal, buyContract } = useDeriv();
  const style = getStyleById(styleId || "");

  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [activeContract, setActiveContract] = useState("");
  const [stake, setStake] = useState("1");
  const [duration, setDuration] = useState("5");
  const [digit, setDigit] = useState("5");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [buying, setBuying] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

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

  // Init defaults
  useEffect(() => {
    if (style) {
      if (style.instruments.length > 0 && !selectedSymbol) {
        setSelectedSymbol(style.instruments[0].symbol);
      }
      if (style.contractTypes.length > 0 && !activeContract) {
        setActiveContract(style.contractTypes[0].id);
      }
    }
  }, [style]);

  // Persist last instrument per style
  useEffect(() => {
    if (styleId && selectedSymbol) {
      localStorage.setItem(`botvio_last_instrument_${styleId}`, selectedSymbol);
    }
  }, [styleId, selectedSymbol]);

  useEffect(() => {
    if (styleId) {
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
        return; // not enough data yet
      }

      // Track consecutive same signal for auto-bot
      if (result.signal === lastSignalRef.current && result.signal !== "WAIT") {
        consecutiveSameRef.current++;
      } else {
        consecutiveSameRef.current = result.signal === "WAIT" ? 0 : 1;
      }
      lastSignalRef.current = result.signal;

      setCurrentSignal(result);

      // Update suggested duration
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

    // Map signal to contract type button
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
      setRiskSession(prev => ({
        ...prev,
        maxDailyLossUsd: Math.min(50, balance.balance * 0.1),
      }));
      // Set safe stake
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

    // Risk check
    if (currentSignal) {
      const check = checkCanTrade(riskSession, currentSignal.confidence, getMinInterval(styleId || ""));
      if (!check.allowed) {
        toast.error(check.message);
        addLog("error", `Blocked: ${check.message}`);
        return;
      }
    }

    setBuying(true);
    addLog("info", `Placing ${button.label} on ${selectedSymbol} — stake $${stake}`);

    try {
      const durationUnit = currentContractConfig?.tickDuration ? "t" : "m" as const;

      const proposalRes = await getProposal({
        symbol: selectedSymbol,
        contract_type: button.contractType,
        amount: parseFloat(stake),
        duration: parseInt(duration),
        duration_unit: durationUnit,
        basis: "stake",
        currency: "USD",
      });

      addLog("info", `Proposal received — payout $${proposalRes.payout}`);

      const contract = await buyContract(proposalRes.id, proposalRes.ask_price);
      addLog("success", `✅ Trade opened — Contract ID ${contract.contract_id}`);
      toast.success("Trade placed successfully!");

      // Update risk session
      setRiskSession(prev => recordTradeResult(prev, true, proposalRes.payout - parseFloat(stake), styleId || ""));
    } catch (err: any) {
      addLog("error", `Error: ${err.message}`);
      toast.error(err.message);

      // Record loss in risk session
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

  const isDisabledBySignal = currentSignal ? currentSignal.confidence < 60 : false;

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
                      {style.contractTypes.map(ct => (
                        <TabsTrigger key={ct.id} value={ct.id} className="text-xs">
                          {ct.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </CardHeader>

                  {style.contractTypes.map(ct => (
                    <TabsContent key={ct.id} value={ct.id}>
                      <CardContent className="space-y-4">
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
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Duration ({ct.tickDuration ? "ticks" : "minutes"})
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              max={ct.tickDuration ? "10" : "1440"}
                              value={duration}
                              onChange={e => setDuration(e.target.value)}
                            />
                          </div>
                        </div>

                        {ct.needsDigit && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">Digit (0–9)</Label>
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
                          {ct.buyButtons.map(btn => (
                            <Button
                              key={btn.contractType}
                              className="flex-1 h-12 text-base font-bold"
                              variant={btn.variant === "success" ? "default" : btn.variant === "destructive" ? "destructive" : "default"}
                              disabled={buying || !selectedSymbol || isDisabledBySignal || !tradeCheck.allowed}
                              onClick={() => handleBuy(btn)}
                            >
                              {buying ? "Placing…" : btn.label}
                            </Button>
                          ))}
                        </div>

                        {isDisabledBySignal && (
                          <p className="text-xs text-amber-400 text-center">
                            ⚠️ Confidence below 60% — buttons disabled
                          </p>
                        )}
                      </CardContent>
                    </TabsContent>
                  ))}
                </Tabs>
              </Card>
            </div>

            {/* Right – Activity Log */}
            <div className="lg:col-span-3">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {logs.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Place a trade to see activity here.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {logs.map(log => (
                          <div key={log.id} className="flex items-start gap-2 text-xs">
                            {log.type === "success" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            ) : log.type === "error" ? (
                              <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                            ) : (
                              <Activity className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            )}
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
