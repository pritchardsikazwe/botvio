import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tradecopy, type TcAccount } from "@/hooks/useTradeCopy";

type Position = { ticket: string; symbol: string; side: string; lots: number | null; openPrice: number | null; stopLoss: number | null; takeProfit: number | null; profit: number | null };
const value = (n: number | null | undefined) => n == null || !Number.isFinite(n) ? "Unavailable" : String(n);

/** Observations, not an assertion of protected risk or cloud pre-entry enforcement. */
export function CopyRiskCentre({ account }: { account: TcAccount }) {
  const query = useQuery({
    queryKey: ["tradecopy", "risk-observations", account.id],
    queryFn: () => tradecopy<{ connected: boolean; checkedAt?: string; openOrders: Position[]; recentHistory: Position[] }>("execution_status", { account_id: account.id }),
    enabled: !!account.tradecopy_user_id,
    refetchInterval: 15_000, retry: false,
  });
  const positions = query.data?.openOrders ?? [];
  const mock = query.data?.mode === "mock";
  const profitKnown = positions.every((p) => p.profit !== null && Number.isFinite(p.profit));
  const pnl = positions.reduce((sum, p) => sum + (p.profit ?? 0), 0);
  return <section className="space-y-3 border-t border-border pt-4" aria-label="Copy Trading Risk Centre">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert className="h-4 w-4 text-primary" />Copy Trading Risk Centre · {account.label}</h3>
      <Button size="icon" variant="ghost" aria-label="Refresh risk observations" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className="h-4 w-4" /></Button>
    </div>
    <p className="text-xs text-destructive">Risk enforcement not verified. Equity, contract specifications and TradeCopy pre-entry protection are unavailable.</p>
    <div className="grid gap-3 text-xs sm:grid-cols-3">
      <div><p className="text-muted-foreground">Account / connection</p><p>{account.environment} · {mock ? "Simulated" : query.isError ? "Read failed" : query.isLoading ? "Checking" : query.data?.connected ? "Position read available" : "Not connected"}</p></div>
      <div><p className="text-muted-foreground">Floating P/L</p><p>{query.data && !mock && profitKnown ? value(pnl) + " · account currency" : "Unavailable"}</p></div>
      <div><p className="text-muted-foreground">Open risk / daily drawdown</p><p>Unavailable / unavailable</p></div>
      <div><p className="text-muted-foreground">Daily circuit breaker</p><p>Not verified</p></div>
      <div><p className="text-muted-foreground">Provider health / last signal</p><p>Not verified / unavailable</p></div>
      <div><p className="text-muted-foreground">Last position check</p><p>{query.data?.checkedAt ? new Date(query.data.checkedAt).toLocaleString() : "Unavailable"}{query.isFetching ? " · refreshing" : ""}</p></div>
    </div>
    {query.isError && <p role="alert" className="text-xs text-destructive">{(query.error as Error).message}</p>}
    {query.data && !positions.length && <p className="text-xs text-muted-foreground">{mock ? "No simulated positions." : "No open positions reported at the last check."}</p>}
    {!!positions.length && <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-border"><th className="p-2">Ticket / market</th><th className="p-2">Side / lots</th><th className="p-2">SL / TP</th><th className="p-2">Protection</th></tr></thead><tbody>{positions.map((p) => <tr key={p.ticket} className="border-b border-border"><td className="p-2">{p.ticket}<br />{p.symbol}</td><td className="p-2">{p.side} / {value(p.lots)}</td><td className="p-2">{value(p.stopLoss)} / {value(p.takeProfit)}</td><td className="p-2">{mock ? "Simulated; unverified" : !p.stopLoss || !p.takeProfit ? "Missing SL/TP" : "Reported; risk unverified"}</td></tr>)}</tbody></table></div>}
  </section>;
}