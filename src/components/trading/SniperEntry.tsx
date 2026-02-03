import { useState } from "react";
import { Crosshair, Target, Zap, Activity, Loader2, ListChecks, CheckCircle, Circle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeriv } from "@/contexts/DerivContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SniperEntryProps {
  pair: string;
  currentPrice: number;
}

const STRATEGIES = [
  { id: "botvio-sniper", name: "Botvio Sniper", description: "Precision entries with support/resistance analysis" },
  { id: "boom-crash", name: "Boom/Crash Scalper", description: "Spike detection for volatility indices" },
  { id: "trend-rider", name: "Trend Rider", description: "Follow strong market trends with momentum" },
  { id: "breakout-hunter", name: "Breakout Hunter", description: "Catch breakouts from key levels" },
];

const TRADING_PAIRS: Record<string, string[]> = {
  "botvio-sniper": ["XAUUSD", "EURUSD", "GBPUSD", "V75", "V100", "R_100", "R_50"],
  "boom-crash": ["Boom_1000", "Crash_1000", "Boom_500", "Crash_500"],
  "trend-rider": ["XAUUSD", "EURUSD", "USDJPY", "GBPUSD", "US100", "US30"],
  "breakout-hunter": ["XAUUSD", "GBPJPY", "EURUSD", "V75", "V100"],
};

interface TodoItem {
  id: string;
  label: string;
  completed: boolean;
}

