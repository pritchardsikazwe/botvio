import { Target, Shield, Zap, Clock } from "lucide-react";
import { Signal } from "@/types/trading";
import { Badge } from "@/components/ui/badge";

interface SignalCardProps {
  signal: Signal;
}

export const SignalCard = ({ signal }: SignalCardProps) => {
  const isBuy = signal.type === 'BUY';
  const isSell = signal.type === 'SELL';

  return (
    <div className={`glass-card p-5 border-l-4 animate-fade-in ${
      isBuy ? 'border-l-success' : isSell ? 'border-l-destructive' : 'border-l-warning'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isBuy ? 'bg-success/10' : isSell ? 'bg-destructive/10' : 'bg-warning/10'
          }`}>
            <Zap className={`w-6 h-6 ${
              isBuy ? 'text-success' : isSell ? 'text-destructive' : 'text-warning'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-bold ${
                isBuy ? 'signal-buy' : isSell ? 'signal-sell' : 'text-warning'
              }`}>
                {signal.type}
              </h3>
              <Badge variant={signal.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                {signal.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{signal.strategy}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Clock className="w-3 h-3" />
            <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">Confidence: </span>
            <span className={`font-mono font-semibold ${
              signal.confidence >= 80 ? 'text-success' : signal.confidence >= 60 ? 'text-warning' : 'text-muted-foreground'
            }`}>
              {signal.confidence}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3 h-3 text-primary" />
            <span className="data-label">Entry</span>
          </div>
          <p className="font-mono font-semibold text-primary">${signal.entry.toFixed(2)}</p>
        </div>

        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3 h-3 text-destructive" />
            <span className="data-label">Stop Loss</span>
          </div>
          <p className="font-mono font-semibold text-destructive">${signal.stopLoss.toFixed(2)}</p>
        </div>

        {signal.takeProfit.slice(0, 2).map((tp, index) => (
          <div key={index} className="bg-secondary/50 rounded-lg p-3">
            <span className="data-label">TP{index + 1}</span>
            <p className="font-mono font-semibold text-success">${tp.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
