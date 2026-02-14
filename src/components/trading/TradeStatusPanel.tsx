import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";

export interface TradeRecord {
  id: number;
  time: string;
  symbol: string;
  contractType: string;
  stake: number;
  status: "running" | "won" | "lost";
  pnl?: number;
  contractId?: number;
}

interface TradeStatusPanelProps {
  trades: TradeRecord[];
}

export const TradeStatusPanel = ({ trades }: TradeStatusPanelProps) => {
  const running = trades.filter(t => t.status === "running");
  const closed = trades.filter(t => t.status !== "running");
  const totalPnl = closed.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const wins = closed.filter(t => t.status === "won").length;
  const losses = closed.filter(t => t.status === "lost").length;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Trade Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-primary/10">
            <div className="text-lg font-bold">{running.length}</div>
            <div className="text-[10px] text-muted-foreground">Running</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-success/10">
            <div className="text-lg font-bold text-success">{wins}</div>
            <div className="text-[10px] text-muted-foreground">Won</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-destructive/10">
            <div className="text-lg font-bold text-destructive">{losses}</div>
            <div className="text-[10px] text-muted-foreground">Lost</div>
          </div>
        </div>

        {totalPnl !== 0 && (
          <div className={`text-center p-2 rounded-lg border ${totalPnl >= 0 ? 'border-success/20 bg-success/5' : 'border-destructive/20 bg-destructive/5'}`}>
            <span className="text-xs text-muted-foreground">Session P&L: </span>
            <span className={`font-bold ${totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </span>
          </div>
        )}

        {/* Trade List */}
        <ScrollArea className="h-[200px]">
          {trades.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No trades yet. Place a trade to see status here.</p>
          ) : (
            <div className="space-y-2">
              {trades.map(trade => (
                <div key={trade.id} className={`flex items-center gap-2 p-2 rounded-lg text-xs border ${
                  trade.status === "running" ? "border-primary/20 bg-primary/5" :
                  trade.status === "won" ? "border-success/20 bg-success/5" :
                  "border-destructive/20 bg-destructive/5"
                }`}>
                  {trade.status === "running" ? (
                    <Clock className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
                  ) : trade.status === "won" ? (
                    <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-destructive shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium truncate">{trade.symbol}</span>
                      <Badge variant="outline" className="text-[8px] px-1 py-0">{trade.contractType}</Badge>
                    </div>
                    <span className="text-muted-foreground">{trade.time} · ${trade.stake}</span>
                  </div>
                  <div className="text-right shrink-0">
                    {trade.status === "running" ? (
                      <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">Running</Badge>
                    ) : (
                      <span className={`font-bold ${trade.status === "won" ? "text-success" : "text-destructive"}`}>
                        {trade.pnl && trade.pnl >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