export const SniperEntry = ({ pair, currentPrice }: SniperEntryProps) => {
  const { authorized, placeTrade } = useDeriv();
  const { user } = useAuth();
  const [isExecuting, setIsExecuting] = useState(false);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState("botvio-sniper");
  const [selectedPair, setSelectedPair] = useState(pair || "XAUUSD");
  const [todoOpen, setTodoOpen] = useState(true);
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: "1", label: "Connect Deriv account", completed: false },
    { id: "2", label: "Select strategy", completed: false },
    { id: "3", label: "Choose trading pair", completed: false },
    { id: "4", label: "Set stake and duration", completed: false },
    { id: "5", label: "Confirm trade execution", completed: false },
  ]);
  const [tradeConfig, setTradeConfig] = useState({
    direction: "CALL" as "CALL" | "PUT",
    stake: "1",
    duration: "5",
    durationUnit: "m" as "s" | "m" | "h",
  });

  const currentStrategy = STRATEGIES.find(s => s.id === selectedStrategy);
  const availablePairs = TRADING_PAIRS[selectedStrategy] || [];

  const sniperData = {
    entryZone: { low: currentPrice * 0.998, high: currentPrice * 1.002 },
    momentum: 78,
    volatility: 'HIGH' as const,
    trend: 'BULLISH' as const,
    nextEntry: new Date(Date.now() + 300000),
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleExecuteSniper = () => {
    if (!user) {
      toast.error("Please sign in to execute trades");
      return;
    }

    if (!authorized) {
      toast.error("Please connect to Deriv first");
      toggleTodo("1"); // Mark as incomplete
      return;
    }

    // Update todos
    setTodos(prev => prev.map(todo => {
      if (todo.id === "1") return { ...todo, completed: authorized };
      if (todo.id === "2") return { ...todo, completed: !!selectedStrategy };
      if (todo.id === "3") return { ...todo, completed: !!selectedPair };
      return todo;
    }));

    setShowTradeDialog(true);
  };

  const handleConfirmTrade = async () => {
    if (!authorized || !placeTrade) {
      toast.error("Deriv connection not available");
      return;
    }

    setIsExecuting(true);

    try {
      let derivSymbol = selectedPair;
      if (selectedPair === "XAUUSD") {
        derivSymbol = "frxXAUUSD";
      } else if (selectedPair.includes("/")) {
        derivSymbol = "frx" + selectedPair.replace("/", "");
      } else if (!selectedPair.startsWith("frx") && !selectedPair.startsWith("cry") && !selectedPair.includes("_")) {
        derivSymbol = "frx" + selectedPair;
      }

      let durationValue = parseInt(tradeConfig.duration);
      let durationUnit: "s" | "m" | "h" = tradeConfig.durationUnit;

      const result = await placeTrade({
        symbol: derivSymbol,
        contract_type: tradeConfig.direction,
        amount: parseFloat(tradeConfig.stake),
        duration: durationValue,
        duration_unit: durationUnit,
      });

      // Mark all todos complete
      setTodos(prev => prev.map(todo => ({ ...todo, completed: true })));

      toast.success(
        `${currentStrategy?.name} Executed! ${tradeConfig.direction} $${tradeConfig.stake} on ${selectedPair}`,
        {
          description: `Contract ID: ${result.contract_id}`,
        }
      );

      setShowTradeDialog(false);
    } catch (error: any) {
      console.error("Strategy execution error:", error);
      toast.error(error.message || "Failed to execute trade");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Strategy Selector */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Select Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a strategy" />
              </SelectTrigger>
              <SelectContent>
                {STRATEGIES.map((strategy) => (
                  <SelectItem key={strategy.id} value={strategy.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{strategy.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {currentStrategy && (
              <p className="text-sm text-muted-foreground">
                {currentStrategy.description}
              </p>
            )}

            {/* Trading Pair Selector (under strategy) */}
            <div className="pt-2 border-t border-border">
              <Label className="text-sm text-muted-foreground mb-2 block">Trading Pair</Label>
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pair" />
                </SelectTrigger>
                <SelectContent>
                  {availablePairs.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Execution Panel */}
        <div className="glass-card p-6 animate-slide-up relative overflow-hidden">
          <div className="absolute inset-0 chart-grid opacity-30" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-glow">
                  <Crosshair className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{currentStrategy?.name || "Sniper Entry"}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPair}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="pulse-dot" />
                <span className="text-sm font-medium text-success ml-3">SCANNING</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-secondary/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="data-label">Entry Zone</span>
                </div>
                <p className="font-mono text-lg">
                  ${sniperData.entryZone.low.toFixed(2)} - ${sniperData.entryZone.high.toFixed(2)}
                </p>
              </div>

              <div className="bg-secondary/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-warning" />
                  <span className="data-label">Momentum</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-warning transition-all"
                      style={{ width: `${sniperData.momentum}%` }}
                    />
                  </div>
                  <span className="font-mono font-semibold">{sniperData.momentum}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-warning/5 rounded-xl border border-primary/20 mb-4">
              <div className="flex items-center gap-4">
                <div>
                  <span className="data-label">Volatility</span>
                  <p className={`font-semibold ${
                    sniperData.volatility === 'HIGH' ? 'text-destructive' : 
                    sniperData.volatility === 'MEDIUM' ? 'text-warning' : 'text-success'
                  }`}>
                    {sniperData.volatility}
                  </p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <span className="data-label">Trend</span>
                  <p className={`font-semibold ${
                    sniperData.trend === 'BULLISH' ? 'text-success' : 'text-destructive'
                  }`}>
                    {sniperData.trend}
                  </p>
                </div>
              </div>
              <Activity className="w-8 h-8 text-primary animate-pulse" />
            </div>

            <Button 
              variant="gold" 
              className="w-full" 
              size="lg"
              onClick={handleExecuteSniper}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Crosshair className="w-5 h-5" />
                  Execute {currentStrategy?.name || "Strategy"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Execution To-Do List */}
        <Collapsible open={todoOpen} onOpenChange={setTodoOpen}>
          <Card className="glass-card border-primary/20">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-primary" />
                    Execution Checklist
                    <Badge variant="outline" className="ml-2">
                      {todos.filter(t => t.completed).length}/{todos.length}
                    </Badge>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${todoOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {todos.map((todo) => (
                    <li 
                      key={todo.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => toggleTodo(todo.id)}
                    >
                      {todo.completed ? (
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={todo.completed ? "line-through text-muted-foreground" : ""}>
                        {todo.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Trade Configuration Dialog */}
      <Dialog open={showTradeDialog} onOpenChange={setShowTradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-primary" />
              {currentStrategy?.name} Configuration
            </DialogTitle>
            <DialogDescription>
              Configure your trade parameters for {selectedPair}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Strategy</span>
                <Badge variant="outline">{currentStrategy?.name}</Badge>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Current Price</span>
                <span className="font-mono font-semibold">${currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Trend</span>
                <span className={`font-semibold ${sniperData.trend === 'BULLISH' ? 'text-success' : 'text-destructive'}`}>
                  {sniperData.trend}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Direction</Label>
              <Select
                value={tradeConfig.direction}
                onValueChange={(v: "CALL" | "PUT") => {
                  setTradeConfig({ ...tradeConfig, direction: v });
                  setTodos(prev => prev.map(todo => 
                    todo.id === "4" ? { ...todo, completed: true } : todo
                  ));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CALL">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      CALL (Rise/Buy)
                    </span>
                  </SelectItem>
                  <SelectItem value="PUT">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      PUT (Fall/Sell)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stake">Stake Amount ($)</Label>
              <Input
                id="stake"
                type="number"
                min="0.35"
                step="0.01"
                value={tradeConfig.stake}
                onChange={(e) => setTradeConfig({ ...tradeConfig, stake: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={tradeConfig.duration}
                  onChange={(e) => setTradeConfig({ ...tradeConfig, duration: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={tradeConfig.durationUnit}
                  onValueChange={(v: "s" | "m" | "h") => setTradeConfig({ ...tradeConfig, durationUnit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s">Seconds</SelectItem>
                    <SelectItem value="m">Minutes</SelectItem>
                    <SelectItem value="h">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTradeDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="gold" 
              onClick={handleConfirmTrade}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Executing...
                </>
              ) : (
                <>
                  <Crosshair className="w-4 h-4 mr-2" />
                  Execute Trade
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
