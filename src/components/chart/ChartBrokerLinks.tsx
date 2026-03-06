import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, TrendingUp, Target } from "lucide-react";

const BINANCE_MAP: Record<string, string> = {
  "BTC/USD": "BTCUSDT",
  "ETH/USD": "ETHUSDT",
  "SOL/USD": "SOLUSDT",
  "BNB/USD": "BNBUSDT",
  "XRP/USD": "XRPUSDT",
  "DOGE/USD": "DOGEUSDT",
};

const DERIV_LINK = "https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827";
const EXNESS_LINK = "https://one.exness-track.com/a/ts1kvs1k";
const BINANCE_BASE = "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU";

interface ChartBrokerLinksProps {
  symbol: string;
}

export function ChartBrokerLinks({ symbol }: ChartBrokerLinksProps) {
  const binancePair = BINANCE_MAP[symbol];
  const isCrypto = !!binancePair;
  const isForexOrMetal = !isCrypto;

  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-primary" />
          Trade {symbol}
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {/* Deriv — always show */}
          <a href={DERIV_LINK} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full justify-between hover:border-destructive/50 hover:bg-destructive/5">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-destructive" />
                <span className="font-semibold">Deriv</span>
              </span>
              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                Open Account →
              </Badge>
            </Button>
          </a>

          {/* Exness — forex/metals */}
          {isForexOrMetal && (
            <a href={EXNESS_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full justify-between hover:border-warning/50 hover:bg-warning/5">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-warning" />
                  <span className="font-semibold">Exness</span>
                </span>
                <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                  Trade {symbol} →
                </Badge>
              </Button>
            </a>
          )}

          {/* Binance — crypto */}
          {isCrypto && (
            <a href={`https://www.binance.com/en/trade/${binancePair}?ref=CPA_0047GJ3KHU`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full justify-between hover:border-yellow-500/50 hover:bg-yellow-500/5">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold">Binance</span>
                </span>
                <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/30">
                  Trade {binancePair} →
                </Badge>
              </Button>
            </a>
          )}
        </div>
        <p className="text-[9px] text-muted-foreground mt-2 leading-relaxed">
          ⚠️ Trading involves risk. Links contain affiliate referrals.
        </p>
      </CardContent>
    </Card>
  );
}
