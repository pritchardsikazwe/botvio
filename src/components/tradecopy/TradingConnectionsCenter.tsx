import { useAuth } from "@/contexts/AuthContext";
import { DerivConnectionPanel } from "@/components/broker/DerivConnectionPanel";
import { DerivAccountsManager } from "@/components/tradecopy/DerivAccountsManager";
import { FollowerTradeCopyPanel } from "@/components/tradecopy/FollowerTradeCopyPanel";
import { ProviderTradingAccountCard } from "@/components/tradecopy/ProviderTradingAccountCard";
import { SyntxApiStudioConnectionCard } from "@/components/tradecopy/SyntxApiStudioConnectionCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowRight, Cloud, ShieldCheck, Users, Wallet } from "lucide-react";

export function TradingConnectionsCenter() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-xl font-bold">Your trading connections</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Connect your broker, choose your trading source and control automated copying from one place.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Demo first
        </Badge>
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
              <h3 className="font-semibold">MT5 robot and copy trading</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose a source, set permitted markets, and start or pause copying.</p>
              <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">Manage MT5 <ArrowRight className="ml-1 h-4 w-4" /></span>
            </div>
          </div>
        </a>
      </div>

      <section id="mt5-copy-trading" className="scroll-mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">1. MT5 robot and copy trading</h2>
          <Badge variant="outline"><Cloud className="mr-1 h-3 w-3" /> TradeCopy Cloud</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect the MT5 account where you want trades to open. Select Botvio Robot or an available provider, configure risk and market preferences, then start or pause copying when you choose.
        </p>
        <FollowerTradeCopyPanel />
      </section>

      <section id="deriv-connection" className="scroll-mt-6 space-y-3 border-t border-border/60 pt-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">2. Deriv</h2>
            <Badge variant="outline">Demo / Real</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Connect securely, then select and manage your Deriv accounts.</p>
        </div>
        <DerivConnectionPanel hideLegacyPat />
        <DerivAccountsManager />
      </section>

      <section className="space-y-3 border-t border-border/60 pt-5">
        <div>
          <h2 className="text-lg font-semibold">MT5 provider setup</h2>
          <p className="text-sm text-muted-foreground">Optional: connect your own MT5 master account only if you intend to publish trades for followers.</p>
        </div>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">MT5 Provider</CardTitle>
            <CardDescription>Connect the MT5 account whose trades should be shared with followers.</CardDescription>
          </CardHeader>
          <CardContent><ProviderTradingAccountCard /></CardContent>
        </Card>
      </section>

      {isAdmin && (
        <section className="scroll-mt-6 space-y-4 border-t border-border/60 pt-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Admin tools</h2>
              <Badge variant="outline">Admin only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Internal feed configuration is separate from normal user trading connections.
            </p>
          </div>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Weltrade SyntX market-data feed</CardTitle>
              </div>
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

      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
        <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-semibold">Important: test on Demo first</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Check the selected MT5 account and risk settings before starting. Pausing stops new copied trades; it may not close positions already open at the broker. Market restrictions depend on the selected execution route and must be verified for that route.
          </p>
        </div>
      </div>
    </div>
  );
}
