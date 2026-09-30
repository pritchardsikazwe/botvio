import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, CircleOff, CircleCheck, Copy, RefreshCw, WalletCards, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tradecopy, TcAccount, useTradeCopyAccounts } from "@/hooks/useTradeCopy";

type Role = "master" | "slave";

function OrdersCount({ account }: { account: TcAccount }) {
  const q = useQuery({
    queryKey: ["tradecopy", "dashboard-orders", account.id],
    enabled: !!account.tradecopy_user_id,
    queryFn: () => tradecopy<{ orders: unknown[] }>("open_orders", { account_id: account.id }),
    refetchInterval: 10_000,
    staleTime: 5_000,
    retry: false,
  });
  return <>{q.isLoading ? "…" : q.data?.orders?.length ?? 0}</>;
}

function AccountRow({ account }: { account: TcAccount }) {
  const connected = account.connection_status === "connected";
  return (
    <div className="grid gap-3 rounded-xl border border-border/60 p-4 md:grid-cols-[1.5fr_1fr_auto_auto_auto_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {connected ? <CircleCheck className="h-4 w-4 text-success" /> : <CircleOff className="h-4 w-4 text-muted-foreground" />}
          <span className="truncate font-semibold">{account.label}</span>
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          {account.broker || "MT5"} · {account.login_id || "—"} · {account.server || "—"}
        </div>
      </div>
      <div className="text-xs">
        <div className="text-muted-foreground">Environment</div>
        <Badge variant="outline" className="mt-1">{account.environment}</Badge>
      </div>
      <div className="text-xs">
        <div className="text-muted-foreground">Balance</div>
        <div className="mt-1 font-semibold">—</div>
      </div>
      <div className="text-xs">
        <div className="text-muted-foreground">Equity</div>
        <div className="mt-1 font-semibold">—</div>
      </div>
      <div className="text-xs">
        <div className="text-muted-foreground">Free margin</div>
        <div className="mt-1 font-semibold">—</div>
      </div>
      <div className="text-xs">
        <div className="flex items-center gap-1 text-muted-foreground"><Copy className="h-3 w-3" /> Open orders</div>
        <div className="mt-1 font-semibold"><OrdersCount account={account} /></div>
      </div>
    </div>
  );
}

export function TradeCopyAccountDashboard({ role, robot = false }: { role: Role; robot?: boolean }) {
  const accounts = useTradeCopyAccounts(role, { robot });
  const list = accounts.data ?? [];

  const stats = useMemo(() => ({
    connected: list.filter((a) => a.connection_status === "connected").length,
    disconnected: list.filter((a) => a.connection_status !== "connected").length,
    active: list.filter((a) => a.tradecopy_active).length,
  }), [list]);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-primary" />
            {robot ? "Botvio Robot account overview" : role === "master" ? "Master account overview" : "Slave account overview"}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            TradeCopy-style account monitoring. Open orders refresh automatically every 10 seconds.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => accounts.refetch()} disabled={accounts.isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${accounts.isFetching ? "animate-spin" : ""}`} />
          Refresh accounts
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/60 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><WalletCards className="h-4 w-4" /> Accounts</div>
            <div className="mt-1 text-2xl font-bold">{list.length}</div>
          </div>
          <div className="rounded-xl border border-border/60 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><CircleCheck className="h-4 w-4 text-success" /> Connected</div>
            <div className="mt-1 text-2xl font-bold">{stats.connected}</div>
          </div>
          <div className="rounded-xl border border-border/60 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><CircleOff className="h-4 w-4" /> Disconnected</div>
            <div className="mt-1 text-2xl font-bold">{stats.disconnected}</div>
          </div>
          <div className="rounded-xl border border-border/60 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Zap className="h-4 w-4" /> Active</div>
            <div className="mt-1 text-2xl font-bold">{stats.active}</div>
          </div>
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Account money metrics:</span> TradeCopy's public integration information available to BOTVIO does not expose a verified balance/equity/free-margin endpoint yet, so these fields are intentionally shown as “—” rather than guessed.
        </div>

        {accounts.isLoading && <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">Loading TradeCopy accounts…</div>}
        {!accounts.isLoading && list.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No {role === "master" ? "master" : "follower"} accounts connected yet.
          </div>
        )}
        {list.map((account) => <AccountRow key={account.id} account={account} />)}
      </CardContent>
    </Card>
  );
}
