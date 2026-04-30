import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink, Rocket, TrendingUp, Coins, Bot, Zap } from "lucide-react";
import { Link } from "react-router-dom";

interface BrokerCard {
  id: string;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  badgeClass: string;
  url: string;
  ctaLabel: string;
  bullets: string[];
  Icon: typeof Rocket;
  iconClass: string;
  borderClass: string;
  gradientClass: string;
}

const BROKERS: BrokerCard[] = [
  {
    id: "deriv",
    name: "Deriv",
    tagline: "Best for Synthetic Indices & Boom/Crash",
    description: "Open a Deriv account to trade 24/7 synthetic markets that never close.",
    badge: "Most Recommended",
    badgeClass: "bg-primary/15 text-primary border-primary/30",
    url: "https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827",
    ctaLabel: "Open Deriv Account",
    bullets: [
      "Trade Synthetic Indices",
      "Boom & Crash Indices",
      "Volatility Indices (VIX 75, 100)",
      "Jump Indices",
      "Gold & Forex Pairs",
    ],
    Icon: Rocket,
    iconClass: "text-primary",
    borderClass: "border-primary/30",
    gradientClass: "from-primary/15 to-primary/5",
  },
  {
    id: "weltrade",
    name: "Weltrade",
    tagline: "Best for Syntx & PainX/GainX",
    description: "Open a Weltrade account to access exclusive synthetic instruments.",
    badge: "Exclusive Indices",
    badgeClass: "bg-info/15 text-info border-info/30",
    url: "https://gowt.net/ib67505",
    ctaLabel: "Open Weltrade Account",
    bullets: [
      "Trade Syntx Indices",
      "Synthetic Fall & Rise Indices",
      "PainX Indices",
      "GainX Indices",
      "Spike Hunting Strategies",
    ],
    Icon: TrendingUp,
    iconClass: "text-info",
    borderClass: "border-info/30",
    gradientClass: "from-info/15 to-info/5",
  },
  {
    id: "exness",
    name: "Exness",
    tagline: "Best for Gold, Forex & Silver",
    description: "Open an Exness account to trade tight-spread Gold, Forex and Metals.",
    badge: "Lowest Spreads",
    badgeClass: "bg-warning/15 text-warning border-warning/30",
    url: "https://one.exness-track.com/a/ts1kvs1k",
    ctaLabel: "Open Exness Account",
    bullets: [
      "Trade Gold (XAU/USD)",
      "Major & Minor Currencies",
      "Silver (XAG/USD)",
      "Crypto CFDs",
      "Instant Withdrawals",
    ],
    Icon: Coins,
    iconClass: "text-warning",
    borderClass: "border-warning/30",
    gradientClass: "from-warning/15 to-warning/5",
  },
];

export const BrokerStarterCards = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Best Forex Brokers to Start With
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Open free accounts with our trusted partner brokers to follow our signals
          </p>
        </div>
        <Badge variant="outline" className="text-xs">Verified Partners</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BROKERS.map((broker) => {
          const { Icon } = broker;
          return (
            <Card
              key={broker.id}
              className={`glass-card ${broker.borderClass} hover:scale-[1.02] transition-all overflow-hidden flex flex-col`}
            >
              <div className={`h-1 bg-gradient-to-r ${broker.gradientClass}`} />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${broker.gradientClass}`}>
                    <Icon className={`h-5 w-5 ${broker.iconClass}`} />
                  </div>
                  <Badge className={`text-[10px] font-bold border ${broker.badgeClass}`}>
                    {broker.badge}
                  </Badge>
                </div>
                <CardTitle className="text-base leading-tight">{broker.name}</CardTitle>
                <CardDescription className="text-xs font-medium text-foreground/80">
                  {broker.tagline}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                <p className="text-xs text-muted-foreground">{broker.description}</p>
                <ul className="space-y-1.5 flex-1">
                  {broker.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className={`h-3.5 w-3.5 ${broker.iconClass} flex-shrink-0 mt-0.5`} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="gold"
                  size="sm"
                  className="w-full mt-2"
                  asChild
                >
                  <a href={broker.url} target="_blank" rel="noopener noreferrer sponsored">
                    {broker.ctaLabel}
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {/* Deriv MT5 Bridge Automation Poster */}
        <Card className="glass-card border-success/40 hover:scale-[1.02] transition-all overflow-hidden flex flex-col relative">
          <div className="h-1 bg-gradient-to-r from-success via-primary to-success" />
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 border border-success/40">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] font-bold text-success uppercase tracking-wide">Automated</span>
          </div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-success/20 to-primary/10">
                <Bot className="h-5 w-5 text-success" />
              </div>
              <Badge className="text-[10px] font-bold border bg-success/15 text-success border-success/30 mt-6">
                NEW
              </Badge>
            </div>
            <CardTitle className="text-base leading-tight flex items-center gap-1.5">
              Deriv MT5 Bridge
              <Zap className="h-3.5 w-3.5 text-warning" />
            </CardTitle>
            <CardDescription className="text-xs font-medium text-foreground/80">
              Auto-execute Botvio AI signals on your Deriv MT5
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col">
            <p className="text-xs text-muted-foreground">
              Connect your Deriv MT5 terminal via our Bridge EA — try it free on a demo account.
            </p>
            <ul className="space-y-1.5 flex-1">
              {[
                "1. Open Deriv MT5 Demo account",
                "2. Download Botvio Bridge EA",
                "3. Attach EA to any chart",
                "4. Enable auto-execute in dashboard",
                "5. Signals trade automatically 24/7",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
            <Button variant="gold" size="sm" className="w-full mt-2" asChild>
              <Link to="/connections">
                Setup MT5 Bridge
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
