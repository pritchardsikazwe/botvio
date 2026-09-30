import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Power, RefreshCw, Server } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { tradecopy, useFollowerCount, useTradeCopyAccounts, useTradeCopyAction, TcAccount } from "@/hooks/useTradeCopy";
import { ConnectMt5Dialog } from "./ConnectMt5Dialog";
import { DiagnosticButton } from "./DiagnosticButton";
import { AdapterModeNotice, EnvBadge, StatusBadge } from "./ModeBadges";

function MasterRow({ a, robot }: { a: TcAccount; robot?: boolean }) {
  const act = useTradeCopyAction();
  const followers = useFollowerCount([a.id]);
  const orders = useQuery({
    queryKey: ["tradecopy", "orders", a.id],
    enabled: !!a.tradecopy_user_id,
    queryFn: () => tradecopy<{ orders: unknown[] }>("open_orders", { account_id: a.id }),
    retry: false,
  });

  const toggle = async () => {
    const activate = !a.tradecopy_active;
    let confirmLive = false;
    if (activate && a.environment === "LIVE") {
      confirmLive = window.confirm("This is a LIVE account. Activating it will copy real trades to followers. Continue?");
      if (!confirmLive) return;
    }
    try {
      await act.mutateAsync({ action: "set_master_active", payload: { account_id: a.id, active: activate, confirm_live: confirmLive } });
      toast.success(activate ? "Master activated" : "Master deactivated");
    } catch (e) { toast.error((e as Error).message); }
  };

  const switchEnv = async () => {
    const next = a.environment === "DEMO" ? "LIVE" : "DEMO";
    if (next === "LIVE" && !window.confirm("Switch this account to LIVE mode? It will stay inactive until you activate it.")) return;
    try { await act.mutateAsync({ action: "set_environment", payload: { account_id: a.id, environment: next } }); toast.success(`Switched to ${next}`); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold">{a.label}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Server className="h-3 w-3" />{a.login_id} · {a.server}</div>
        </div>
        <div className="flex gap-1.5"><EnvBadge env={a.environment} /><StatusBadge status={a.connection_status} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-muted/30 p-2"><div className="text-muted-foreground">Master ID</div><div className="font-semibold">{a.tradecopy_user_id ?? "Not available"}</div></div>
        <div className="rounded-lg bg-muted/30 p-2"><div className="text-muted-foreground">Copy status</div><div className="font-semibold">{a.tradecopy_active ? "Active" : "Inactive"}</div></div>
        <div className="rounded-lg bg-muted/30 p-2"><div className="text-muted-foreground">Followers</div><div className="font-semibold">{followers.data ?? 0}</div></div>
        <div className="rounded-lg bg-muted/30 p-2"><div className="text-muted-foreground">Open trades</div><div className="font-semibold">{orders.isLoading ? "…" : orders.data ? orders.data.orders.length : "Not available"}</div></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={a.tradecopy_active ? "outline" : "default"} onClick={toggle} disabled={act.isPending || !a.tradecopy_user_id || (robot === undefined && false)}>
          <Power className="mr-2 h-4 w-4" />{a.tradecopy_active ? "Deactivate" : "Activate"}
        </Button>
        <Button size="sm" variant="outline" onClick={switchEnv} disabled={act.isPending || a.tradecopy_active}>Switch to {a.environment === "DEMO" ? "LIVE" : "DEMO"}</Button>
        <DiagnosticButton accountId={a.id} disabled={!a.tradecopy_user_id} />
        <Button size="sm" variant="ghost" onClick={() => orders.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>
    </div>
  );
}

/** Provider (or Botvio Robot) MT5 master account via TradeCopy. */
export function ProviderTradingAccountCard({ robot = false }: { robot?: boolean }) {
  const { user } = useAuth();
  const { data, isLoading, error } = useTradeCopyAccounts("master", { robot });

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-sm">{robot ? "Botvio Robot master account" : "Trading account (MT5 master)"}</CardTitle>
        {user && <ConnectMt5Dialog role="master" robot={robot} triggerLabel="Connect MT5 Master" />}
      </CardHeader>
      <CardContent className="space-y-3">
        <AdapterModeNotice />
        {!user && <p className="text-sm text-muted-foreground">Sign in to connect your MT5 master account.</p>}
        {isLoading && <Skeleton className="h-32 w-full" />}
        {error && <p className="text-sm text-destructive">Couldn't load accounts. Please refresh.</p>}
        {data && data.length === 0 && <p className="text-sm text-muted-foreground">No master account connected yet. Trades on your master account are copied to followers by TradeCopy — no Bridge EA or VPS needed.</p>}
        {data?.map((a) => <MasterRow key={a.id} a={a} robot={robot} />)}
      </CardContent>
    </Card>
  );
}
