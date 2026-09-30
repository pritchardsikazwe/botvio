import { Link } from "react-router-dom";
import { Bot, Copy, Settings, ShieldCheck, Users, Wallet, ArrowRight, Cloud, Activity } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FollowerTradeCopyPanel } from "@/components/tradecopy/FollowerTradeCopyPanel";
import { ProviderTradingAccountCard } from "@/components/tradecopy/ProviderTradingAccountCard";
import { useMyCopySubscriptions, useMyCopiedTrades } from "@/hooks/useBotvio";

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
    <main className="container mx-auto max-w-7xl space-y-5 px-4 py-6">
      <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="outline" className="mb-2 border-primary/30 text-primary">BOTVIO ROBOT</Badge>
            <h1 className="text-2xl font-bold">Automated Provider</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Botvio Robot can act as the official MT5 master source. TradeCopy Cloud then handles follower distribution.
            </p>
          </div>
          <Badge variant="outline" className="gap-2"><Cloud className="h-3.5 w-3.5" /> TradeCopy Cloud</Badge>
        </div>
      </section>
      <ProviderTradingAccountCard robot />
      <Card className="glass-card">
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Bot className="h-4 w-4 text-primary" /> Copy architecture</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            ["1", "Botvio signals", "Signals are generated by the Botvio Robot strategy layer."],
            ["2", "MT5 master", "The Robot master account is connected to TradeCopy Cloud."],
            ["3", "Followers", "TradeCopy distributes eligible master trades to follower accounts."],
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
        <Button asChild><Link to="/connections">Manage connections</Link></Button>
        <Button asChild variant="outline"><Link to="/copy-trading/my">Follower dashboard</Link></Button>
      </div>
    </main>
  </div>
);

export const CopyTradingAdmin = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto max-w-7xl space-y-5 px-4 py-6">
      <h1 className="text-2xl font-bold">Copy Trading Admin</h1>
      <ProviderTradingAccountCard robot />
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link to="/copy-trading">Marketplace</Link></Button>
        <Button asChild variant="outline"><Link to="/botvio-robot">Botvio Robot</Link></Button>
      </div>
    </main>
  </div>
);
