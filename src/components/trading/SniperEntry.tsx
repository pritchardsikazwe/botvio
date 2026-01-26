import { Crosshair, Target, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SniperEntryProps {
  pair: string;
  currentPrice: number;
}

export const SniperEntry = ({ pair, currentPrice }: SniperEntryProps) => {
  const sniperData = {
    entryZone: { low: currentPrice * 0.998, high: currentPrice * 1.002 },
    momentum: 78,
    volatility: 'HIGH',
    trend: 'BULLISH',
    nextEntry: new Date(Date.now() + 300000), // 5 min
  };

  return (
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

        <Button variant="gold" className="w-full" size="lg">
          <Crosshair className="w-5 h-5" />
          Execute Sniper Entry
        </Button>
      </div>
    </div>
  );
};
