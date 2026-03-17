import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Shield,
  Zap,
  Brain,
  Timer
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { BrokerButtons } from "./BrokerButtons";
import { useSignalBrokers } from "@/hooks/useSignalBrokers";

interface ManualSignalCardProps {
  signal: {
    id: string;
    symbol: string;
    direction: string;
    entry_price: number;
    stop_loss: number | null;
    take_profit: number | null;
    timeframe: string;
    category: string;
    broker: string[];
    confidence: number | null;
    status: string;
    created_at: string;
    reason?: string | null;
    ai_win_probability?: number | null;
    explanation_json?: Record<string, unknown> | null;
    expiry_seconds?: number | null;
    best_expiry?: number | null;
    backup_expiry?: number | null;
    quality_score?: number | null;
  };
  compact?: boolean;
  showBrokerButtons?: boolean;
}

export const ManualSignalCard = ({ signal, compact = false, showBrokerButtons = true }: ManualSignalCardProps) => {
  const formatExpiryLabel = (seconds: number): string => {
    if (seconds <= 10) return `${seconds} ticks`;
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const isBuy = signal.direction.toUpperCase() === 'BUY' || signal.direction.toUpperCase() === 'CALL';
  const timeAgo = formatDistanceToNow(new Date(signal.created_at), { addSuffix: true });
  const { data: brokers } = useSignalBrokers();

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'synthetic': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'gold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'nasdaq': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'crypto': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return 'text-muted-foreground';
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getRiskLabel = (confidence: number | null) => {
    if (!confidence) return null;
    if (confidence >= 80) return { label: "Low Risk", color: "bg-success/20 text-success border-success/30" };
    if (confidence >= 60) return { label: "Medium Risk", color: "bg-warning/20 text-warning border-warning/30" };
    return { label: "High Risk", color: "bg-destructive/20 text-destructive border-destructive/30" };
  };

  const riskLabel = getRiskLabel(signal.confidence);

  if (compact) {
    return (
      <Card className="glass-card hover:border-primary/50 transition-all duration-300 overflow-hidden group">
        <div className={`h-1 ${isBuy ? 'bg-success' : 'bg-destructive'}`} />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isBuy ? (
                <div className="p-1.5 rounded-lg bg-success/20">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-destructive/20">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
              )}
              <span className="font-bold">{signal.symbol}</span>
            </div>
            <Badge variant="outline" className={getCategoryColor(signal.category)}>
              {signal.category}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Entry:</span>
              <span className="ml-2 font-mono font-semibold">{signal.entry_price}</span>
            </div>
            <div>
              <span className="text-muted-foreground">TP:</span>
              <span className="ml-2 font-mono text-success font-semibold">{signal.take_profit || 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </div>
            <Badge variant="secondary" className="text-xs">{signal.timeframe}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card hover:border-primary/50 transition-all duration-300 overflow-hidden group">
      {/* Direction indicator bar */}
      <div className={`h-1.5 ${isBuy ? 'bg-gradient-to-r from-success to-success/50' : 'bg-gradient-to-r from-destructive to-destructive/50'}`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isBuy ? (
              <div className="p-2 rounded-xl bg-success/20 border border-success/30">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-destructive/20 border border-destructive/30">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg">{signal.symbol}</h3>
              <p className={`text-sm font-semibold ${isBuy ? 'text-success' : 'text-destructive'}`}>
                {signal.direction.toUpperCase()}
                {(signal.best_expiry || signal.expiry_seconds) && (
                  <span className="text-muted-foreground font-normal ml-2">
                    · Best: {formatExpiryLabel(signal.best_expiry || signal.expiry_seconds || 60)}
                    {signal.backup_expiry && (
                      <span className="text-muted-foreground/60"> / Backup: {formatExpiryLabel(signal.backup_expiry)}</span>
                    )}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={getCategoryColor(signal.category)}>
              {signal.category}
            </Badge>
            <Badge variant={signal.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {signal.status}
            </Badge>
            {riskLabel && (
              <Badge variant="outline" className={`text-[10px] ${riskLabel.color}`}>
                {riskLabel.label}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price levels */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Zap className="h-3 w-3" />
              Entry
            </div>
            <p className="font-mono font-bold text-lg">{signal.entry_price}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-1.5 text-success text-xs mb-1">
              <Target className="h-3 w-3" />
              Take Profit
            </div>
            <p className="font-mono font-bold text-lg text-success">
              {signal.take_profit || 'TBA'}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-1.5 text-destructive text-xs mb-1">
              <Shield className="h-3 w-3" />
              Stop Loss
            </div>
            <p className="font-mono font-bold text-lg text-destructive">
              {signal.stop_loss || 'TBA'}
            </p>
          </div>
        </div>

        {/* AI Score & Confidence */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{signal.timeframe}</span>
            </div>
            {signal.confidence && (
              <div className={`flex items-center gap-1.5 ${getConfidenceColor(signal.confidence)}`}>
                <Brain className="h-4 w-4" />
                <span className="text-sm font-medium">{signal.confidence}%</span>
              </div>
            )}
            {signal.ai_win_probability && (
              <div className="flex items-center gap-1.5 text-primary">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">{Math.round(signal.ai_win_probability * 100)}% win prob</span>
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Reason/Analysis */}
        {signal.reason && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground">{signal.reason}</p>
          </div>
        )}

        {/* Explanation tags */}
        {signal.explanation_json && typeof signal.explanation_json === 'object' && (signal.explanation_json as any)?.reason_codes && (
          <div className="flex flex-wrap gap-1">
            {((signal.explanation_json as any).reason_codes as string[]).slice(0, 4).map((code: string) => (
              <Badge key={code} variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                {code.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        )}

        {/* Broker Buttons */}
        {showBrokerButtons && brokers && brokers.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <BrokerButtons
              brokers={brokers}
              signalId={signal.id}
              signalCategory={signal.category}
              signalSymbol={signal.symbol}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
