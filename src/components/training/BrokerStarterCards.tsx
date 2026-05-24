import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink, Rocket, TrendingUp, Coins, Gift, Copy, Zap, BadgePercent, Wallet, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
                <div className="flex-1" />
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

        <OneWinRegisterCard />
      </div>
    </div>
  );
};

const PROMO_CODE = "ZED4429";
const ONE_WIN_URL = "https://1wskbe.life/?p=5gjo";

const OneWinRegisterCard = () => {
  const [copied, setCopied] = useState(false);

  const copyPromo = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      toast.success(`Promo code ${PROMO_CODE} copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy promo code");
    }
  };

  return (
    <Card className="glass-card border-warning/40 hover:scale-[1.02] transition-all overflow-hidden flex flex-col relative md:col-span-2 lg:col-span-3">
      <div className="h-1 bg-gradient-to-r from-warning via-primary to-warning" />
      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/20 border border-warning/40 z-10">
        <Gift className="h-3 w-3 text-warning" />
        <span className="text-[9px] font-bold text-warning uppercase tracking-wide">500% Bonus</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="relative bg-gradient-to-br from-warning/10 via-background to-primary/10 p-4 flex flex-col justify-between gap-4 border-b md:border-b-0 md:border-r border-warning/20">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-warning uppercase">1Win</p>
            <h4 className="text-2xl md:text-3xl font-black leading-tight mt-1">
              How to create an account on 1Win
            </h4>
            <p className="text-xs text-muted-foreground mt-2">
              Fast registration · Instant play · Mobile-first
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-2">
            {[
              { Icon: Zap, label: "Fast Payouts" },
              { Icon: BadgePercent, label: "High Multipliers" },
              { Icon: Wallet, label: "No Deposit / Withdrawal Fees" },
              { Icon: Sparkles, label: "Welcome Bonuses" },
            ].map(({ Icon, label }, i) => (
              <li
                key={i}
                className="flex items-center gap-2 p-2 rounded-md bg-background/60 border border-warning/20"
              >
                <Icon className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                <span className="text-[11px] font-semibold leading-tight">{label}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-md border border-warning/40 bg-background/70 p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
              Registration Form
            </p>
            <div className="space-y-1 text-[11px]">
              <p>• Currency: ZMW · Zambian Kwacha</p>
              <p>• Phone (+260) — your number</p>
              <p>• Email address</p>
              <p>• Password (8+ chars, 1 digit, upper &amp; lower case)</p>
              <p>
                • Add promo code:{" "}
                <span className="font-bold text-warning">{PROMO_CODE}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <CardHeader className="pb-3">
            <Badge className="w-fit text-[10px] font-bold border bg-warning/15 text-warning border-warning/30">
              STEP 1 · HOW TO REGISTER
            </Badge>
            <CardTitle className="text-base leading-tight mt-2">
              Create your 1Win account
            </CardTitle>
            <CardDescription className="text-xs font-medium text-foreground/80">
              Use promo code <span className="font-bold text-warning">{PROMO_CODE}</span> for a 500% bonus on your first 4 deposits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col">
            <ul className="space-y-1.5">
              {[
                "Click the registration link below",
                "Write your phone number",
                "Add your email address (Gmail preferred — needed for withdrawal verification)",
                "Create your password",
                `Click "Add promo code" and enter ${PROMO_CODE}`,
                'Finalize your registration by clicking "Register"',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-warning flex-shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-2 p-2 rounded-md border border-warning/30 bg-warning/5">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Promo code</p>
                <p className="text-sm font-bold text-warning truncate">{PROMO_CODE}</p>
              </div>
              <Button variant="outline" size="sm" onClick={copyPromo} className="flex-shrink-0">
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <Button variant="gold" size="sm" className="w-full mt-auto" asChild>
              <a href={ONE_WIN_URL} target="_blank" rel="noopener noreferrer sponsored">
                Register on 1Win
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};
