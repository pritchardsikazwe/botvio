import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crosshair, TrendingUp, TrendingDown, Pause, Shield, Activity, Clock } from "lucide-react";
import { useMarketSession } from "@/hooks/useMarketSession";
import { useDerivLiveSignal, type DerivSignalType } from "@/hooks/useDerivLiveSignal";
import { useHauzaBreakoutSignal } from "@/hooks/useHauzaBreakoutSignal";
import { usePersistLiveSignal } from "@/hooks/usePersistGoldLiveSignal";
import { useMt5HubExecution } from "@/hooks/useMt5HubExecution";
import { HubAutoMt5Toggle } from "@/components/trading/HubAutoMt5Toggle";

const SIGNAL_CONFIG: Record<DerivSignalType, {
  bg: string;
  border: string;
  text: string;
  glow: string;
  icon: typeof TrendingUp;
  pulse: string;
}> = {
  BUY: {
    bg: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    border: "border-emerald-500/50",
    text: "text-emerald-400",
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.3)]",
    icon: TrendingUp,
    pulse: "animate-[pulse_1.5s_ease-in-out_infinite]",
  },
  SELL: {
    bg: "from-red-500/20 via-red-500/10 to-transparent",
    border: "border-red-500/50",
    text: "text-red-400",
    glow: "shadow-[0_0_40px_rgba(239,68,68,0.3)]",
    icon: TrendingDown,
    pulse: "animate-[pulse_1.5s_ease-in-out_infinite]",
  },
  WAIT: {
    bg: "from-amber-500/20 via-amber-500/10 to-transparent",
    border: "border-amber-500/50",
    text: "text-amber-400",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.2)]",
    icon: Pause,
    pulse: "",
  },
  HOLD: {
    bg: "from-blue-500/20 via-blue-500/10 to-transparent",
    border: "border-blue-500/50",
    text: "text-blue-400",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.2)]",
    icon: Shield,
    pulse: "",
  },
};

interface Props {
  /** Display symbol e.g. "BTC/USD", "XAG/USD", "GBP/USD" */
  displaySymbol: string;
  /** Asset label e.g. "BITCOIN", "SILVER", "GBP/USD" */
  assetLabel: string;
  /** Symbol for market session lookup (e.g. "BTCUSD") */
  sessionSymbol: string;
  /** Persistence symbol stored in DB (e.g. "BTCUSD") */
  persistSymbol: string;
  /** Category for the signal — "crypto" | "commodities" | "forex" */
  category: string;
  /** Force-treat as 24/7 (e.g. crypto) */
  alwaysOpen?: boolean;
  /**
   * Use the Hauza pivot S/R + breakout engine (mirrors the chart overlay).
   * Enabled for index hubs (US30, NAS100, GER40) so entry signals fire on
   * breakouts / S/R rejections / HH-HL continuations directly off the chart.
   * The base Deriv engine still acts as a fallback when Hauza is on WAIT.
   */
  useHauzaBreakouts?: boolean;
}

export function AssetSignalButton({
  displaySymbol,
  assetLabel,
  sessionSymbol,
  persistSymbol,
  category,
  alwaysOpen,
  useHauzaBreakouts,
}: Props) {
  const { isMarketOpen, isLoading: sessionLoading } = useMarketSession(sessionSymbol);
  const effOpen = alwaysOpen ? true : isMarketOpen;

  const baseLive = useDerivLiveSignal(displaySymbol, 300);
  const hauzaLive = useHauzaBreakoutSignal(useHauzaBreakouts ? displaySymbol : null, 300);
  // Prefer Hauza when it has an actionable BUY/SELL; otherwise fall back to base engine.
  const live = useHauzaBreakouts && (hauzaLive.signal === "BUY" || hauzaLive.signal === "SELL")
    ? hauzaLive
    : baseLive;

  // Persist real BUY/SELL signals to DB so they appear on Hub + Home + /signals
  usePersistLiveSignal(live, !sessionLoading && effOpen, persistSymbol, category);

  // Auto-execute on MT5 Bridge EA (Gold, Bitcoin, Forex, Stocks, etc.)
  useMt5HubExecution({
    symbol: persistSymbol,
    live,
    enabled: !sessionLoading && effOpen,
    source: `hub-${category}`,
  });

  const state = useMemo(() => {
    if (!sessionLoading && !effOpen) {
      return {
        signal: "WAIT" as DerivSignalType,
        confidence: 0,
        reason: `${assetLabel} market is currently CLOSED. No signals are generated outside trading hours.`,
        strategy: "Market Closed",
      };
    }
    return {
      signal: live.signal,
      confidence: live.confidence,
      reason: live.reason,
      strategy: live.strategy,
    };
  }, [effOpen, sessionLoading, live, assetLabel]);

  const config = SIGNAL_CONFIG[state.signal];
  const Icon = effOpen ? config.icon : Clock;
  const labelMap: Record<DerivSignalType, string> = {
    BUY: `BUY ${assetLabel}`,
    SELL: `SELL ${assetLabel}`,
    WAIT: "WAIT",
    HOLD: "HOLD POSITION",
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${config.bg} ${config.border} border-2 ${config.glow} transition-all duration-500`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_70%)]" />
      <div className="relative p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Botvio Signal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className={`h-3 w-3 ${config.text} ${config.pulse}`} />
            <Badge variant="outline" className={`text-[10px] ${config.border} ${config.text} font-mono`}>
              {effOpen ? "LIVE" : "CLOSED"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 py-2">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.bg} border ${config.border} flex items-center justify-center ${config.pulse} transition-all duration-300`}>
            <Icon className={`h-10 w-10 ${config.text}`} />
          </div>
          <span className={`text-2xl font-black tracking-tight ${config.text}`}>
            {effOpen ? labelMap[state.signal] : "MARKET CLOSED"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  state.confidence >= 70 ? "bg-emerald-500" :
                  state.confidence >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${state.confidence}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${config.text}`}>{state.confidence}%</span>
          </div>
        </div>

        <div className="space-y-2 bg-background/30 rounded-lg p-3">
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{state.strategy}</Badge>
          <p className="text-xs text-muted-foreground leading-relaxed">{state.reason}</p>
        </div>

        {/* Per-instrument auto-send to MT5 */}
        <HubAutoMt5Toggle symbol={persistSymbol} label={`${assetLabel} (${displaySymbol})`} />

        <p className="text-[10px] text-muted-foreground/60 text-center">
          Signal based on Botvio AI strategy rules • Not financial advice • Always manage risk
        </p>
      </div>
    </Card>
  );
}
