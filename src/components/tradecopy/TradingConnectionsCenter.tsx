import { useAuth } from "@/contexts/AuthContext";
import { DerivConnectionPanel } from "@/components/broker/DerivConnectionPanel";
import { DerivAccountsManager } from "@/components/tradecopy/DerivAccountsManager";
import { FollowerTradeCopyPanel } from "@/components/tradecopy/FollowerTradeCopyPanel";
import { ProviderTradingAccountCard } from "@/components/tradecopy/ProviderTradingAccountCard";
import { SyntxApiStudioConnectionCard } from "@/components/tradecopy/SyntxApiStudioConnectionCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowRight, Cloud, ShieldCheck, Users, Wallet } from "lucide-react";
import { Activity, ArrowRight, Bot, Cloud, Monitor, Wallet } from "lucide-react";

export function TradingConnectionsCenter() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-xl font-bold">Your trading connections</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Connect Deriv, or set up MT5 copy trading. Choose a section below to manage that connection.
          </p>
        </div>
        <Badge variant="outline" className="w-fit"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Demo first</Badge>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <a href="#deriv-connection" className="group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/50">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-primary/10 p-2"><Wallet className="h-5 w-5 text-primary" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Deriv account</h3>
              <p className="mt-1 text-sm text-muted-foreground">Connect and manage your Deriv Demo or Real account.</p>
              <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">Manage Deriv <ArrowRight className="ml-1 h-4 w-4" /></span>
            </div>
          </div>
        </a>
        <a href="#mt5-copy-trading" className="group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/50">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-primary/10 p-2"><Users className="h-5 w-5 text-primary" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">MT5 copy trading</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose Provider to share trades or Follower to copy trades.</p>
              <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">Manage MT5 <ArrowRight className="ml-1 h-4 w-4" /></span>
            </div>
          </div>
        </a>
      </div>

      <section id="deriv-connection" className="scroll-mt-6 space-y-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">1. Deriv</h2>
            <Badge variant="outline">Demo / Real</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Connect securely, then select and manage your Deriv accounts.</p>
        </div>
        <DerivConnectionPanel hideLegacyPat />
        <DerivAccountsManager />
      </section>

      <section id="mt5-copy-trading" className="scroll-mt-6 space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">2. MT5 copy trading</h2>
            <Badge variant="outline"><Cloud className="mr-1 h-3 w-3" /> TradeCopy Cloud</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Provider publishes trades. Follower receives copied trades from an approved provider or Botvio Robot.
            These are separate MT5 account roles.
          </p>
        </div>

        <div id="provider-mt5" className="scroll-mt-6 space-y-3">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">MT5 Provider</CardTitle>
              <CardDescription>Connect the MT5 account whose trades should be shared with followers.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProviderTradingAccountCard />
            </CardContent>
          </Card>
        </div>

        <div id="follower-mt5" className="scroll-mt-6 space-y-3">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">MT5 Follower</CardTitle>
              <CardDescription>Connect the MT5 account that will receive copied trades, then select your copy source and risk settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <FollowerTradeCopyPanel />
            </CardContent>
          </Card>
    <div className="space-y-4">
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">AUTOMATED TRADING</Badge>
            <Badge variant="secondary">Demo first</Badge>
          </div>
          <CardTitle className="text-2xl sm:text-3xl">Connect your MT5 and control your robot</CardTitle>
          <CardDescription className="max-w-2xl text-sm sm:text-base">
            Connect the MT5 account where you want trades opened, choose Botvio Robot or an approved provider,
            select the markets you want to receive, then start or pause copying whenever you choose.
          </CardDescription>
          <div className="grid gap-2 pt-2 sm:grid-cols-3">
            {[
              ["1", "Connect MT5", "Use your own follower account"],
              ["2", "Choose markets", "Set your allowed signal markets"],
              ["3", "Start or pause", "You stay in control"],
            ].map(([n, title, description]) => (
              <div key={n} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{n}</span>
                <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">{description}</p></div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild><Link to="/botvio-robot">Open robot dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild variant="outline"><Link to="/signals">View live signals</Link></Button>
          </div>
        </CardHeader>
      </Card>

      <section id="follower-mt5" className="scroll-mt-6 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Your robot connection</h2>
            <p className="text-sm text-muted-foreground">Connect the MT5 account that will receive trades. Choose a source, configure markets and use Start Copying or Pause.</p>
          </div>
          <Badge variant="outline"><Bot className="mr-1 h-3 w-3" /> User controls</Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Start with Demo accounts and verify copying before enabling any live trading. The old Bridge/VPS workflow is not part of this TradeCopy Cloud setup.
        </p>
      </section>

      {isAdmin && (
        <section className="scroll-mt-6 space-y-4 border-t border-border/60 pt-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Admin tools</h2>
              <Badge variant="outline">Admin only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Internal feed configuration is separated from normal user account connections.
            </p>
          </div>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /><CardTitle className="text-base">Weltrade SyntX market-data feed</CardTitle></div>
              <CardDescription>Internal quotes and candle feed for Botvio charts and signals. This is not a user copy-trading account.</CardDescription>
            </CardHeader>
            <CardContent><SyntxApiStudioConnectionCard /></CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Botvio Robot master account</CardTitle>
              <CardDescription>Admin-controlled MT5 master used by the official Botvio Robot.</CardDescription>
            </CardHeader>
            <CardContent><ProviderTradingAccountCard robot /></CardContent>
          </Card>
        </section>
      )}
      <details className="group rounded-xl border border-border/60 bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold">
          <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Other connections</span>
          <span className="text-xs font-normal text-muted-foreground">Deriv and MT5 provider setup</span>
        </summary>
        <div className="space-y-5 border-t border-border/50 p-4">
          <section id="deriv-connection" className="space-y-3">
            <div>
              <h3 className="font-semibold">Deriv account</h3>
              <p className="text-sm text-muted-foreground">Connect Deriv separately for supported Deriv features. This is not your MT5 robot connection.</p>
            </div>
            <DerivConnectionPanel hideLegacyPat />
            <DerivAccountsManager />
          </section>

          <section id="provider-mt5" className="space-y-3 border-t border-border/50 pt-5">
            <div>
              <h3 className="font-semibold">Publish trades as a provider</h3>
              <p className="text-sm text-muted-foreground">Only use this if you want to publish trades from your own MT5 master account for followers.</p>
            </div>
            <ProviderTradingAccountCard />
          </section>

          {isAdmin && (
            <section id="weltrade-syntx-data" className="space-y-3 border-t border-border/50 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-primary" /> Weltrade SyntX API Studio</h3>
                  <p className="text-sm text-muted-foreground">Admin-only market-data feed setup for Botvio charts and signals. It cannot place trades.</p>
                </div>
                <Badge variant="outline">ADMIN ONLY · DATA</Badge>
              </div>
              <SyntxApiStudioConnectionCard />
            </section>
          )}

          {isAdmin && (
            <section className="space-y-3 border-t border-border/50 pt-5">
              <div>
                <h3 className="font-semibold">Botvio Robot master account</h3>
                <p className="text-sm text-muted-foreground">Admin-only control of the official MT5 signal source.</p>
              </div>
              <ProviderTradingAccountCard robot />
            </section>
          )}
        </div>
      </details>

      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
        <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-semibold">Important: test on Demo first</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Check the selected MT5 account and risk settings before starting. Pause stops new copied trades; it may not close positions already open in MT5.
            Market filters must be supported by the selected execution route to block orders reliably.
          </p>
        </div>
      </div>
    </div>
  );
}
