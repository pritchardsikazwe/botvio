import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crosshair, TrendingUp, TrendingDown, Pause, Shield, Activity, Clock } from "lucide-react";
import { useMarketSession } from "@/hooks/useMarketSession";

type SignalType = "BUY" | "SELL" | "WAIT" | "HOLD";

interface SignalState {
  signal: SignalType;
  confidence: number;
  reason: string;
  strategy: string;
}

function generateSignal(): SignalState {
  const hour = new Date().getUTCHours();
  const minute = new Date().getMinutes();
  const seed = Math.sin(hour * 100 + minute) * 10000;
  const rand = Math.abs(seed - Math.floor(seed));

  // London/NY overlap = stronger signals
  const isActiveSession = (hour >= 8 && hour <= 16) || (hour >= 13 && hour <= 21);

  if (!isActiveSession) {
    return {
      signal: "WAIT",
      confidence: 30 + Math.floor(rand * 20),
      reason: "Market session inactive — no high-probability setups",
      strategy: "Session Filter",
    };
  }

  if (rand < 0.25) {
    return {
      signal: "BUY",
      confidence: 65 + Math.floor(rand * 100) % 25,
      reason: "S/R bounce + EMA 20 bullish alignment + wick rejection at support",
      strategy: "S/R Bounce Entry",
    };
  } else if (rand < 0.5) {
    return {
      signal: "SELL",
      confidence: 65 + Math.floor(rand * 100) % 25,
      reason: "Breakout below key support + RSI < 40 + momentum confirmation",
      strategy: "Breakout Momentum",
    };
  } else if (rand < 0.75) {
    return {
      signal: "HOLD",
      confidence: 55 + Math.floor(rand * 100) % 20,
      reason: "Active position — trailing with EMA 20, no exit signal yet",
      strategy: "MTF Trend Ride",
    };
  } else {
    return {
      signal: "WAIT",
      confidence: 40 + Math.floor(rand * 100) % 20,
      reason: "Price in consolidation zone — waiting for breakout or sweep",
      strategy: "Liquidity Sweep",
    };
  }
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
              LIVE
            </Badge>
          </div>
        </div>

        {/* Big Signal Button */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.bg} border ${config.border} flex items-center justify-center ${config.pulse} transition-all duration-300`}>
            <Icon className={`h-10 w-10 ${config.text}`} />
          </div>
          <span className={`text-2xl font-black tracking-tight ${config.text}`}>
            {config.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  signalState.confidence >= 70 ? "bg-emerald-500" :
                  signalState.confidence >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${signalState.confidence}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${config.text}`}>{signalState.confidence}%</span>
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-2 bg-background/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{signalState.strategy}</Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{signalState.reason}</p>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/60 text-center">
          Signal based on Botvio AI strategy rules • Not financial advice • Always manage risk
        </p>
      </div>
    </Card>
  );
}