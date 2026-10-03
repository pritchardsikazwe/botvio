import { useCallback, useEffect, useState } from "react";
import { useDeriv } from "@/contexts/DerivContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, History, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const formatTime = (epoch?: number) => epoch ? new Date(epoch * 1000).toLocaleString() : "—";

export const DerivTradeHistory = () => {
  const { isDerivReady, accountId, accountType, balance, getTradeHistory } = useDeriv();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isDerivReady) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      setRows(await getTradeHistory(50));
    } catch (error: any) {
      setRows([]);
      toast.error(error?.message || "Unable to load Deriv trade history");
    } finally {
      setLoading(false);
    }
  }, [getTradeHistory, isDerivReady]);

  useEffect(() => { load(); }, [load, accountId]);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Trade History
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Live history for the currently selected Deriv account.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading || !isDerivReady}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        {!isDerivReady ? (
          <div className="rounded-lg border border-border/60 p-5 text-center text-sm text-muted-foreground">
            Connect a Deriv account to view its live trade history.
          </div>
        ) : rows.length === 0 && !loading ? (
          <div className="rounded-lg border border-border/60 p-5 text-center">
            <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No closed trades returned</p>
            <p className="text-xs text-muted-foreground mt-1">
              {accountId} · {accountType} · {balance?.currency ?? "USD"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((trade, index) => {
              const profit = Number(trade.profit ?? (Number(trade.sell_price ?? 0) - Number(trade.buy_price ?? 0)));
              const won = profit >= 0;
              const key = String(trade.transaction_id ?? trade.contract_id ?? index);
              return (
                <div key={key} className="rounded-lg border border-border/60 bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg ${won ? "bg-success/10" : "bg-destructive/10"}`}>
                        {won ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {trade.underlying ?? trade.symbol ?? "Deriv contract"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {trade.contract_type ?? "Trade"} · #{trade.contract_id ?? trade.transaction_id ?? "—"} · {formatTime(trade.purchase_time)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${won ? "text-success" : "text-destructive"}`}>
                        {profit >= 0 ? "+" : ""}{profit.toFixed(2)} {trade.currency ?? balance?.currency ?? ""}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {trade.status ?? (won ? "PROFIT" : "LOSS")}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] text-muted-foreground">
                    <span>Buy: {Number(trade.buy_price ?? 0).toFixed(2)}</span>
                    <span>Sell: {Number(trade.sell_price ?? 0).toFixed(2)}</span>
                    <span>Payout: {Number(trade.payout ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
