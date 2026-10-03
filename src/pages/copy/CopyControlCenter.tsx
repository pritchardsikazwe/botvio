import { Link } from "react-router-dom";
import { Bot, Copy, Settings, ShieldCheck, Users, Wallet, ArrowRight, Cloud, Activity } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FollowerTradeCopyPanel } from "@/components/tradecopy/FollowerTradeCopyPanel";
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

export const BotvioRobotDashboard = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto max-w-7xl space-y-5 px-4 py-6 pb-20">
      <BotvioRobotPromo compact />
      <section className="grid gap-3 sm:grid-cols-4">
        {[
          ["Robot", "Server-side AI", "text-success"],
          ["Signals", "Auto generated", "text-primary"],
          ["Delivery", "MT5 Bridge", "text-primary"],
          ["Safety", "User controlled", "text-success"],
        ].map(([label, value, cls]) => (
          <Card key={label} className="glass-card"><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p><p className={`mt-1 text-sm font-bold ${cls}`}>{value}</p></CardContent></Card>
        ))}
      </section>
      <TradeCopyAccountDashboard role="master" robot />
      <ProviderTradingAccountCard robot />
      <Mt5AutoExecuteCard />
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Bot className="h-4 w-4 text-primary" /> How automatic MT5 delivery works</CardTitle>
          <CardDescription>Connect your MT5 Bridge EA and turn on Auto-Execute. The server-side robot can continue scanning without keeping the app open.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            ["1", "AI market scan", "The Botvio server scans enabled markets and evaluates the current setup."],
            ["2", "Signal + risk", "A qualifying setup produces BUY/SELL with entry, stop-loss and take-profit levels."],
            ["3", "MT5 execution", "The signal is queued to your enabled MT5 terminal and the Bridge EA picks it up."],
          ].map(([n, title, description]) => (
            <div key={n} className="rounded-xl border border-border/60 p-4">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{n}</div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button asChild><Link to="/connections">Connect MT5</Link></Button>
        <Button asChild variant="outline"><Link to="/bots">AI Bots</Link></Button>
        <Button asChild variant="outline"><Link to="/copy-trading/my">My Copy Trading</Link></Button>
      </div>
    </main>
  </div>
);

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
      const { data, error } = await supabase.from("trading_accounts").select("id,broker,account_role,environment,connection_status,tradecopy_active,is_botvio_robot").order("updated_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
  const providerRows = providers.data ?? [];
  const accountRows = accounts.data ?? [];
  const pending = providerRows.filter((p) => p.status === "pending" || p.status === "review").length;
  const approved = providerRows.filter((p) => p.status === "approved").length;
  const masters = accountRows.filter((a) => a.account_role === "master").length;
  const followers = accountRows.filter((a) => a.account_role === "slave" || a.account_role === "follower").length;
  const live = accountRows.filter((a) => a.environment === "live").length;
  const active = accountRows.filter((a) => a.tradecopy_active).length;

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
            <CardHeader><CardTitle className="text-sm">Connection health</CardTitle><CardDescription>Operational view only — no raw passwords or secrets are shown.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {accounts.isLoading ? <p className="text-sm text-muted-foreground">Loading accounts…</p> :
                accountRows.length === 0 ? <p className="text-sm text-muted-foreground">No trading accounts visible to this admin query.</p> :
                accountRows.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                    <div><p className="text-sm font-semibold">{a.broker ?? "MT5"} · {a.account_role ?? "unassigned"}</p><p className="text-xs text-muted-foreground">{a.environment ?? "demo"} · {a.connection_status ?? "unknown"}</p></div>
                    <div className="flex gap-1.5"><Badge variant={a.tradecopy_active ? "default" : "outline"}>{a.tradecopy_active ? "Active" : "Idle"}</Badge>{a.is_botvio_robot && <Badge variant="secondary">Robot</Badge>}</div>
                  </div>
                ))}
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
