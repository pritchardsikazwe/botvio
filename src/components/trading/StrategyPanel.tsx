import { Brain, TrendingUp, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface Strategy {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  winRate: number;
}

export const StrategyPanel = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: 'hauza',
      name: 'Hauza Sniper',
      description: 'Precision entry points with high accuracy',
      icon: <Brain className="w-5 h-5" />,
      enabled: true,
      winRate: 87,
    },
    {
      id: 'sr',
      name: 'S/R Breakout',
      description: 'Support & Resistance level breaks',
      icon: <BarChart3 className="w-5 h-5" />,
      enabled: true,
      winRate: 72,
    },
    {
      id: 'momentum',
      name: 'Momentum Surge',
      description: 'High momentum continuation trades',
      icon: <TrendingUp className="w-5 h-5" />,
      enabled: false,
      winRate: 65,
    },
  ]);

  const toggleStrategy = (id: string) => {
    setStrategies(prev =>
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  };

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="data-label">Trading</span>
          <h3 className="text-lg font-bold">Active Strategies</h3>
        </div>
        <Button variant="ghost" size="icon">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className={`p-4 rounded-xl border transition-all ${
              strategy.enabled 
                ? 'bg-primary/5 border-primary/30' 
                : 'bg-secondary/30 border-border'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  strategy.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {strategy.icon}
                </div>
                <div>
                  <h4 className="font-semibold">{strategy.name}</h4>
                  <p className="text-sm text-muted-foreground">{strategy.description}</p>
                </div>
              </div>
              <Switch
                checked={strategy.enabled}
                onCheckedChange={() => toggleStrategy(strategy.id)}
              />
            </div>
            
            {strategy.enabled && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className={`font-mono font-semibold ${
                    strategy.winRate >= 80 ? 'text-success' : 
                    strategy.winRate >= 60 ? 'text-warning' : 'text-muted-foreground'
                  }`}>
                    {strategy.winRate}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      strategy.winRate >= 80 ? 'bg-success' : 
                      strategy.winRate >= 60 ? 'bg-warning' : 'bg-muted-foreground'
                    }`}
                    style={{ width: `${strategy.winRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
