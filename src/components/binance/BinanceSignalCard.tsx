import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Target, Shield, Zap, Clock, ExternalLink } from "lucide-react";

const BINANCE_AFFILIATE = "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU";

export const BinanceSignalCard = ({ signal }: { signal: any }) => {
  const isBuy = signal.direction === "BUY" || signal.direction === "LONG";
  const isFutures = signal.strategy_name?.includes("Futures");
  const leverage = signal.reason?.match(/Leverage:\s*x?(\d+)/i)?.[1];

  return (
    <Card className={`border-l-4 ${isBuy ? "border-l-emerald-500" : "border-l-red-500"}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isBuy ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              {isBuy ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{signal.symbol}</span>
                {isFutures && <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-500">FUTURES</Badge>}
              </div>
              <span className={`text-sm font-semibold ${isBuy ? "text-emerald-500" : "text-red-500"}`}>
                {signal.direction} {leverage ? `x${leverage}` : ""}
              </span>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={signal.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">{signal.status}</Badge>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {new Date(signal.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Confidence:</span>
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${signal.confidence >= 75 ? "bg-emerald-500" : signal.confidence >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${signal.confidence}%` }} />
          </div>
          <span className={`text-sm font-mono font-bold ${signal.confidence >= 75 ? "text-emerald-500" : signal.confidence >= 50 ? "text-yellow-500" : "text-muted-foreground"}`}>{signal.confidence}%</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Target, label: "Entry", value: signal.entry_price, color: "text-primary", iconColor: "text-primary" },
            { icon: Shield, label: "SL", value: signal.stop_loss, color: "text-red-500", iconColor: "text-red-500" },
            { icon: Zap, label: "TP", value: signal.take_profit, color: "text-emerald-500", iconColor: "text-emerald-500" },
          ].map(({ icon: Icon, label, value, color, iconColor }) => (
            <div key={label} className="bg-secondary/50 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Icon className={`w-3 h-3 ${iconColor}`} />
                <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
              </div>
              <p className={`font-mono text-sm font-semibold ${color}`}>
                {value ? `$${Number(value).toLocaleString()}` : "—"}
              </p>
            </div>
          ))}
        </div>

        {signal.reason && (
          <p className="text-xs text-muted-foreground bg-secondary/30 rounded p-2">{signal.reason}</p>
        )}

        {/* Trade Now affiliate CTA */}
        <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs" asChild>
          <a href={`${BINANCE_AFFILIATE}&symbol=${signal.symbol?.replace("/", "")}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Trade on Binance
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};
