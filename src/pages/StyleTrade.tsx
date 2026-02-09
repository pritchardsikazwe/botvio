import { useState, useEffect, useCallback } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface LogEntry {
  id: number;
  time: string;
  type: "info" | "success" | "error";
  message: string;
}

const StyleTrade = () => {
  const { styleId } = useParams<{ styleId: string }>();
  const navigate = useNavigate();
  const { authorized, lastTick, subscribeTicks, unsubscribeTicks, getProposal, buyContract } = useDeriv();
  const style = getStyleById(styleId || "");

  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [activeContract, setActiveContract] = useState("");
  const [stake, setStake] = useState("1");
  const [duration, setDuration] = useState("5");
  const [digit, setDigit] = useState("5");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [buying, setBuying] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

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
      subscribeTicks(selectedSymbol);
      return () => { unsubscribeTicks(selectedSymbol); };
    }
  }, [authorized, selectedSymbol]);

  // Track price
  useEffect(() => {
    if (lastTick && lastTick.symbol === selectedSymbol) {
      setCurrentPrice(lastTick.quote);
    }
  }, [lastTick, selectedSymbol]);

  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    setLogs(prev => [{
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      type,
      message,
    }, ...prev].slice(0, 50));
  }, []);

  const currentContractConfig = style?.contractTypes.find(c => c.id === activeContract);

  const handleBuy = async (button: ContractTypeConfig["buyButtons"][0]) => {
    if (!authorized) {
      toast.error("Connect your Deriv account first");
      return;
    }
    if (!selectedSymbol) return;

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
    } catch (err: any) {
      addLog("error", `Error: ${err.message}`);
      toast.error(err.message);
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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${style.title} Trading`} description={style.description} noIndex />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Title bar */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{style.title}</h1>
            <p className="text-sm text-muted-foreground">{style.description}</p>
          </div>
          <div className="flex gap-1.5 ml-auto">
            <Badge variant="outline">{style.riskTag}</Badge>
            <Badge variant="outline">{style.tempoTag}</Badge>
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
                              disabled={buying || !selectedSymbol}
                              onClick={() => handleBuy(btn)}
                            >
                              {buying ? "Placing…" : btn.label}
                            </Button>
                          ))}
                        </div>
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
