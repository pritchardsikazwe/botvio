import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDerivLiveTicks } from "@/hooks/useDerivLiveTicks";
import { ArrowRight, Activity, TrendingUp, Bitcoin, Gem, Coins, PoundSterling } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Hub = {
  label: string;
  symbol: string; // display symbol passed to useDerivLiveTicks
  route: string;
  icon: LucideIcon;
  accent: string; // tailwind text color
  bg: string;     // tailwind bg gradient
  border: string;
  decimals: number;
  tagline: string;
};

const HUBS: Hub[] = [
  {
    label: "Gold",
    symbol: "XAU/USD",
    route: "/gold",
    icon: Coins,
    accent: "text-warning",
    bg: "from-warning/15 via-card to-card",
    border: "border-warning/30 hover:border-warning/60",
    decimals: 2,
    tagline: "XAU/USD • Botvio AI scalp",
  },
  {
    label: "Silver",
    symbol: "XAG/USD",
    route: "/silver",
    icon: Gem,
    accent: "text-muted-foreground",
    bg: "from-muted/20 via-card to-card",
    border: "border-border hover:border-primary/50",
    decimals: 3,
    tagline: "XAG/USD • Botvio AI scalp",
  },
  {
    label: "Bitcoin",
    symbol: "BTC/USD",
    route: "/bitcoin",
    icon: Bitcoin,
    accent: "text-primary",
    bg: "from-primary/15 via-card to-card",
    border: "border-primary/30 hover:border-primary/60",
    decimals: 2,
    tagline: "BTC/USD • 24/7 scalp engine",
  },
  {
    label: "GBP/USD",
    symbol: "GBP/USD",
    route: "/gbpusd",
    icon: PoundSterling,
    accent: "text-success",
    bg: "from-success/15 via-card to-card",
    border: "border-success/30 hover:border-success/60",
    decimals: 5,
    tagline: "Cable • London scalp engine",
  },
];

function HubCard({ hub }: { hub: Hub }) {
  const navigate = useNavigate();
  const { tick, connected } = useDerivLiveTicks(hub.symbol);
  const Icon = hub.icon;

  // Track tick direction for subtle flash
  const lastPriceRef = useRef<number | null>(null);
  const [dir, setDir] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (!tick?.price) return;
    const last = lastPriceRef.current;
    if (last != null && tick.price !== last) {
      setDir(tick.price > last ? "up" : "down");
      const t = setTimeout(() => setDir(null), 600);
      lastPriceRef.current = tick.price;
      return () => clearTimeout(t);
    }
    lastPriceRef.current = tick.price;
  }, [tick?.price]);

  const priceText = tick?.price != null ? tick.price.toFixed(hub.decimals) : "—";

  return (
    <Card
      onClick={() => navigate(hub.route)}
      className={`cursor-pointer overflow-hidden bg-gradient-to-br ${hub.bg} ${hub.border} transition-all hover:scale-[1.02]`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-lg bg-background/40 flex items-center justify-center ${hub.accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground leading-tight">{hub.label}</div>
              <div className="text-[10px] text-muted-foreground">{hub.tagline}</div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[9px] px-1.5 py-0 ${connected ? "border-success/40 text-success" : "border-border text-muted-foreground"}`}
          >
            <Activity className="h-2.5 w-2.5 mr-1" />
            {connected ? "LIVE" : "…"}
          </Badge>
        </div>

        <div
          className={`font-mono text-xl font-extrabold tabular-nums transition-colors ${
            dir === "up" ? "text-success" : dir === "down" ? "text-destructive" : "text-foreground"
          }`}
        >
          {priceText}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={`w-full justify-between h-8 px-2 text-xs font-bold ${hub.accent}`}
          onClick={(e) => {
            e.stopPropagation();
            navigate(hub.route);
          }}
        >
          Open Trading Hub
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function LiveTradingHubCards() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Live Trading Hubs</h2>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
          Botvio AI • Auto-Posted Signals
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Tap any market to open its full trading desk — live charts, AI scalping signals, S/R overlays, and strategies.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {HUBS.map((h) => (
          <HubCard key={h.label} hub={h} />
        ))}
      </div>
    </div>
  );
}
