import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Power, RefreshCw, Server } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { tradecopy, useFollowerCount, useTradeCopyAccounts, useTradeCopyAction, useRemoveTradeCopyAccount, TcAccount } from "@/hooks/useTradeCopy";
import { ConnectMt5Form } from "./ConnectMt5Dialog";
import { DiagnosticButton } from "./DiagnosticButton";
import { AdapterModeNotice, EnvBadge, StatusBadge } from "./ModeBadges";

function MasterRow({ a, robot }: { a: TcAccount; robot?: boolean }) {
  const act = useTradeCopyAction();
  const removeAccount = useRemoveTradeCopyAccount();
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
        <Button size="sm" variant={a.tradecopy_active ? "outline" : "default"} onClick={toggle} disabled={act.isPending || !a.tradecopy_user_id}>
          <Power className="mr-2 h-4 w-4" />{a.tradecopy_active ? "Deactivate" : "Activate"}
        </Button>
        <Button size="sm" variant="outline" onClick={switchEnv} disabled={act.isPending || a.tradecopy_active}>Switch to {a.environment === "DEMO" ? "LIVE" : "DEMO"}</Button>
        <DiagnosticButton accountId={a.id} disabled={!a.tradecopy_user_id} />
        <Button size="sm" variant="ghost" onClick={() => orders.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={act.isPending || removeAccount.isPending || a.tradecopy_active}
          onClick={async () => {
            if (!window.confirm(`Remove MT5 account ${a.label} (${a.login_id}) from Botvio? This removes its Botvio connection and TradeCopy registration; it does not close the broker account.`)) return;
            try {
              await removeAccount.mutateAsync(a.id);
              toast.success("MT5 account removed from Botvio");
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

/** Provider (or Botvio Robot) MT5 master account via TradeCopy. */
export function ProviderTradingAccountCard({ robot = false }: { robot?: boolean }) {
  const { user } = useAuth();
  const { data, isLoading, error } = useTradeCopyAccounts("master", { robot });
  const { data: providerMasters } = useTradeCopyAccounts("master", { robot: false });

  const title = robot ? "Botvio Robot — MT5 execution master" : "Provider — MT5 copy-trading master";
  const description = robot
    ? "This is Botvio's official MT5 master. Followers copy its MT5 trades through TradeCopy."
    : "This is the provider's MT5 master account. Followers can subscribe to this account.";

  return (
    <Card className="border-border/50">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
          {user && (
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              MT5 connection
            </span>
          )}
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-xs font-semibold">1. Deriv</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Use Deriv connection for Deriv trading/signals. It is separate from the MT5 TradeCopy connection.
            </p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="text-xs font-semibold">2. MT5 master</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect the exact MT5 login, trader password, broker and server that will provide the trades.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-xs font-semibold">3. Followers</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Followers connect their own MT5 accounts and choose this provider or Botvio Robot to copy.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Important:</span> Deriv and MT5 are different connection types.
          Do not enter a Deriv token in the MT5 form. For MT5 copy trading, use the MT5 account number, trader password and exact MT5 server.
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {user && (
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{robot ? "Connect Botvio Robot MT5" : "Connect Provider MT5"}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Add the MT5 login, trader password, broker and exact server here. The connection is saved inactive first; you activate copying separately after testing.
                </p>
              </div>
              <Badge variant="outline" className="border-primary/25 text-primary">DEMO FIRST</Badge>
            </div>
            <ConnectMt5Form role="master" robot={robot} existingMasters={robot ? (providerMasters ?? []) : []} />
          </div>
        )}
        <AdapterModeNotice />
        {!user && <p className="text-sm text-muted-foreground">Sign in to manage the provider MT5 master account.</p>}
        {isLoading && <Skeleton className="h-32 w-full" />}
        {error && <p className="text-sm text-destructive">Couldn't load MT5 master accounts. Please refresh.</p>}
        {data && data.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="font-medium">No MT5 master connected</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {robot ? "Connect Botvio Robot's MT5 master account first. It will start inactive in DEMO mode." : "Connect the provider's MT5 master account first. It will start inactive in DEMO mode."}
            </p>
          </div>
        )}
        {data?.map((a) => <MasterRow key={a.id} a={a} robot={robot} />)}
      </CardContent>
    </Card>
  );
}
