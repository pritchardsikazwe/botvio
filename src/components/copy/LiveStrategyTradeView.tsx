import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, ArrowDown, ArrowUp, CheckCircle2, Loader2, RefreshCw, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Live strategy trade view for the provider dashboard.
 * Read-only presentation of the provider's own open positions and the
 * per-follower copy execution status. No execution logic lives here.
 */

interface CopyRow {
  id: string;
  provider_trade_id: string;
  subscriber_user_id: string;
  stake: number | null;
  status: string;
  profit_loss: number | null;
  opened_at: string;
  broker_trade_id: string | null;
}

interface TradeRow {
  id: string;
  symbol: string;
  direction: string;
  stake: number | null;
  status: string;
  profit_loss: number | null;
  created_at: string;
  broker: string | null;
  broker_trade_id: string | null;
  duration: number | null;
  duration_unit: string | null;
}

function useLiveStrategyTrades(providerId?: string) {
  return useQuery({
    queryKey: ["provider_live_trades", providerId],
    enabled: !!providerId,
    refetchInterval: 10000,
    queryFn: async () => {
      const { data: trades, error } = await supabase
        .from("provider_trades")
        .select("*")
        .eq("provider_id", providerId!)
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;

      const rows = (trades ?? []) as unknown as TradeRow[];
      if (rows.length === 0) return { trades: rows, copies: [] as CopyRow[] };

      const { data: copies, error: copyError } = await supabase
        .from("copied_trades")
        .select("id, provider_trade_id, subscriber_user_id, stake, status, profit_loss, opened_at, broker_trade_id")
        .in("provider_trade_id", rows.map((t) => t.id));
      if (copyError) throw copyError;

      return { trades: rows, copies: (copies ?? []) as unknown as CopyRow[] };
    },
  });
}

const copyStatusMeta: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  open: { label: "Copied · open", className: "bg-primary/10 text-primary border-primary/20", icon: Loader2 },
  closed: { label: "Copied · closed", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  error: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

const money = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : `${v >= 0 ? "" : "-"}$${Math.abs(v).toFixed(2)}`;

export const LiveStrategyTradeView = ({ providerId }: { providerId?: string }) => {
  const { data, isLoading, isFetching, refetch } = useLiveStrategyTrades(providerId);

  const trades = data?.trades ?? [];
  const copies = data?.copies ?? [];
  const openTrades = trades.filter((t) => t.status === "open");
  const recentClosed = trades.filter((t) => t.status !== "open").slice(0, 5);
  const visible = [...openTrades, ...recentClosed];

  const copiesFor = (tradeId: string) => copies.filter((c) => c.provider_trade_id === tradeId);

  const totalCopies = copies.length;
  const failedCopies = copies.filter((c) => c.status === "error").length;
  const openCopies = copies.filter((c) => c.status === "open").length;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Live Strategy Trade View
          </CardTitle>
          <CardDescription>
            Your current positions and how each follower copy executed. Updates every 10 seconds.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-lg font-bold">{openTrades.length}</p>
            <p className="text-[11px] text-muted-foreground">Open positions</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-lg font-bold">{totalCopies}</p>
            <p className="text-[11px] text-muted-foreground">Copies recorded</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-lg font-bold text-primary">{openCopies}</p>
            <p className="text-[11px] text-muted-foreground">Copies running</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className={`text-lg font-bold ${failedCopies > 0 ? "text-destructive" : ""}`}>{failedCopies}</p>
            <p className="text-[11px] text-muted-foreground">Copy failures</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center py-8 text-sm text-muted-foreground">
            No positions yet. Trades you execute will appear here with live copy status.
          </p>
        ) : (
          <ScrollArea className="h-[420px] pr-3">
            <div className="space-y-3">
              {visible.map((trade) => {
                const tradeCopies = copiesFor(trade.id);
                return (
                  <div key={trade.id} className="rounded-lg border border-border/60 p-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${trade.direction === "BUY" ? "bg-success/20" : "bg-destructive/20"}`}>
                          {trade.direction === "BUY" ? (
                            <ArrowUp className="h-4 w-4 text-success" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{trade.symbol}</p>
                            <Badge variant="outline" className="text-[10px]">
                              {trade.direction}
                            </Badge>
                            {trade.broker && (
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {trade.broker}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(trade.created_at).toLocaleString()}
                            {trade.duration ? ` · ${trade.duration}${trade.duration_unit ?? ""}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Stake {money(trade.stake)}</p>
                        <div className="flex items-center gap-2 justify-end mt-1">
                          {trade.status === "open" ? (
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                              Running
                            </Badge>
                          ) : (
                            <span
                              className={`text-sm font-bold ${
                                (trade.profit_loss ?? 0) >= 0 ? "text-success" : "text-destructive"
                              }`}
                            >
                              {money(trade.profit_loss)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md bg-muted/40 p-2 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Users className="h-3 w-3" />
                        Copy execution status ({tradeCopies.length})
                      </div>
                      {tradeCopies.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">
                          No follower copies recorded for this position.
                        </p>
                      ) : (
                        tradeCopies.map((copy) => {
                          const meta = copyStatusMeta[copy.status] ?? {
                            label: copy.status,
                            className: "bg-muted text-muted-foreground border-border",
                            icon: Loader2,
                          };
                          const Icon = meta.icon;
                          return (
                            <div key={copy.id} className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon
                                  className={`h-3 w-3 shrink-0 ${copy.status === "open" ? "animate-spin" : ""}`}
                                />
                                <span className="font-mono truncate">
                                  Follower {copy.subscriber_user_id.slice(0, 8)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-muted-foreground">{money(copy.stake)}</span>
                                <Badge variant="outline" className={`text-[10px] ${meta.className}`}>
                                  {meta.label}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <p className="text-[11px] text-muted-foreground">
          Follower identities are anonymised. Figures shown are actual recorded values — no projections or
          guaranteed outcomes.
        </p>
      </CardContent>
    </Card>
  );
};
