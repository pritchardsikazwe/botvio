import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDerivLiveTicks } from "@/hooks/useDerivLiveTicks";
import { useDerivLiveSignal } from "@/hooks/useDerivLiveSignal";
import { ArrowRight, Activity, TrendingUp, Bitcoin, Gem, Coins, PoundSterling, ArrowUp, ArrowDown, Pause, Globe2, BarChart4, BarChart3, Landmark } from "lucide-react";
import { LineChart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
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
  {
    label: "US30",
    symbol: "OTC_DJI",
    route: "/us30",
    icon: BarChart3,
    accent: "text-[#3b82f6]",
    bg: "from-[#3b82f6]/15 via-card to-card",
    border: "border-[#3b82f6]/30 hover:border-[#3b82f6]/60",
    decimals: 2,
    tagline: "Dow Jones • US cash + futures",
  },
  {
    label: "NAS100",
    symbol: "OTC_NDX",
    route: "/nas100",
    icon: LineChart,
    accent: "text-[#8b5cf6]",
    bg: "from-[#8b5cf6]/15 via-card to-card",
    border: "border-[#8b5cf6]/30 hover:border-[#8b5cf6]/60",
    decimals: 2,
    tagline: "Nasdaq 100 • Tech cash + futures",
  },
  {
    label: "GER40",
    symbol: "OTC_DE40",
    route: "/ger40",
    icon: Landmark,
    accent: "text-[#f97316]",
    bg: "from-[#f97316]/15 via-card to-card",
    border: "border-[#f97316]/30 hover:border-[#f97316]/60",
    decimals: 2,
    tagline: "DAX 40 • Frankfurt / Eurex",
  },
];

function HubCard({ hub }: { hub: Hub }) {
  const navigate = useNavigate();
  const { tick, connected } = useDerivLiveTicks(hub.symbol);
  const live = useDerivLiveSignal(hub.symbol, 60);
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

  // Signal badge styling
  const sig = live.signal;
  const isBuy = sig === "BUY";
  const isSell = sig === "SELL";
  const sigClass = isBuy
    ? "bg-success/15 text-success border-success/40"
    : isSell
    ? "bg-destructive/15 text-destructive border-destructive/40"
    : "bg-muted/40 text-muted-foreground border-border";
  const SigIcon = isBuy ? ArrowUp : isSell ? ArrowDown : Pause;
  const conf = Math.round(live.confidence || 0);

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

        {/* Signal + Confidence row */}
        <div className="flex items-center justify-between gap-2 rounded-md bg-background/40 border border-border/50 px-2 py-1.5">
          <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0.5 ${sigClass}`}>
            <SigIcon className="h-3 w-3 mr-1" />
            {sig}
          </Badge>
          <div className="flex flex-col items-center leading-tight">
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Confidence</span>
            <span
              className={`text-sm font-extrabold tabular-nums ${
                conf >= 70 ? "text-success" : conf >= 50 ? "text-warning" : "text-muted-foreground"
              }`}
            >
              {conf}%
            </span>
          </div>
          <div className="w-10 text-right">
            <span className="text-[9px] text-muted-foreground">{live.strategy?.split(" ")[0] || "—"}</span>
          </div>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {HUBS.map((h) => (
          <HubCard key={h.label} hub={h} />
        ))}
      </div>

      {/* Quick-access chip rails: shown directly below the 4 main hub buttons */}
      <ShortcutRail
        title="Forex Pairs"
        subtitle="Top 10 most-traded"
        icon={Globe2}
        accentClass="text-primary"
        chipClass="border-primary/30 hover:bg-primary/10 hover:border-primary/60 hover:text-primary"
        items={[
          { label: "EUR/USD", route: "/eurusd" },
          { label: "USD/JPY", route: "/usdjpy" },
          { label: "AUD/USD", route: "/audusd" },
          { label: "USD/CAD", route: "/usdcad" },
          { label: "USD/CHF", route: "/usdchf" },
          { label: "EUR/GBP", route: "/eurgbp" },
          { label: "EUR/JPY", route: "/eurjpy" },
          { label: "NZD/USD", route: "/nzdusd" },
          { label: "USD/CNY", route: "/usdcny" },
        ]}
      />

      <ShortcutRail
        title="US Stocks"
        subtitle="Most-traded large caps"
        icon={BarChart4}
        accentClass="text-warning"
        chipClass="border-warning/30 hover:bg-warning/10 hover:border-warning/60 hover:text-warning"
        items={[
          { label: "NVDA", route: "/stocks/nvda" },
          { label: "TSLA", route: "/stocks/tsla" },
          { label: "AMD", route: "/stocks/amd" },
          { label: "MU", route: "/stocks/mu" },
          { label: "AAPL", route: "/stocks/aapl" },
          { label: "MSFT", route: "/stocks/msft" },
          { label: "AVGO", route: "/stocks/avgo" },
          { label: "AMZN", route: "/stocks/amzn" },
          { label: "META", route: "/stocks/meta" },
          { label: "GOOGL", route: "/stocks/googl" },
        ]}
      />

      <ShortcutRail
        title="Indices"
        subtitle="US30 · NAS100 · GER40"
        icon={LineChart}
        accentClass="text-success"
        chipClass="border-success/30 hover:bg-success/10 hover:border-success/60 hover:text-success"
        items={[
          { label: "US30 (Dow)", route: "/us30" },
          { label: "NAS100 (Nasdaq)", route: "/nas100" },
          { label: "GER40 (DAX)", route: "/ger40" },
        ]}
      />
    </div>
  );
}

type ShortcutItem = { label: string; route: string };

function ShortcutRail({
  title,
  subtitle,
  icon: Icon,
  accentClass,
  chipClass,
  items,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accentClass: string;
  chipClass: string;
  items: ShortcutItem[];
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${accentClass}`} />
          <span className="text-xs font-extrabold text-foreground">{title}</span>
          <span className="text-[10px] text-muted-foreground">· {subtitle}</span>
        </div>
        <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">
          {items.length} hubs
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <Link
            key={it.route}
            to={it.route}
            className={`inline-flex items-center gap-1 rounded-full border bg-background/40 px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors ${chipClass}`}
          >
            {it.label}
            <ArrowRight className="h-3 w-3 opacity-60" />
          </Link>
        ))}
      </div>
    </div>
  );
}
