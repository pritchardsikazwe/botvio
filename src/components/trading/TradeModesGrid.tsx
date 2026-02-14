import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Hash, TrendingUp, ArrowUpDown, Zap, BarChart3, 
  Timer, Target, Layers, ArrowRight, Crosshair, Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TRADE_MODES = [
  {
    title: "Digits",
    description: "Matches/Differs, Over/Under, Even/Odd",
    icon: <Hash className="h-6 w-6" />,
    badges: ["Hauza Sniper", "Fast"],
    gradient: "from-violet-500/20 to-purple-600/20",
    borderColor: "border-violet-500/30",
    iconColor: "text-violet-400",
    route: "/trade/style/digit-contracts",
    guide: "Predict the last digit of the price. Choose Matches (digit = your pick), Differs (digit ≠ your pick), Over/Under (digit above/below threshold), or Even/Odd. Set your stake, pick a digit 0–9, choose duration in minutes, then tap your prediction button.",
  },
  {
    title: "Multipliers",
    description: "Amplify gains with controlled risk",
    icon: <Layers className="h-6 w-6" />,
    badges: ["Hauza Sniper", "All Markets"],
    gradient: "from-blue-500/20 to-cyan-600/20",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
    route: "/trade/style/multipliers",
    guide: "Trade with leverage (10x–1000x). Select a multiplier, set your stake, optionally set Stop Loss & Take Profit in USD. Tap Up or Down. Your profit/loss is multiplied. No expiry — close anytime.",
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
    guide: "Predict if the price will rise or fall within your chosen duration. Set stake, duration (minutes), then tap Rise or Fall. Payout is shown before you buy. Simple and fast for beginners.",
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
    guide: "Predict if price will end higher or lower than a barrier price at contract expiry. Set stake, duration, then choose Higher or Lower. Good for ranging markets with clear support/resistance.",
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
    guide: "Trade Boom (sudden spike up) or Crash (sudden drop) indices. Use Rise/Fall contracts on Boom/Crash symbols. Timing is key — watch the tick stream and enter when you sense a spike is due.",
  },
  {
    title: "Ticks",
    description: "Tick-by-tick price stream trading",
    icon: <Timer className="h-6 w-6" />,
    badges: ["Fast", "Synthetic"],
    gradient: "from-pink-500/20 to-rose-600/20",
    borderColor: "border-pink-500/30",
    iconColor: "text-pink-400",
    route: "/trading",
    guide: "Watch live price ticks and trade based on tick patterns. Use the Trading Workspace for real-time tick data, pair selection, and strategy panels. Best for experienced traders who read price flow.",
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
    guide: "Your payout grows with each tick the price stays within a range. Set stake and optionally Take Profit. The contract auto-closes if price moves outside the accumulation range. Great for steady gains.",
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
    guide: "Very short duration contracts (1–5 minutes). Set stake, duration, and predict price direction. Fast execution, quick results. Best for traders who want rapid-fire trades with quick outcomes.",
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
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRADE_MODES.map((mode) => (
            <Card
              key={mode.title}
              className={`group relative overflow-hidden border ${mode.borderColor} bg-gradient-to-br ${mode.gradient} hover:scale-[1.03] transition-all duration-300 cursor-pointer`}
              onClick={() => navigate(mode.route)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Info tooltip */}
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
                <div className="flex flex-wrap gap-1 mb-3">
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
                <div className="flex items-center text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                  Trade Now <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};
