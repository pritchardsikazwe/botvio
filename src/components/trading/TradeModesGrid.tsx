import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Hash, TrendingUp, ArrowUpDown, Zap, BarChart3, 
  Timer, Target, Layers 
} from "lucide-react";

const TRADE_MODES = [
  {
    title: "Digits",
    description: "Matches/Differs, Over/Under, Even/Odd",
    icon: <Hash className="h-5 w-5" />,
    badges: ["Fast", "Synthetic"],
    route: "/trade/style/digit-contracts",
  },
  {
    title: "Multipliers",
    description: "Amplify gains with controlled risk",
    icon: <Layers className="h-5 w-5" />,
    badges: ["Medium", "All Markets"],
    route: "/trade/style/multipliers",
  },
  {
    title: "Rise / Fall",
    description: "Predict short-term direction",
    icon: <TrendingUp className="h-5 w-5" />,
    badges: ["Beginner", "Quick"],
    route: "/trade/style/rise-fall-scalping",
  },
  {
    title: "Higher / Lower",
    description: "Will price end higher or lower?",
    icon: <ArrowUpDown className="h-5 w-5" />,
    badges: ["Beginner", "Timed"],
    route: "/trade/style/synthetic-indices",
  },
  {
    title: "Boom / Crash",
    description: "Catch spikes with precision timing",
    icon: <Zap className="h-5 w-5" />,
    badges: ["Advanced", "Volatile"],
    route: "/trade/style/boom-crash",
  },
  {
    title: "Ticks",
    description: "Tick-by-tick price stream trading",
    icon: <Timer className="h-5 w-5" />,
    badges: ["Fast", "Synthetic"],
    route: "/",
  },
  {
    title: "Accumulators",
    description: "Accumulate gains with each tick",
    icon: <BarChart3 className="h-5 w-5" />,
    badges: ["Medium", "Steady"],
    route: "/trade/style/accumulators",
  },
  {
    title: "Turbo",
    description: "Ultra-short contracts for fast results",
    icon: <Target className="h-5 w-5" />,
    badges: ["Advanced", "Speed"],
    route: "/trade/style/turbo",
  },
];

export const TradeModesGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Trade Modes
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TRADE_MODES.map((mode) => (
          <Card
            key={mode.title}
            className="glass-card hover:border-primary/50 transition-all hover:scale-[1.02] cursor-pointer"
            onClick={() => navigate(mode.route)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {mode.icon}
                </div>
                <CardTitle className="text-sm">{mode.title}</CardTitle>
              </div>
              <CardDescription className="text-[11px] mt-1">
                {mode.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1">
                {mode.badges.map((b) => (
                  <Badge key={b} variant="outline" className="text-[9px] px-1.5 py-0">
                    {b}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
