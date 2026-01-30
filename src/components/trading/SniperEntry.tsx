import { useState } from "react";
import { Crosshair, Target, Zap, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeriv } from "@/contexts/DerivContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SniperEntryProps {
  pair: string;
  currentPrice: number;
}

export const SniperEntry = ({ pair, currentPrice }: SniperEntryProps) => {
  const { authorized, placeTrade } = useDeriv();
  const { user } = useAuth();
  const [isExecuting, setIsExecuting] = useState(false);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [tradeConfig, setTradeConfig] = useState({
    direction: "CALL" as "CALL" | "PUT",
    stake: "1",
    duration: "5",
    durationUnit: "m" as "s" | "m" | "h",
  });

  const sniperData = {
    entryZone: { low: currentPrice * 0.998, high: currentPrice * 1.002 },
    momentum: 78,
    volatility: 'HIGH' as const,
    trend: 'BULLISH' as const,
    nextEntry: new Date(Date.now() + 300000), // 5 min
  };

  const handleExecuteSniper = () => {
    if (!user) {
      toast.error("Please sign in to execute trades");
      return;
    }

    if (!authorized) {
      toast.error("Please connect to Deriv first");
      return;
    }

    // Open trade configuration dialog
    setShowTradeDialog(true);
  };

  const handleConfirmTrade = async () => {
    if (!authorized || !placeTrade) {
      toast.error("Deriv connection not available");
      return;
    }

    setIsExecuting(true);

    try {
      // Map pair to Deriv symbol format
      let derivSymbol = pair;
      if (pair === "XAUUSD") {
        derivSymbol = "frxXAUUSD";
      } else if (pair.includes("/")) {
        derivSymbol = "frx" + pair.replace("/", "");
      } else if (!pair.startsWith("frx") && !pair.startsWith("cry") && !pair.includes("_")) {
        derivSymbol = "frx" + pair;
      }

      // Calculate duration value based on unit
      let durationValue = parseInt(tradeConfig.duration);
      let durationUnit: "s" | "m" | "h" = tradeConfig.durationUnit;

      const result = await placeTrade({
        symbol: derivSymbol,
        contract_type: tradeConfig.direction,
        amount: parseFloat(tradeConfig.stake),
        duration: durationValue,
        duration_unit: durationUnit,
      });

      toast.success(
        `Sniper Entry Executed! ${tradeConfig.direction} $${tradeConfig.stake} on ${pair}`,
        {
          description: `Contract ID: ${result.contract_id}`,
        }
      );

      setShowTradeDialog(false);
    } catch (error: any) {
      console.error("Sniper entry error:", error);
      toast.error(error.message || "Failed to execute sniper entry");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      <div className="glass-card p-6 animate-slide-up relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 chart-grid opacity-30" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-glow">
                <Crosshair className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Sniper Entry</h3>
                <p className="text-sm text-muted-foreground">Hauza Strategy</p>
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
                Execute Sniper Entry
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Trade Configuration Dialog */}
      <Dialog open={showTradeDialog} onOpenChange={setShowTradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-primary" />
              Sniper Entry Configuration
            </DialogTitle>
            <DialogDescription>
              Configure your trade parameters for {pair}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex justify-between items-center">
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
                onValueChange={(v: "CALL" | "PUT") => setTradeConfig({ ...tradeConfig, direction: v })}
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
