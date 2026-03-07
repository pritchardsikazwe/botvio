import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, TrendingDown, AlertCircle, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TradeIdeaCardProps {
  signal: any;
  symbol: string;
}

function fmt(v: any, symbol: string): string {
  if (v == null) return "—";
  const n = Number(v);
  if (symbol.includes("JPY")) return n.toFixed(3);
  if (symbol.includes("BTC")) return n.toLocaleString("en-US", { minimumFractionDigits: 2 });
  if (symbol.includes("XAU") || symbol.includes("XAG")) return n.toFixed(2);
  return n.toFixed(5);
}

export function TradeIdeaCard({ signal, symbol }: TradeIdeaCardProps) {
  if (!signal || (signal.signal !== "buy" && signal.signal !== "sell")) {
    return (
      <Card className="bg-card border-border/50 rounded-xl">
        <CardContent className="p-4 text-center py-8">
          <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No active trade idea — Wait for setup confirmation</p>
        </CardContent>
      </Card>
    );
  }

  const isBuy = signal.signal === "buy";
  const entry = signal.entry_price ? Number(signal.entry_price) : null;
  const sl = signal.stop_loss ? Number(signal.stop_loss) : null;
  const tp1 = signal.take_profit_1 ? Number(signal.take_profit_1) : null;
  const tp2 = signal.take_profit_2 ? Number(signal.take_profit_2) : null;
  const rr = entry && sl && tp1 ? Math.abs(tp1 - entry) / Math.abs(entry - sl) : null;
  const conf = signal.confidence ? Math.round(signal.confidence) : null;

  const handleCopy = () => {
    const text = `${symbol} — ${signal.signal.toUpperCase()}\nEntry: ${fmt(entry, symbol)}\nSL: ${fmt(sl, symbol)}\nTP1: ${fmt(tp1, symbol)}${tp2 ? `\nTP2: ${fmt(tp2, symbol)}` : ""}${rr ? `\nR:R — 1:${rr.toFixed(1)}` : ""}\n\nPowered by Botvio`;
    navigator.clipboard.writeText(text);
    toast.success("Signal copied!");
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `📊 *${symbol}* — *${signal.signal.toUpperCase()}*\nEntry: ${fmt(entry, symbol)}\nSL: ${fmt(sl, symbol)}\nTP1: ${fmt(tp1, symbol)}${tp2 ? `\nTP2: ${fmt(tp2, symbol)}` : ""}${rr ? `\nR:R — 1:${rr.toFixed(1)}` : ""}\n\n_Powered by Botvio_`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Card className={`rounded-xl border ${isBuy ? "border-success/30" : "border-destructive/30"}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Trade Idea
          </h3>
          <Badge className={`text-xs uppercase font-extrabold ${isBuy ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
            {isBuy ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {signal.signal}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-center">
            <div className="text-[9px] text-muted-foreground font-bold uppercase">Entry</div>
            <div className="text-sm font-extrabold text-foreground font-mono">{fmt(entry, symbol)}</div>
          </div>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2 text-center">
            <div className="text-[9px] text-muted-foreground font-bold uppercase">Stop Loss</div>
            <div className="text-sm font-extrabold text-destructive font-mono">{fmt(sl, symbol)}</div>
          </div>
          <div className="bg-success/10 border border-success/20 rounded-lg p-2 text-center">
            <div className="text-[9px] text-muted-foreground font-bold uppercase">TP1</div>
            <div className="text-sm font-extrabold text-success font-mono">{fmt(tp1, symbol)}</div>
          </div>
          {tp2 ? (
            <div className="bg-success/10 border border-success/20 rounded-lg p-2 text-center">
              <div className="text-[9px] text-muted-foreground font-bold uppercase">TP2</div>
              <div className="text-sm font-extrabold text-success font-mono">{fmt(tp2, symbol)}</div>
            </div>
          ) : (
            <div className="bg-muted/30 border border-border/30 rounded-lg p-2 text-center">
              <div className="text-[9px] text-muted-foreground font-bold uppercase">R:R</div>
              <div className={`text-sm font-extrabold font-mono ${rr && rr >= 2 ? "text-success" : rr && rr >= 1 ? "text-warning" : "text-muted-foreground"}`}>
                {rr ? `1:${rr.toFixed(1)}` : "—"}
              </div>
            </div>
          )}
        </div>

        {/* Confidence */}
        {conf != null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">Confidence</span>
              <span className="font-bold text-foreground">{conf}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${conf >= 70 ? "bg-success" : conf >= 50 ? "bg-warning" : "bg-destructive"}`}
                style={{ width: `${conf}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="text-xs font-bold" onClick={handleCopy}>
            <Copy className="h-3 w-3 mr-1" /> Copy Signal
          </Button>
          <Button size="sm" variant="outline" className="text-xs font-bold text-success border-success/30" onClick={handleWhatsApp}>
            <MessageCircle className="h-3 w-3 mr-1" /> Share
          </Button>
        </div>

        <p className="text-[9px] text-muted-foreground text-center italic">
          ⚠️ This is analysis, not financial advice.
        </p>
      </CardContent>
    </Card>
  );
}
