import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Hash, TrendingUp, ArrowUpDown, Zap, BarChart3, 
  Timer, Target, Layers, ArrowRight, Crosshair, Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StrategyGuidePanel } from "@/components/trading/StrategyGuidePanel";
import { STRATEGY_GUIDES, TITLE_TO_MODE_KEY } from "@/lib/tradeModesStrategies";
import { TradeTip } from "@/components/trading/TradeTip";
import { DerivAffiliateButton } from "@/components/trading/DerivAffiliateButton";

const TRADE_MODES = [
  {
    title: "Digits",
    description: "Matches/Differs, Over/Under, Even/Odd",
    icon: <Hash className="h-6 w-6" />,
    badges: ["Botvio AI", "Fast"],
    gradient: "from-violet-500/20 to-purple-600/20",
    borderColor: "border-violet-500/30",
    iconColor: "text-violet-400",
    route: "/trade/style/digit-contracts",
    guide: "Predict the last digit of the price. Choose Matches, Differs, Over/Under, or Even/Odd.",
    tip: "Start with DIFFER — 90% baseline win rate. Use 5-tick duration for best results.",
    disclaimer: "Digit trading outcomes are based on statistical probability, not certainty.",
  },
  {
    title: "Multipliers",
    description: "Amplify gains with controlled risk",
    icon: <Layers className="h-6 w-6" />,
    badges: ["Botvio AI", "All Markets"],
    gradient: "from-blue-500/20 to-cyan-600/20",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
    route: "/trade/style/multipliers",
    guide: "Trade with leverage (10x–1000x). Set stake, multiplier, SL/TP.",
    tip: "Always set Stop Loss. Higher multipliers = higher risk. Start with 10x-50x.",
    disclaimer: "Multipliers amplify both profits AND losses. You can lose your entire stake.",
  },
  {
    title: "Rise / Fall",
    description: "Predict short-term direction",
    icon: <TrendingUp className="h-6 w-6" />,
    badges: ["Hauza Sniper", "Beginner"],
    gradient: "from-emerald-500/20 to-green-600/20",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    route: "/trade/style/rise-fall-scalping",
    guide: "Predict if price rises or falls within your chosen duration.",
    tip: "Best for trending markets. Use 3-5 minute durations for higher accuracy.",
    disclaimer: "Past trends do not guarantee future direction.",
  },
  {
    title: "Higher / Lower",
    description: "Will price end higher or lower?",
    icon: <ArrowUpDown className="h-6 w-6" />,
    badges: ["Timed", "Beginner"],
    gradient: "from-sky-500/20 to-indigo-600/20",
    borderColor: "border-sky-500/30",
    iconColor: "text-sky-400",
    route: "/trade/style/synthetic-indices",
    guide: "Predict if price ends higher or lower than barrier at expiry.",
    tip: "Look for clear support/resistance levels before entering.",
    disclaimer: "Barrier-based contracts carry additional risk from price gaps.",
  },
  {
    title: "Boom / Crash",
    description: "Catch spikes with precision timing",
    icon: <Zap className="h-6 w-6" />,
    badges: ["Advanced", "Volatile"],
    gradient: "from-orange-500/20 to-red-600/20",
    borderColor: "border-orange-500/30",
    iconColor: "text-orange-400",
    route: "/trade/style/boom-crash",
    guide: "Catch sudden spikes on Boom/Crash indices.",
    tip: "Patience is key — wait for spike droughts before entering.",
    disclaimer: "Boom/Crash indices are highly volatile. Use small stakes.",
  },
  {
    title: "Ticks",
    description: "Tick-by-tick price stream trading",
    icon: <Timer className="h-6 w-6" />,
    badges: ["Hauza Sniper", "Fast"],
    gradient: "from-pink-500/20 to-rose-600/20",
    borderColor: "border-pink-500/30",
    iconColor: "text-pink-400",
    route: "/trade/style/ticks",
    guide: "Watch live ticks and trade based on momentum.",
    tip: "Use 5-tick contracts. Watch for 3-tick directional alignment.",
    disclaimer: "Tick trading is ultra-fast — results can vary significantly.",
  },
  {
    title: "Accumulators",
    description: "Accumulate gains with each tick",
    icon: <BarChart3 className="h-6 w-6" />,
    badges: ["Hauza Sniper", "Steady"],
    gradient: "from-teal-500/20 to-emerald-600/20",
    borderColor: "border-teal-500/30",
    iconColor: "text-teal-400",
    route: "/trade/style/accumulators",
    guide: "Payout grows each tick price stays in range. Set Take Profit.",
    tip: "Best during calm markets. Set Take Profit to lock in gains early.",
    disclaimer: "Contract closes instantly if price moves outside range.",
  },
  {
    title: "Turbo",
    description: "Ultra-short contracts for fast results",
    icon: <Target className="h-6 w-6" />,
    badges: ["Advanced", "Speed"],
    gradient: "from-amber-500/20 to-yellow-600/20",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
    route: "/trade/style/turbo",
    guide: "Very short duration contracts (1–5 minutes).",
    tip: "Enter after a period of consolidation for best breakout results.",
    disclaimer: "Ultra-short durations have higher variance in outcomes.",
  },
];

