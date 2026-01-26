import { ChevronUp, ChevronDown } from "lucide-react";
import { SupportResistance } from "@/types/trading";

interface SupportResistanceLevelsProps {
  levels: SupportResistance[];
  currentPrice: number;
}

export const SupportResistanceLevels = ({ levels, currentPrice }: SupportResistanceLevelsProps) => {
  const sortedLevels = [...levels].sort((a, b) => b.level - a.level);

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'STRONG': return 'bg-success';
      case 'MODERATE': return 'bg-warning';
      default: return 'bg-muted-foreground';
    }
  };

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="data-label">Key Levels</span>
          <h3 className="text-lg font-bold">Support & Resistance</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-muted-foreground">Strong</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">Weak</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sortedLevels.map((level, index) => {
          const isAbovePrice = level.level > currentPrice;
          const distancePercent = ((level.level - currentPrice) / currentPrice * 100).toFixed(2);

          return (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:border-primary/50 ${
                level.type === 'RESISTANCE' ? 'bg-destructive/5 border-destructive/20' : 'bg-success/5 border-success/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  level.type === 'RESISTANCE' ? 'bg-destructive/10' : 'bg-success/10'
                }`}>
                  {level.type === 'RESISTANCE' ? (
                    <ChevronUp className="w-4 h-4 text-destructive" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-success" />
                  )}
                </div>
                <div>
                  <p className="font-mono font-semibold">${level.level.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{level.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`text-sm font-mono ${isAbovePrice ? 'text-success' : 'text-destructive'}`}>
                    {isAbovePrice ? '+' : ''}{distancePercent}%
                  </p>
                  <p className="text-xs text-muted-foreground">{level.touches} touches</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStrengthColor(level.strength)}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
