import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crosshair, TrendingUp, TrendingDown, Pause, Shield, Activity, Clock } from "lucide-react";
import { useMarketSession } from "@/hooks/useMarketSession";
import { useDerivLiveSignal, type DerivSignalType } from "@/hooks/useDerivLiveSignal";

type SignalType = DerivSignalType;

interface SignalState {
  signal: SignalType;
  confidence: number;
  reason: string;
  strategy: string;
}

const SIGNAL_CONFIG: Record<SignalType, {
  bg: string;
  border: string;
  text: string;
  glow: string;
  icon: typeof TrendingUp;
  pulse: string;
  label: string;
}> = {
  BUY: {
    bg: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    border: "border-emerald-500/50",
    text: "text-emerald-400",
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.3)]",
    icon: TrendingUp,
    pulse: "animate-[pulse_1.5s_ease-in-out_infinite]",
    label: "BUY GOLD",
  },
  SELL: {
    bg: "from-red-500/20 via-red-500/10 to-transparent",
    border: "border-red-500/50",
    text: "text-red-400",
    glow: "shadow-[0_0_40px_rgba(239,68,68,0.3)]",
    icon: TrendingDown,
    pulse: "animate-[pulse_1.5s_ease-in-out_infinite]",
    label: "SELL GOLD",
  },
  WAIT: {
    bg: "from-amber-500/20 via-amber-500/10 to-transparent",
    border: "border-amber-500/50",
    text: "text-amber-400",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.2)]",
    icon: Pause,
    pulse: "",
    label: "WAIT",
  },
  HOLD: {
    bg: "from-blue-500/20 via-blue-500/10 to-transparent",
    border: "border-blue-500/50",
    text: "text-blue-400",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.2)]",
    icon: Shield,
    pulse: "",
    label: "HOLD POSITION",
  },
};

export function GoldBotvioSignalButton() {
  const { isMarketOpen, isLoading: sessionLoading } = useMarketSession("XAUUSD");
  const [signalState, setSignalState] = useState<SignalState>(generateSignal);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Force WAIT state when market is closed
  const effectiveState: SignalState = useMemo(() => {
    if (!sessionLoading && !isMarketOpen) {
      return {
        signal: "WAIT",
        confidence: 0,
        reason: "Gold market is currently CLOSED. XAU/USD trades Mon 22:00 UTC – Fri 22:00 UTC. No signals generated outside trading hours.",
        strategy: "Market Closed",
      };
    }
    return signalState;
  }, [isMarketOpen, sessionLoading, signalState]);

  useEffect(() => {
    if (!isMarketOpen) return; // don't refresh signals when market closed
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setSignalState(generateSignal());
        setIsTransitioning(false);
      }, 400);
    }, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [isMarketOpen]);

  const config = SIGNAL_CONFIG[effectiveState.signal];
  const Icon = isMarketOpen ? config.icon : Clock;

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${config.bg} ${config.border} border-2 ${config.glow} transition-all duration-500 ${isTransitioning ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_70%)]" />
      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Botvio Signal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className={`h-3 w-3 ${config.text} ${config.pulse}`} />
            <Badge variant="outline" className={`text-[10px] ${config.border} ${config.text} font-mono`}>
              {isMarketOpen ? "LIVE" : "CLOSED"}
            </Badge>
          </div>
        </div>

        {/* Big Signal Button */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.bg} border ${config.border} flex items-center justify-center ${config.pulse} transition-all duration-300`}>
            <Icon className={`h-10 w-10 ${config.text}`} />
          </div>
          <span className={`text-2xl font-black tracking-tight ${config.text}`}>
            {isMarketOpen ? config.label : "MARKET CLOSED"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  effectiveState.confidence >= 70 ? "bg-emerald-500" :
                  effectiveState.confidence >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${effectiveState.confidence}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${config.text}`}>{effectiveState.confidence}%</span>
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-2 bg-background/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{effectiveState.strategy}</Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{effectiveState.reason}</p>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/60 text-center">
          Signal based on Botvio AI strategy rules • Not financial advice • Always manage risk
        </p>
      </div>
    </Card>
  );
}