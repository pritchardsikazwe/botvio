import { TradingOverview } from "@/components/dashboard/TradingOverview";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Bot, Copy, Settings, ShieldCheck, Users, Wallet, ArrowRight, Cloud, Activity, Zap, Radio, ChartNoAxesCombined, Layers3, ExternalLink, House, Smartphone, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FollowerTradeCopyPanel } from "@/components/tradecopy/FollowerTradeCopyPanel";
import { ProviderTradingAccountCard } from "@/components/tradecopy/ProviderTradingAccountCard";
import { TradeCopyAccountDashboard } from "@/components/tradecopy/TradeCopyAccountDashboard";
import { BotvioRobotPromo } from "@/components/robot/BotvioRobotPromo";
import { Mt5AutoExecuteCard } from "@/components/broker/Mt5AutoExecuteCard";
import { useMyCopySubscriptions, useMyCopiedTrades, useTradingAccounts } from "@/hooks/useBotvio";
import { useEntitlements, isEntitlementActive } from "@/hooks/useEntitlements";
import { useTradeCopyAccounts, tradecopy } from "@/hooks/useTradeCopy";
import { CopyTradingRoleGuide } from "@/components/tradecopy/CopyTradingRoleGuide";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const money = (value: number) => `${value >= 0 ? "+" : "-"}$${Math.abs(value).toFixed(2)}`;

