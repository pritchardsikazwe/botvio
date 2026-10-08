import { Link } from "react-router-dom";
import { Bot, Copy, Settings, ShieldCheck, Users, Wallet, ArrowRight, Cloud, Activity } from "lucide-react";
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
import { useMyCopySubscriptions, useMyCopiedTrades } from "@/hooks/useBotvio";
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
  const metrics = [
    { label: "Robot", value: "Server-side AI", tone: "text-success", icon: Bot },
    { label: "Signals", value: "Auto generated", tone: "text-primary", icon: Activity },
    { label: "Execution", value: "TradeCopy Cloud", tone: "text-primary", icon: Cloud },
    { label: "Safety", value: "User controlled", tone: "text-success", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-foreground">
      <Header />
      <main className="container mx-auto max-w-7xl space-y-6 px-4 py-6 pb-20">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div>
              <Badge className="mb-3 border-white/15 bg-white/10 text-emerald-200 hover:bg-white/10">BOTVIO AI ROBOT</Badge>
              <h1 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                AI trading intelligence, connected to your MT5.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                Botvio scans supported markets, builds structured BUY/SELL setups and publishes eligible signals through the TradeCopy Cloud master used for follower copying.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild className="bg-white text-emerald-950 hover:bg-white/90">
                  <Link to="/connections">Connect MT5 <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <Link to="/bots">Open AI Bots</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Robot status</p>
                  <p className="mt-1 text-lg font-bold">AI engine ready</p>
                </div>
                <span className="flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,.8)]" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {metrics.map(({ label, value, tone }) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
                    <p className={`mt-1 text-xs font-semibold ${tone}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon, tone }) => (
            <Card key={label} className="border-border/60 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-muted p-2"><Icon className={`h-4 w-4 ${tone}`} /></div>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className={`mt-1 text-sm font-bold ${tone}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
          <div className="space-y-5">
            <Card className="border-border/60 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Badge variant="outline" className="mb-2">EXECUTION MASTER</Badge>
                    <CardTitle className="text-lg">Botvio Robot MT5</CardTitle>
                    <CardDescription>Official Botvio master account used for MT5 copy execution.</CardDescription>
                  </div>
                  <Bot className="h-7 w-7 text-primary" />
                </div>
              </CardHeader>
              <CardContent><TradeCopyAccountDashboard role="master" robot /></CardContent>
            </Card>

            <Card className="border-border/60 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">MT5 Auto-Execute</CardTitle>
                <CardDescription>Use TradeCopy Cloud as the MT5 execution/copy layer. Botvio Robot is the master signal account; follower accounts are copied in TradeCopy Cloud.</CardDescription>
              </CardHeader>
              <CardContent><Mt5AutoExecuteCard /></CardContent>
            </Card>

            <Card className="border-border/60 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">How a signal reaches MT5</CardTitle>
                <CardDescription>Four clear stages instead of a long technical explanation.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    ["01", "Scan", "AI evaluates supported markets."],
                    ["02", "Setup", "BUY/SELL with entry, SL and TP."],
                    ["03", "Queue", "Eligible signal enters the MT5 route."],
                    ["04", "Execute", "TradeCopy Cloud copies the master order to follower MT5 accounts."],
                  ].map(([n, title, description]) => (
                    <div key={n} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <span className="text-[10px] font-bold text-primary">{n}</span>
                      <p className="mt-2 text-sm font-bold">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="border-border/60 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Robot connection</CardTitle>
                <CardDescription>Keep Deriv and MT5 connections clearly separated.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-border/60 p-4">
                  <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Deriv</p></div>
                  <p className="mt-1 text-xs text-muted-foreground">Used for Deriv trading and market/signals connections.</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <div className="flex items-center gap-2"><Cloud className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">MT5 Master</p></div>
                  <p className="mt-1 text-xs text-muted-foreground">Uses MT5 login, trader password and exact broker server.</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-900">Important</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">Do not enter a Deriv token into an MT5 connection. They are separate connection types.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Robot controls</CardTitle>
                <CardDescription>Quick access to the operational areas.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button asChild className="justify-between"><Link to="/connections">Trading Connections <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild variant="outline" className="justify-between"><Link to="/bots">AI Bots <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild variant="outline" className="justify-between"><Link to="/copy-trading/my">My Copy Trading <ArrowRight className="h-4 w-4" /></Link></Button>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/20 bg-emerald-50/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-bold text-emerald-950">User-controlled risk</p>
                    <p className="mt-1 text-xs leading-5 text-emerald-900/70">You control sizing, confidence thresholds, stop-loss and take-profit; TradeCopy Cloud handles follower replication.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