export const TradeModesGrid = () => {
  const navigate = useNavigate();

  return (
    <TooltipProvider>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Crosshair className="h-6 w-6 text-primary" />
              Trade Modes
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Choose your trading style and start executing</p>
          </div>
          <DerivAffiliateButton label="Open Deriv Account" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRADE_MODES.map((mode) => (
            <Card
              key={mode.title}
              className={`group relative overflow-hidden border ${mode.borderColor} bg-gradient-to-br ${mode.gradient} hover:scale-[1.03] transition-all duration-300 cursor-pointer`}
              onClick={() => navigate(mode.route)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="absolute top-2 right-2 z-20 p-1 rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-colors"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed">
                  <p className="font-semibold mb-1">How to trade {mode.title}:</p>
                  <p>{mode.guide}</p>
                  {mode.tip && <p className="mt-1 text-primary">💡 {mode.tip}</p>}
                </TooltipContent>
              </Tooltip>

              <CardHeader className="pb-2 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-background/50 backdrop-blur-sm ${mode.iconColor}`}>
                    {mode.icon}
                  </div>
                  <CardTitle className="text-sm font-bold">{mode.title}</CardTitle>
                </div>
                <CardDescription className="text-[11px] mt-2 line-clamp-2">
                  {mode.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 relative z-10">
                <div className="flex flex-wrap gap-1 mb-2">
                  {mode.badges.map((b) => (
                    <Badge
                      key={b}
                      variant={b === "Hauza Sniper" ? "default" : "outline"}
                      className={`text-[9px] px-1.5 py-0 ${b === "Hauza Sniper" ? "bg-primary/80 text-primary-foreground" : ""}`}
                    >
                      {b}
                    </Badge>
                  ))}
                </div>
                {TITLE_TO_MODE_KEY[mode.title] && STRATEGY_GUIDES[TITLE_TO_MODE_KEY[mode.title]] && (
                  <StrategyGuidePanel guide={STRATEGY_GUIDES[TITLE_TO_MODE_KEY[mode.title]]} />
                )}
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-1.5 mt-3">
                  <button
                    className="px-2 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-[10px] font-semibold transition-colors border border-primary/20"
                    onClick={(e) => { e.stopPropagation(); navigate(mode.route); }}
                  >
                    Intermediate
                  </button>
                  <button
                    className="px-2 py-1.5 rounded-lg bg-warning/20 hover:bg-warning/30 text-warning text-[10px] font-semibold transition-colors border border-warning/20"
                    onClick={(e) => { e.stopPropagation(); navigate(mode.route); }}
                  >
                    ⚡ Fast
                  </button>
                  <button
                    className="px-2 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-semibold transition-colors border border-emerald-500/20"
                    onClick={(e) => { e.stopPropagation(); navigate(mode.route); }}
                  >
                    🖐 Manual
                  </button>
                  <button
                    className="px-2 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-[10px] font-semibold transition-colors border border-sky-500/20"
                    onClick={(e) => { e.stopPropagation(); navigate(mode.route + "?mode=auto"); }}
                  >
                    🤖 Auto
                  </button>
                </div>
                <button
                  className="w-full mt-1.5 px-2 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-[10px] font-semibold transition-colors border border-violet-500/20"
                  onClick={(e) => { e.stopPropagation(); navigate(mode.route + "?demo=true"); }}
                >
                  🎮 Demo
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Disclaimer */}
        <div className="mt-4 space-y-2">
          <TradeTip type="disclaimer" tip="⚠️ Trading binary options involves significant risk. You may lose some or all of your invested capital. Trade responsibly." />
          <TradeTip type="tip" tip="💡 Start with a Demo account to practice risk-free. Use the demo token above to get started instantly." />
        </div>
      </div>
    </TooltipProvider>
  );
};
