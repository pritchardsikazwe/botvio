import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { Bot, Copy, Settings, ShieldCheck, Users, Wallet, ArrowRight, Cloud, Activity, Zap, Radio, ChartNoAxesCombined, Layers3, ExternalLink } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FollowerTradeCopyPanel } from "@/components/tradecopy/FollowerTradeCopyPanel";
import { TradeCopyCloudSignalPanel } from "@/components/tradecopy/TradeCopyCloudSignalPanel";
import { ProviderTradingAccountCard } from "@/components/tradecopy/ProviderTradingAccountCard";
import { TradeCopyAccountDashboard } from "@/components/tradecopy/TradeCopyAccountDashboard";
import { BotvioRobotPromo } from "@/components/robot/BotvioRobotPromo";
import { Mt5AutoExecuteCard } from "@/components/broker/Mt5AutoExecuteCard";
import { useMyCopySubscriptions, useMyCopiedTrades, useTradingAccounts } from "@/hooks/useBotvio";
import { useEntitlements, isEntitlementActive } from "@/hooks/useEntitlements";
import { useTradeCopyAccounts, tradecopy } from "@/hooks/useTradeCopy";
import { useAuth } from "@/contexts/AuthContext";
import { CopyTradingRoleGuide } from "@/components/tradecopy/CopyTradingRoleGuide";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const money = (value: number) => `${value >= 0 ? "+" : "-"}$${Math.abs(value).toFixed(2)}`;

