import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface TradePlanBoxProps {
  signal: any;
  symbol: string;
}

function formatPrice(price: number | null, symbol: string): string {
  if (price == null) return "—";
  if (symbol.includes("JPY")) return price.toFixed(3);
  if (symbol.includes("BTC")) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol.includes("XAU") || symbol.includes("XAG")) return price.toFixed(2);
  return price.toFixed(5);
}

export function TradePlanBox({ signal, symbol }: TradePlanBoxProps) {
  if (!signal || (signal.signal !== "buy" && signal.signal !== "sell")) {
    return (
      <Card className="bg-card border-border/50 rounded-xl">
        <CardContent className="p-4 text-center">
          <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No active trade signal</p>
        </CardContent>
      </Card>
    );
  }

  const entry = signal.entry_price ? Number(signal.entry_price) : null;
  const sl = signal.stop_loss ? Number(signal.stop_loss) : null;
  const tp = signal.take_profit_1 ? Number(signal.take_profit_1) : null;

  const riskReward = entry && sl && tp
    ? Math.abs(tp - entry) / Math.abs(entry - sl)
    : null;

  const isBuy = signal.signal === "buy";

  const handleCopy = () => {
    const text = `${symbol} — ${signal.signal.toUpperCase()}\nEntry: ${formatPrice(entry, symbol)}\nSL: ${formatPrice(sl, symbol)}\nTP1: ${formatPrice(tp, symbol)}${riskReward ? `\nR:R — 1:${riskReward.toFixed(1)}` : ""}\n\nPowered by Botvio`;
    navigator.clipboard.writeText(text);
    toast.success("Trade setup copied!");
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `📊 *${symbol}* — *${signal.signal.toUpperCase()}*\n\n` +
      `Entry: ${formatPrice(entry, symbol)}\n` +
      `SL: ${formatPrice(sl, symbol)}\n` +
      `TP1: ${formatPrice(tp, symbol)}\n` +
      `${riskReward ? `R:R — 1:${riskReward.toFixed(1)}\n` : ""}` +
      `\n_Powered by Botvio_`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Card className={`rounded-xl border ${isBuy ? "border-success/30 shadow-[0_0_15px_-3px_hsl(var(--success)/0.12)]" : "border-destructive/30 shadow-[0_0_15px_-3px_hsl(var(--destructive)/0.12)]"}`}>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Trade Plan
        </h3>

        {/* Entry / SL / TP */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-primary/10 border border-primary/20 rounded-lg py-2 px-1">
            <div className="text-[9px] text-muted-foreground font-bold uppercase">Entry</div>
            <div className="text-sm font-extrabold text-foreground font-mono mt-0.5">
              {formatPrice(entry, symbol)}
            </div>
          </div>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg py-2 px-1">
            <div className="text-[9px] text-muted-foreground font-bold uppercase">Stop Loss</div>
            <div className="text-sm font-extrabold text-destructive font-mono mt-0.5">
              {formatPrice(sl, symbol)}
            </div>
          </div>
          <div className="bg-success/10 border border-success/20 rounded-lg py-2 px-1">
            <div className="text-[9px] text-muted-foreground font-bold uppercase">TP1</div>
            <div className="text-sm font-extrabold text-success font-mono mt-0.5">
              {formatPrice(tp, symbol)}
            </div>
          </div>
        </div>

        {/* Risk/Reward */}
        {riskReward != null && (
          <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
            <span className="text-xs text-muted-foreground font-medium">Risk / Reward</span>
            <span className={`text-sm font-extrabold font-mono ${riskReward >= 2 ? "text-success" : riskReward >= 1 ? "text-warning" : "text-destructive"}`}>
              1:{riskReward.toFixed(1)}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold border-primary/30 text-primary hover:bg-primary/10"
            onClick={handleCopy}
          >
            <Copy className="h-3.5 w-3.5 mr-1" /> Copy Setup
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold border-success/30 text-success hover:bg-success/10"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