export const FollowerDashboard = () => {
  const { data: subscriptions, isLoading: subscriptionsLoading } = useMyCopySubscriptions();
  const { data: copiedTrades, isLoading: tradesLoading } = useMyCopiedTrades();
  const active = (subscriptions ?? []).filter((s) => s.status === "active");
  const pnl = (copiedTrades ?? []).reduce((sum, trade) => sum + Number(trade.profit_loss ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-7xl space-y-5 px-4 py-6">
        <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="outline" className="mb-2 border-primary/30 text-primary">YOUR COPY TRADING</Badge>
              <h1 className="text-2xl font-bold">My Copy Trading</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Connect the account that will receive trades, choose Botvio Robot or an approved provider, then review your settings and status below.
              </p>
            </div>
            <Button asChild><Link to="/copy-trading">Find a provider <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">Active Deriv subscriptions</p>
              <p className="mt-1 text-2xl font-bold">{subscriptionsLoading ? "…" : active.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">Recorded copied trades</p>
              <p className="mt-1 text-2xl font-bold">{tradesLoading ? "…" : copiedTrades?.length ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">Recorded P/L</p>
              <p className={`mt-1 text-2xl font-bold ${pnl >= 0 ? "text-success" : "text-destructive"}`}>{tradesLoading ? "…" : money(pnl)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Based on recorded copied trades, not a live account balance.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">1. Connect and manage your follower account</h2>
            <p className="text-sm text-muted-foreground">Connect MT5, choose what to copy, adjust settings, and use Start, Pause or Emergency Stop. Demo testing is recommended first.</p>
          </div>
          <FollowerTradeCopyPanel />
        </section>

        <details className="group rounded-xl border border-border/60 bg-card p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold">
            <span className="flex items-center justify-between gap-3">
              Account connection status and open orders
              <span className="text-xs font-normal text-muted-foreground group-open:hidden">Show details</span>
              <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Hide details</span>
            </span>
          </summary>
          <div className="mt-4">
            <TradeCopyAccountDashboard role="slave" />
          </div>
        </details>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">2. Existing Deriv copy subscriptions</h2>
            <p className="text-sm text-muted-foreground">These are separate from MT5 TradeCopy connections.</p>
          </div>
          <Card className="glass-card">
            <CardContent className="space-y-2 pt-4">
              {subscriptionsLoading ? (
                <p className="text-sm text-muted-foreground">Loading subscriptions…</p>
              ) : active.length === 0 ? (
                <div className="rounded-lg border border-border/60 p-4 text-center">
                  <p className="text-sm font-medium">No active Deriv copy subscriptions</p>
                  <p className="mt-1 text-xs text-muted-foreground">To follow a Deriv provider, browse the marketplace and complete its setup.</p>
                  <Button className="mt-3" size="sm" asChild><Link to="/copy-trading">Browse providers</Link></Button>
                </div>
              ) : active.map((sub) => (
                <div key={sub.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-semibold">{sub.provider?.display_name ?? "Provider"}</p>
                    <p className="text-xs text-muted-foreground">{sub.copy_mode ?? "fixed"} copy · {sub.subscriber_trading_account?.label ?? "Connected account"}</p>
                  </div>
                  <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Active</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            Copy trading involves risk. Start with a Demo account and check the selected account, lot size and risk limits before enabling copying.
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export const ProviderCommandCenter = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto max-w-7xl space-y-5 px-4 py-6">
      <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-7">
        <Badge variant="outline" className="mb-2 border-primary/30 text-primary">PROVIDER CONTROL CENTER</Badge>
        <h1 className="text-2xl font-bold">Provider Trading</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Connect your MT5 master through TradeCopy Cloud and manage the provider account used for follower copying.
        </p>
      </section>
      <CopyTradingRoleGuide role="provider" />
      <TradeCopyAccountDashboard role="master" />
      <ProviderTradingAccountCard />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card"><CardHeader><CardTitle className="text-sm">Marketplace</CardTitle><CardDescription>Publish and manage your provider profile.</CardDescription></CardHeader><CardContent><Button asChild variant="outline" className="w-full"><Link to="/copy-trading/become-provider"><Users className="mr-2 h-4 w-4" /> Provider settings</Link></Button></CardContent></Card>
        <Card className="glass-card"><CardHeader><CardTitle className="text-sm">Copy marketplace</CardTitle><CardDescription>See how your strategy is presented to followers.</CardDescription></CardHeader><CardContent><Button asChild variant="outline" className="w-full"><Link to="/copy-trading"><Copy className="mr-2 h-4 w-4" /> Open marketplace</Link></Button></CardContent></Card>
        <Card className="glass-card"><CardHeader><CardTitle className="text-sm">Connections</CardTitle><CardDescription>Manage Deriv and MT5 accounts.</CardDescription></CardHeader><CardContent><Button asChild variant="outline" className="w-full"><Link to="/connections"><Wallet className="mr-2 h-4 w-4" /> Broker connections</Link></Button></CardContent></Card>
      </div>
    </main>
  </div>
);

const errorText = (error: unknown) => (error instanceof Error ? error.message : "Request failed");

export const BotvioRobotDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const { data: entitlements, isLoading: entitlementsLoading, isError: entitlementsError, refetch: refetchEntitlements } = useEntitlements();
  const { data: tradingAccounts, isLoading: tradingAccountsLoading, isError: tradingAccountsError, error: tradingAccountsErr, refetch: refetchTradingAccounts } = useTradingAccounts();
  const { data: copySubscriptions } = useMyCopySubscriptions();
  const followerAccounts = useTradeCopyAccounts("slave");
  const masterAccounts = useTradeCopyAccounts("master");
  const activeEntitlements = (entitlements ?? []).filter(isEntitlementActive);
  const activeCopySubscriptions = (copySubscriptions ?? []).filter((item) => item.status === "active");
  const accountsWithTradeCopy = [...(followerAccounts.data ?? []), ...(masterAccounts.data ?? [])].filter((account) => !!account.tradecopy_user_id);
  const positionQueries = useQueries({
    queries: accountsWithTradeCopy.map((account) => ({
      queryKey: ["botvio-dashboard-open-orders", account.id],
      queryFn: () => tradecopy<{ orders: Record<string, unknown>[] }>("open_orders", { account_id: account.id }),
      enabled: !!user,
      refetchInterval: 15_000,
      staleTime: 5_000,
      retry: false,
    })),
  });
  const positions = accountsWithTradeCopy.flatMap((account, index) => {
    const query = positionQueries[index];
    return (query?.data?.orders ?? []).map((order, orderIndex) => ({
      key: `${account.id}-${String(order.ticket ?? order.order_id ?? order.id ?? orderIndex)}`,
      account: account.label || account.broker || "MT5 account",
      broker: `${account.broker || "MT5"} · ${account.account_role === "master" ? "Master" : "Follower"}`,
      symbol: String(order.symbol ?? order.symbol_name ?? "—"),
      side: String(order.side ?? order.type ?? order.action ?? "—").toUpperCase(),
      volume: order.lots ?? order.volume ?? order.lot ?? null,
      entry: order.openPrice ?? order.open_price ?? order.price_open ?? order.entry_price ?? null,
      pnl: order.profit ?? order.pnl ?? order.profit_loss ?? null,
      current: order.currentPrice ?? order.current_price ?? order.price_current ?? null,
      mock: query?.data?.mode === "mock",
    }));
  });
  const failedAccounts = accountsWithTradeCopy.flatMap((account, index) => positionQueries[index]?.isError ? [{ name: account.label || account.broker || "MT5 account", message: errorText(positionQueries[index].error) }] : []);
  const positionErrors = failedAccounts.length > 0;
  const anyMock = positionQueries.some((query) => query.data?.mode === "mock");
  const retryPositions = () => { followerAccounts.refetch(); masterAccounts.refetch(); positionQueries.forEach((query) => query.refetch()); };
  const positionLoading = followerAccounts.isLoading || masterAccounts.isLoading || positionQueries.some((query) => query.isLoading);

  if (authLoading) {
    return <div className="min-h-screen bg-background text-foreground"><Header /><div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking your session…</div></div>;
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-md px-4 py-20">
          <Card className="border-border bg-card text-card-foreground">
            <CardContent className="p-6 text-center">
              <Bot className="mx-auto h-10 w-10 text-success" />
              <h1 className="mt-3 text-xl font-bold">Sign in to open Botvio Robot</h1>
              <p className="mt-2 text-sm text-muted-foreground">Your subscriptions, trading accounts and open trades are private to your account.</p>
              <Button className="mt-5 w-full bg-success text-success-foreground hover:bg-success/90" onClick={() => setAuthOpen(true)}>Sign in</Button>
              <Button asChild variant="link" className="mt-2 text-success"><Link to="/signup">Create a free account</Link></Button>
            </CardContent>
          </Card>
        </main>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  return <TradingOverview
    access={activeEntitlements.map(item => ({ id: item.id, name: item.products?.name ?? "Active product", slug: item.products?.slug, endsAt: item.ends_at, href: item.products?.slug === "synthetic-hub" ? "/synthetic" : item.products?.slug === "weltrade-hub" ? "/weltrade" : item.products?.slug === "mt5-direct" ? "/connections" : "/botvio-robot" }))}
    accounts={(tradingAccounts ?? []) as unknown as import("@/components/dashboard/TradingOverview").OverviewAccount[]}
    positions={positions}
    accessLoading={entitlementsLoading} accountsLoading={tradingAccountsLoading} positionLoading={positionLoading}
    accessError={entitlementsError} accountsError={tradingAccountsError ? errorText(tradingAccountsErr) : null}
    anyMock={anyMock}
    positionError={positionErrors || followerAccounts.isError || masterAccounts.isError ? <div className="overview-state"><div><p>Open positions could not be checked.</p>{failedAccounts.map(f => <p key={f.name}>{f.name}: {f.message}</p>)}{followerAccounts.isError && <p>{errorText(followerAccounts.error)}</p>}{masterAccounts.isError && <p>{errorText(masterAccounts.error)}</p>}</div><Button size="sm" variant="outline" onClick={retryPositions}>Retry</Button></div> : null}
    retryAccess={() => { refetchEntitlements(); }} retryAccounts={() => { refetchTradingAccounts(); }} retryPositions={retryPositions}
    robotControls={<><TradeCopyAccountDashboard role="master" robot /><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/connections">Trading connections</Link></Button><Button asChild variant="outline"><Link to="/bots">AI Bots</Link></Button><Button asChild variant="outline"><Link to="/copy-trading/my">My Copy Trading</Link></Button></div><p className="text-xs text-muted-foreground">Review account mode, position sizing and copy settings before enabling live trading. A signal is not a guarantee of execution or profit.</p></>}
  />;
};

export const CopyTradingAdmin = () => {
  const providers = useQuery({
    queryKey: ["admin", "copy-trading", "providers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("providers").select("id,status,verified,total_subscribers,total_trades").order("updated_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const accounts = useQuery({
    queryKey: ["admin", "copy-trading", "accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trading_accounts").select("id,broker,platform,execution_provider,account_role,environment,connection_status,tradecopy_active,is_botvio_robot").order("updated_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
  const providerRows = providers.data ?? [];
  const accountRows = accounts.data ?? [];
  const pending = providerRows.filter((p) => p.status === "pending" || p.status === "review").length;
  const approved = providerRows.filter((p) => p.status === "approved").length;
  const tradeCopyRows = accountRows.filter((a) => a.execution_provider === "tradecopy");
  const legacyMt5Rows = accountRows.filter((a) => a.execution_provider !== "tradecopy" && (a.account_role === "master" || a.account_role === "slave" || a.account_role === "follower"));
  const masters = tradeCopyRows.filter((a) => a.account_role === "master").length;
  const followers = tradeCopyRows.filter((a) => a.account_role === "slave" || a.account_role === "follower").length;
  const live = tradeCopyRows.filter((a) => String(a.environment).toUpperCase() === "LIVE").length;
  const active = tradeCopyRows.filter((a) => a.tradecopy_active).length;

  const setProviderStatus = async (providerId: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("providers").update({ status, verified: status === "approved" }).eq("id", providerId);
    if (error) {
      toast.error(error.message);
      return;
    }
    await providers.refetch();
    toast.success(status === "approved" ? "Provider approved" : "Provider rejected");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-7xl space-y-5 px-4 py-6">
        <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-7">
          <Badge variant="outline" className="mb-2 border-primary/30 text-primary">BOTVIO ADMIN CONTROL CENTER</Badge>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Copy Trading Operations</h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                One admin workspace for Providers, Followers, Botvio Robot, Demo/Live controls and connection health.
                User credentials stay protected; admin works from status and operational metadata.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild><Link to="/connections">Trading Connections</Link></Button>
              <Button asChild variant="outline"><Link to="/botvio-robot">Botvio Robot</Link></Button>
            </div>
          </div>
        </section>

        <CopyTradingRoleGuide role="admin" />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Pending providers", pending],
            ["Approved providers", approved],
            ["MT5 masters", masters],
            ["MT5 followers", followers],
            ["Active copy routes", active],
          ].map(([label, value]) => (
            <Card key={String(label)} className="glass-card"><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></CardContent></Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm">Provider review queue</CardTitle><CardDescription>Review status before a Provider is used as an approved copy source.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {providers.isLoading ? <p className="text-sm text-muted-foreground">Loading providers…</p> :
                providerRows.length === 0 ? <p className="text-sm text-muted-foreground">No provider profiles found.</p> :
                providerRows.slice(0, 8).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                    <div>
                      <p className="text-sm font-semibold">{p.id.slice(0, 8)}…</p>
                      <p className="text-xs text-muted-foreground">{p.total_subscribers ?? 0} followers · {p.total_trades ?? 0} trades</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <Badge variant={p.status === "approved" ? "default" : "outline"}>{p.status ?? "unknown"}</Badge>
                      {(p.status === "pending" || p.status === "review") && (
                        <>
                          <Button size="sm" onClick={() => setProviderStatus(p.id, "approved")}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => setProviderStatus(p.id, "rejected")}>Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm">MT5 TradeCopy health</CardTitle><CardDescription>Only canonical TradeCopy accounts are shown here. Raw passwords and secrets are never displayed.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {accounts.isLoading ? <p className="text-sm text-muted-foreground">Loading accounts…</p> :
                tradeCopyRows.length === 0 ? <p className="text-sm text-muted-foreground">No TradeCopy MT5 accounts visible to this admin query.</p> :
                tradeCopyRows.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                    <div><p className="text-sm font-semibold">{a.broker ?? "MT5"} · {a.account_role ?? "unassigned"}</p><p className="text-xs text-muted-foreground">{a.environment ?? "demo"} · {a.connection_status ?? "unknown"}</p></div>
                    <div className="flex gap-1.5"><Badge variant={a.tradecopy_active ? "default" : "outline"}>{a.tradecopy_active ? "Active" : "Idle"}</Badge>{a.is_botvio_robot && <Badge variant="secondary">Robot</Badge>}</div>
                  </div>
                ))}
              {legacyMt5Rows.length > 0 && (
                <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs">
                  <p className="font-semibold text-warning-foreground">Legacy MT5 records detected: {legacyMt5Rows.length}</p>
                  <p className="mt-1 text-muted-foreground">They are excluded from TradeCopy counts and the new user workflow. Do not activate them for MT5 copying; migrate/review them separately before any cleanup.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-sm text-foreground">Demo-first operating rule</p>
              <p className="mt-1">Live accounts visible: {live}. Keep Live copying disabled until Provider, Follower and Botvio Robot flows have been verified end-to-end.</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-warning" />
          </CardContent>
        </Card>

        <ProviderTradingAccountCard robot />

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/copy-trading">Marketplace</Link></Button>
          <Button asChild variant="outline"><Link to="/copy-trading/my">Follower Dashboard</Link></Button>
          <Button asChild variant="outline"><Link to="/provider-dashboard">Provider Dashboard</Link></Button>
        </div>
      </main>
    </div>
  );
};
