import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DerivConnectionPanel } from "@/components/broker/DerivConnectionPanel";
import { DerivAccountsManager } from "@/components/tradecopy/DerivAccountsManager";
import { FollowerTradeCopyPanel } from "@/components/tradecopy/FollowerTradeCopyPanel";
import { ProviderTradingAccountCard } from "@/components/tradecopy/ProviderTradingAccountCard";
import { SyntxApiStudioConnectionCard } from "@/components/tradecopy/SyntxApiStudioConnectionCard";
import { Mt5ConnectionsPanel } from "@/components/tradecopy/Mt5ConnectionsPanel";
import { RoleEntryCards } from "@/components/tradecopy/CopyTradingRoleGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Cloud,
  Link2,
  Monitor,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

export function TradingConnectionsCenter() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-5">
      <Card className="glass-card overflow-hidden border-primary/20">
        <CardHeader className="bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">BOTVIO CONTROL CENTER</Badge>
            <Badge variant="secondary">Deriv + MT5 TradeCopy</Badge>
          </div>
          <CardTitle className="text-2xl sm:text-3xl">Connections & Copy Trading</CardTitle>
          <CardDescription className="max-w-3xl text-sm sm:text-base">
            One place to understand every trading connection. Deriv is used for Deriv trading and signals.
            MT5 uses TradeCopy Cloud for master/follower copy trading. These are separate connections.
          </CardDescription>

          <div className="grid gap-2 pt-2 sm:grid-cols-4">
            {[
              ["1", "Connect", "Connect Deriv or MT5"],
              ["2", "Configure", "Choose master or follower"],
              ["3", "Link", "Choose the copy source"],
              ["4", "Start", "Activate after testing"],
            ].map(([n, title, text]) => (
              <div key={n} className="rounded-xl border border-border/60 bg-background/60 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{n}</span>
                  <span className="text-sm font-semibold">{title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </CardHeader>
      </Card>


      <Card className="glass-card border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-semibold">Account structure: one Deriv ownership, separate trading connections</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Your Deriv login can own multiple trading accounts, including Demo and Real. Botvio still keeps
              Deriv Options credentials separate from MT5 TradeCopy credentials. A Deriv Demo account and an
              MT5 Provider Demo account can belong to the same Deriv ownership, but they are different trading
              connections and must not be treated as the same account inside Botvio.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card overflow-hidden border-primary/15">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">BOTVIO connection map</CardTitle>
              <CardDescription>See exactly what each account is used for before you activate copying.</CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/25 text-primary">DEMO-FIRST</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[
            { n: "01", title: "Deriv", sub: "Options / Deriv trading", meta: "Demo + Real", icon: Wallet },
            { n: "02", title: "MT5 Provider", sub: "Publishes master trades", meta: "TradeCopy", icon: Monitor },
            { n: "03", title: "MT5 Follower", sub: "Receives copied trades", meta: "TradeCopy", icon: Users },
            { n: "04", title: "Botvio Robot", sub: "Official Botvio master", meta: "Admin source", icon: Bot },
            { n: "05", title: "Weltrade SyntX", sub: "Market data only", meta: "Quotes + candles", icon: Activity },
          ].map(({ n, title, sub, meta, icon: Icon }) => (
            <div key={n} className="group rounded-2xl border border-border/60 bg-background/70 p-3 transition-colors hover:border-primary/30">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">{n}</span>
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
              <Badge variant="secondary" className="mt-3 text-[10px]">{meta}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm">Deriv</CardTitle>
            </div>
            <CardDescription>Deriv account, signals and Deriv trading.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="#deriv-connection">Open Deriv connection <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm">MT5 Provider</CardTitle>
            </div>
            <CardDescription>Master account that publishes trades to followers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="#provider-mt5">Manage provider MT5 <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm">MT5 Follower</CardTitle>
            </div>
            <CardDescription>Account that copies an approved provider or Botvio Robot.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="#follower-mt5">Manage follower MT5 <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm">Weltrade SyntX Data</CardTitle>
            </div>
            <CardDescription>MT5 SyntX quotes and candles for Botvio charts and signals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="#weltrade-syntx-data">Weltrade SyntX data <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm">Botvio Robot</CardTitle>
            </div>
            <CardDescription>{isAdmin ? "Admin-controlled official MT5 master." : "Available as a copy source for followers."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/botvio-robot">Open Botvio Robot <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <section id="deriv-connection" className="scroll-mt-6 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">1. Deriv connection</h2>
            <p className="text-sm text-muted-foreground">Demo and Real Deriv accounts can be managed here. This connection is separate from the MT5 Provider/Follower connection.</p>
          </div>
          <Badge variant="outline">Separate from MT5</Badge>
        </div>
        <DerivConnectionPanel hideLegacyPat />
        <DerivAccountsManager />
      </section>

      <section id="weltrade-syntx-data" className="scroll-mt-6 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">2. Weltrade SyntX market-data feed</h2>
            <p className="text-sm text-muted-foreground">Connect your Weltrade MT5 SyntX account for quotes, ticks and historical candles only.</p>
          </div>
          <Badge variant="outline" className="border-success/30 text-success">DATA ONLY</Badge>
        </div>
        <SyntxApiStudioConnectionCard />
      </section>

      <section id="mt5-connections" className="scroll-mt-6 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">MT5 Connections</h2>
            <p className="text-sm text-muted-foreground">Your own MT5 accounts. Send Botvio signals directly, or choose to copy a provider or Botvio Robot.</p>
          </div>
          <Badge variant="outline">Direct Botvio Signals</Badge>
        </div>
        <Mt5ConnectionsPanel />
      </section>

      <section id="follower-mt5" className="scroll-mt-6 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">TradeCopy: copy a provider or Botvio Robot</h2>
            <p className="text-sm text-muted-foreground">Connect the follower account, then choose Provider or Botvio Robot.</p>
          </div>
          <Badge variant="outline">TradeCopy Cloud</Badge>
        </div>
        <FollowerTradeCopyPanel />
      </section>

      <section id="provider-mt5" className="scroll-mt-6 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">4. MT5 provider master</h2>
            <p className="text-sm text-muted-foreground">Connect the exact MT5 login whose trades should be published. It may belong to the same Deriv ownership as your Deriv Demo, but it remains a separate MT5 connection.</p>
          </div>
          <Badge variant="outline">Master</Badge>
        </div>
        <ProviderTradingAccountCard />
        <Card className="glass-card border-primary/15 bg-primary/5">
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="text-xs leading-5">
              <p className="font-semibold text-sm">Provider safety rule</p>
              <p className="mt-1 text-muted-foreground">
                One MT5 login should have one clear role. Use a dedicated Demo master for provider testing.
                Do not use the same MT5 login as both the Provider master and its own Follower, and do not
                create duplicate master routes for the same account.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {isAdmin && (
        <section className="scroll-mt-6 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">5. Botvio Robot master</h2>
              <p className="text-sm text-muted-foreground">Admin-only control of the official Botvio MT5 execution source.</p>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">ADMIN</Badge>
          </div>
          <ProviderTradingAccountCard robot />
        </section>
      )}

      <Card className="glass-card border-border/60">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link2 className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Ready to test?</p>
              <p className="text-xs text-muted-foreground">
                Use two MT5 DEMO accounts: one master and one follower. Keep LIVE copying disabled until the full flow is verified.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            DEMO first
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground">
        <Cloud className="mr-1 inline h-3.5 w-3.5" />
        MT5 copy trading uses TradeCopy Cloud. The old MT5 Bridge/VPS workflow is not part of this new connection flow.
      </div>
    </div>
  );
}