export const FollowerDashboard = () => {
  const { data: subscriptions } = useMyCopySubscriptions();
  const { data: copiedTrades } = useMyCopiedTrades();
  const active = (subscriptions ?? []).filter((s) => s.status === "active");
  const pnl = (copiedTrades ?? []).reduce((sum, trade) => sum + Number(trade.profit_loss ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-7xl space-y-5 px-4 py-6">
        <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge variant="outline" className="mb-2 border-primary/30 text-primary">FOLLOWER CONTROL CENTER</Badge>
              <h1 className="text-2xl font-bold">My Copy Trading</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Manage Deriv copy subscriptions and MT5 TradeCopy relationships from one place.
                Your connected account and risk controls remain separate from each provider.
              </p>
            </div>
            <Button asChild><Link to="/copy-trading">Discover providers <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="glass-card"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-4 w-4 text-primary" /> Active Deriv copies</div><div className="mt-1 text-2xl font-bold">{active.length}</div></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Copy className="h-4 w-4 text-primary" /> Recorded copied trades</div><div className="mt-1 text-2xl font-bold">{copiedTrades?.length ?? 0}</div></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Activity className="h-4 w-4 text-primary" /> Recorded P/L</div><div className={`mt-1 text-2xl font-bold ${pnl >= 0 ? "text-success" : "text-destructive"}`}>{money(pnl)}</div></CardContent></Card>
        </div>

        <CopyTradingRoleGuide role="follower" />

        <TradeCopyCloudSignalPanel />

        <TradeCopyAccountDashboard role="slave" />

        <FollowerTradeCopyPanel />

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">Deriv copy subscriptions</CardTitle>
            <CardDescription>Existing Deriv provider subscriptions remain available here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {active.length === 0 ? (
              <div className="rounded-lg border border-border/60 p-4 text-center text-sm text-muted-foreground">
                No active Deriv subscriptions.
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

        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            Copy trading involves risk. Test on demo first and verify your risk controls before using a live account.
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

export const BotvioRobotDashboard = () => {
  const { data: entitlements, isLoading: entitlementsLoading, isError: entitlementsError, refetch: refetchEntitlements } = useEntitlements();
  const { data: tradingAccounts, isLoading: tradingAccountsLoading } = useTradingAccounts();
  const { data: copySubscriptions } = useMyCopySubscriptions();
  const followerAccounts = useTradeCopyAccounts("slave");
  const activeEntitlements = (entitlements ?? []).filter(isEntitlementActive);
  const activeCopySubscriptions = (copySubscriptions ?? []).filter((item) => item.status === "active");
  const accountsWithTradeCopy = (followerAccounts.data ?? []).filter((account) => !!account.tradecopy_user_id);
  const positionQueries = useQueries({
    queries: accountsWithTradeCopy.map((account) => ({
      queryKey: ["botvio-dashboard-open-orders", account.id],
      queryFn: () => tradecopy<{ orders: Record<string, unknown>[] }>("open_orders", { account_id: account.id }),
      refetchInterval: 10_000,
      staleTime: 5_000,
      retry: false,
    })),
  });
  const positions = accountsWithTradeCopy.flatMap((account, index) => {
    const query = positionQueries[index];
    return (query?.data?.orders ?? []).map((order, orderIndex) => ({
      key: String(order.ticket ?? order.order_id ?? order.id ?? `${account.id}-${orderIndex}`),
      account: account.label || account.broker || "MT5 account",
      broker: account.broker || "MT5",
      symbol: String(order.symbol ?? order.symbol_name ?? "—"),
      side: String(order.type ?? order.side ?? order.action ?? "—").toUpperCase(),
      volume: String(order.volume ?? order.lots ?? order.lot ?? "—"),
      entry: order.open_price ?? order.openPrice ?? order.price_open ?? order.entry_price,
      current: order.current_price ?? order.currentPrice ?? order.price_current,
      pnl: order.profit ?? order.pnl ?? order.profit_loss,
    }));
  });
  const positionErrors = positionQueries.some((query) => query.isError);
  const positionLoading = followerAccounts.isLoading || positionQueries.some((query) => query.isLoading);
  const metrics = [
    { label: "Active subscriptions", value: entitlementsLoading ? "…" : String(activeEntitlements.length), tone: "text-emerald-300", icon: Layers3 },
    { label: "Linked accounts", value: tradingAccountsLoading ? "…" : String(tradingAccounts?.length ?? 0), tone: "text-cyan-300", icon: Wallet },
    { label: "Open positions", value: positionLoading ? "…" : positionErrors ? "—" : String(positions.length), tone: "text-emerald-300", icon: Activity },
    { label: "Provider follows", value: String(activeCopySubscriptions.length), tone: "text-amber-300", icon: Users },
  ];
  const workflows = [
    { title: "Deriv Options", description: "Options contracts and supported synthetic markets", icon: Zap, href: "/options", action: "Open Options", accent: "text-amber-300" },
    { title: "Deriv Synthetic MT5 & Currencies", description: "Synthetic indices and supported currency pairs", icon: ChartNoAxesCombined, href: "/connections", action: "Manage MT5", accent: "text-emerald-300" },
    { title: "Weltrade MT5", description: "Supported Forex, Gold, indices and SyntX markets", icon: Cloud, href: "/connections", action: "Manage account", accent: "text-cyan-300" },
    { title: "Botvio Provider Signals", description: "Provider setup, signal delivery and execution status", icon: Radio, href: "/provider-dashboard", action: "Provider centre", accent: "text-violet-300" },
    { title: "Follow Providers", description: "Manage copy relationships and follower settings", icon: Users, href: "/copy-trading/my", action: "Manage follows", accent: "text-amber-300" },
  ];

  return (
    <div className="min-h-screen bg-[#080d16] text-slate-100">
      <Header />
      <main className="mx-auto max-w-[1440px] space-y-6 px-3 py-5 sm:px-5 lg:px-8">
        <section className="relative isolate overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-[#102d2a] via-[#101d2a] to-[#101522] p-5 shadow-2xl shadow-black/20 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.5fr_.8fr] lg:items-center">
            <div>
              <Badge variant="outline" className="mb-3 border-emerald-300/30 bg-emerald-300/10 text-emerald-200">BOTVIO TRADING WORKSPACE</Badge>
              <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Your trading, connected in one place.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Review your access, connect your preferred trading platform, follow providers and monitor verified open positions from your connected accounts.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild className="bg-emerald-300 text-slate-950 hover:bg-emerald-200"><Link to="/connections">Connect trading account <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10"><Link to="/marketplace">Explore plans <ExternalLink className="ml-2 h-4 w-4" /></Link></Button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-300/10"><Bot className="h-6 w-6 text-emerald-300" /></div>
                <div className="min-w-0"><p className="text-xs uppercase tracking-[.18em] text-slate-400">Botvio Robot</p><p className="mt-1 text-lg font-bold">Trading command centre</p></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-slate-400">Signal engine</p><p className="mt-1 text-sm font-semibold text-emerald-300">Existing integration</p></div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-slate-400">Execution route</p><p className="mt-1 text-sm font-semibold text-cyan-300">TradeCopy Cloud</p></div>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">Execution and connection health are shown only when confirmed by existing system data.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, tone, icon: Icon }) => (
            <Card key={label} className="border-white/10 bg-[#111a28] text-slate-100 shadow-lg shadow-black/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between"><div className="rounded-xl border border-white/10 bg-white/5 p-2"><Icon className={`h-5 w-5 ${tone}`} /></div><span className="h-2 w-2 rounded-full bg-emerald-400" /></div>
                <p className="mt-4 text-xs font-medium text-slate-400">{label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_.8fr]">
          <div className="space-y-5">
            <Card className="border-white/10 bg-[#111a28] text-slate-100">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div><CardTitle className="text-lg">Your access</CardTitle><CardDescription className="text-slate-400">Subscriptions and products linked to your account</CardDescription></div>
                <Button asChild variant="outline" size="sm" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"><Link to="/marketplace">View plans</Link></Button>
              </CardHeader>
              <CardContent>
                {entitlementsLoading ? <div className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">Loading your subscriptions…</div> :
                  entitlementsError ? <div className="rounded-xl border border-red-400/20 p-4 text-sm text-red-300">Your access could not be loaded. <Button size="sm" variant="outline" onClick={() => refetchEntitlements()}>Retry</Button></div> :
                  activeEntitlements.length ? <div className="grid gap-3 sm:grid-cols-2">{activeEntitlements.map((item) => (
                    <div key={item.id} className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4">
                      <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><Layers3 className="h-4 w-4 shrink-0 text-emerald-300" /><p className="truncate text-sm font-semibold">{item.products?.name ?? "Active product"}</p></div><Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-200">Active</Badge></div>
                      <p className="mt-2 text-xs text-slate-400">{item.ends_at ? `Access until ${new Date(item.ends_at).toLocaleDateString()}` : "No expiry recorded"}</p>
                      <Button asChild variant="link" className="mt-2 h-auto p-0 text-emerald-300"><Link to={item.products?.slug === "synthetic-hub" ? "/synthetic" : item.products?.slug === "weltrade-hub" ? "/weltrade" : item.products?.slug === "mt5-direct" ? "/connections" : "/botvio-robot"}>Open product <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
                    </div>
                  ))}</div> :
                  <div className="rounded-xl border border-dashed border-white/15 p-6 text-center"><Layers3 className="mx-auto h-8 w-8 text-slate-500" /><p className="mt-2 font-semibold">No active subscriptions yet</p><p className="mt-1 text-sm text-slate-400">Explore the available hubs and signal products to choose what suits you.</p><Button asChild className="mt-4 bg-emerald-300 text-slate-950 hover:bg-emerald-200"><Link to="/marketplace">Explore products</Link></Button></div>}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#111a28] text-slate-100">
              <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-lg">Open trades</CardTitle><CardDescription className="text-slate-400">Positions returned by your connected TradeCopy follower accounts</CardDescription></div><Badge variant="outline" className="border-emerald-300/20 text-emerald-200"><Activity className="mr-1 h-3 w-3" /> Live lookup</Badge></div></CardHeader>
              <CardContent>
                {positionLoading ? <div className="space-y-2"><div className="h-10 animate-pulse rounded-lg bg-white/5" /><div className="h-10 animate-pulse rounded-lg bg-white/5" /></div> :
                  positionErrors || followerAccounts.isError ? <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">Open positions could not be verified for one or more accounts. Check your connection status or open Trading Connections.</div> :
                  positions.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-white/10 text-xs text-slate-400"><th className="py-3 pr-3 font-medium">Account</th><th className="py-3 pr-3 font-medium">Market</th><th className="py-3 pr-3 font-medium">Side</th><th className="py-3 pr-3 font-medium">Volume</th><th className="py-3 pr-3 font-medium">Entry</th><th className="py-3 font-medium">Floating P/L</th></tr></thead><tbody>{positions.map((position) => <tr key={position.key} className="border-b border-white/5 last:border-0"><td className="py-3 pr-3"><p className="font-medium">{position.account}</p><p className="text-xs text-slate-500">{position.broker}</p></td><td className="py-3 pr-3 font-semibold">{position.symbol}</td><td className={`py-3 pr-3 font-semibold ${position.side.includes("BUY") ? "text-emerald-300" : position.side.includes("SELL") ? "text-rose-300" : "text-slate-300"}`}>{position.side}</td><td className="py-3 pr-3">{position.volume}</td><td className="py-3 pr-3">{position.entry == null ? "—" : String(position.entry)}</td><td className={`py-3 font-semibold ${Number(position.pnl) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{position.pnl == null ? "—" : Number(position.pnl).toFixed(2)}</td></tr>)}</tbody></table><p className="mt-3 text-xs text-slate-500">Prices and P/L are shown only when returned by the connected TradeCopy account.</p></div> :
                  <div className="rounded-xl border border-dashed border-white/15 p-6 text-center"><Activity className="mx-auto h-8 w-8 text-slate-500" /><p className="mt-2 font-semibold">No trades currently running</p><p className="mt-1 text-sm text-slate-400">No open positions were returned by your connected TradeCopy follower accounts.</p></div>}
                <div className="mt-4 flex flex-wrap gap-2"><Button asChild variant="outline" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"><Link to="/trade-history">Trade history <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"><Link to="/connections">Manage connections <Wallet className="ml-2 h-4 w-4" /></Link></Button></div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="border-white/10 bg-[#111a28] text-slate-100">
              <CardHeader><CardTitle className="text-lg">Trading platforms</CardTitle><CardDescription className="text-slate-400">Choose the workflow you want to open</CardDescription></CardHeader>
              <CardContent className="space-y-3">{workflows.map(({ title, description, icon: Icon, href, action, accent }) => <div key={title} className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><div className="flex items-start gap-3"><div className="rounded-lg bg-white/5 p-2"><Icon className={`h-5 w-5 ${accent}`} /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{description}</p><Button asChild variant="link" className="mt-1 h-auto p-0 text-emerald-300"><Link to={href}>{action} <ArrowRight className="ml-1 h-3 w-3" /></Link></Button></div></div></div>)}</CardContent>
            </Card>
            <Card className="border-white/10 bg-[#111a28] text-slate-100">
              <CardHeader><CardTitle className="text-lg">Robot execution master</CardTitle><CardDescription className="text-slate-400">Existing Botvio Robot master account and controls</CardDescription></CardHeader>
              <CardContent className="space-y-4"><TradeCopyAccountDashboard role="master" robot /><div className="grid gap-2"><Button asChild className="justify-between bg-emerald-300 text-slate-950 hover:bg-emerald-200"><Link to="/connections">Trading connections <ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline" className="justify-between border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"><Link to="/bots">AI Bots <ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline" className="justify-between border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"><Link to="/copy-trading/my">My Copy Trading <ArrowRight className="h-4 w-4" /></Link></Button></div></CardContent>
            </Card>
            <Card className="border-amber-300/20 bg-amber-300/[0.04] text-slate-100"><CardContent className="flex items-start gap-3 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div><p className="text-sm font-semibold">Risk remains user-controlled</p><p className="mt-1 text-xs leading-5 text-slate-400">Review account mode, position sizing and copy settings before enabling live trading. A signal is not a guarantee of execution or profit.</p></div></CardContent></Card>
          </aside>
        </section>
      </main>
    </div>
  );
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
