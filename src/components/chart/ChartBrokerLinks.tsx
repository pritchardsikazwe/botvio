import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, TrendingUp, Target, Shield, Zap, DollarSign, BarChart3, Clock, Globe } from "lucide-react";

const BINANCE_MAP: Record<string, string> = {
  "BTC/USD": "BTCUSDT",
  "ETH/USD": "ETHUSDT",
  "SOL/USD": "SOLUSDT",
  "BNB/USD": "BNBUSDT",
  "XRP/USD": "XRPUSDT",
  "DOGE/USD": "DOGEUSDT",
};

const DERIV_LINK = "https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804UC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827";
const EXNESS_LINK = "https://one.exness-track.com/a/ts1kvs1k";

const EXNESS_ADVANTAGES = [
  { icon: Zap, text: "Ultra-fast execution & tight spreads from 0.0 pips" },
  { icon: DollarSign, text: "Instant withdrawals — no waiting, no hidden fees" },
  { icon: Shield, text: "Regulated broker trusted by 800K+ active traders" },
];

const DERIV_ADVANTAGES = [
  { icon: Clock, text: "Trade 24/7 on synthetics — no market closures" },
  { icon: BarChart3, text: "Start with $1 — low barrier, high flexibility" },
  { icon: Globe, text: "Unique Derived indices unavailable elsewhere" },
];

interface ChartBrokerLinksProps {
  symbol: string;
}

export function ChartBrokerLinks({ symbol }: ChartBrokerLinksProps) {
  const binancePair = BINANCE_MAP[symbol];
  const isCrypto = !!binancePair;
  const isForexOrMetal = !isCrypto;

  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-primary" />
          Trade {symbol}
        </h3>

        {/* Primary CTA — Exness for Forex/Metals */}
        {isForexOrMetal && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-warning" />
                Trade {symbol} with Exness
              </span>
              <Badge className="bg-warning/20 text-warning border-0 text-[10px]">Recommended</Badge>
            </div>
            <ul className="space-y-1.5">
              {EXNESS_ADVANTAGES.map((adv, i) => {
                const Icon = adv.icon;
                return (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                    {adv.text}
                  </li>
                );
              })}
            </ul>
            <a href={EXNESS_LINK} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="w-full bg-warning hover:bg-warning/90 text-warning-foreground font-semibold">
                Open Exness Account →
              </Button>
            </a>
          </div>
        )}

        {/* Deriv — always show */}
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-destructive" />
              Trade {isCrypto ? symbol : "Synthetics"} on Deriv
            </span>
            {isCrypto && <Badge className="bg-destructive/20 text-destructive border-0 text-[10px]">24/7</Badge>}
          </div>
          <ul className="space-y-1.5">
            {DERIV_ADVANTAGES.map((adv, i) => {
              const Icon = adv.icon;
              return (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  {adv.text}
                </li>
              );
            })}
          </ul>
          <a href={DERIV_LINK} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold">
              Open Deriv Account →
            </Button>
          </a>
        </div>

        {/* Binance — crypto */}
        {isCrypto && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-yellow-500" />
                Trade {binancePair} on Binance
              </span>
              <Badge className="bg-yellow-500/20 text-yellow-600 border-0 text-[10px]">Spot & Futures</Badge>
            </div>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                World's largest crypto exchange by volume
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                Industry-leading security with SAFU fund protection
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                Lowest trading fees starting at 0.1%
              </li>
            </ul>
            <a href={`https://www.binance.com/en/trade/${binancePair}?ref=CPA_0047GJ3KHU`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                Trade {binancePair} on Binance →
              </Button>
            </a>
          </div>
        )}

        <p className="text-[9px] text-muted-foreground leading-relaxed">
          ⚠️ Trading involves risk. Capital is at risk. Links contain affiliate referrals.
        </p>
      </CardContent>
    </Card>
  );
}
