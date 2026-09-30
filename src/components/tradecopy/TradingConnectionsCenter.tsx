import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DerivConnectionPanel } from "@/components/broker/DerivConnectionPanel";
import { FollowerTradeCopyPanel } from "@/components/tradecopy/FollowerTradeCopyPanel";
import { ProviderTradingAccountCard } from "@/components/tradecopy/ProviderTradingAccountCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
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
            <p className="font-semibold">Important: Deriv and MT5 are not the same connection.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use the Deriv connection for Deriv accounts, signals and Deriv trading. Use the MT5 connection
              for MT5 TradeCopy. Never enter a Deriv API token into the MT5 form.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-4">
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
            <p className="text-sm text-muted-foreground">Use this only for your Deriv account and Deriv trading workflows.</p>
          </div>
          <Badge variant="outline">Separate from MT5</Badge>
        </div>
        <DerivConnectionPanel hideLegacyPat />
      </section>

      <section id="follower-mt5" className="scroll-mt-6 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">2. MT5 follower</h2>
            <p className="text-sm text-muted-foreground">Connect the follower account, then choose Provider or Botvio Robot.</p>
          </div>
          <Badge variant="outline">TradeCopy Cloud</Badge>
        </div>
        <FollowerTradeCopyPanel />
      </section>

      <section id="provider-mt5" className="scroll-mt-6 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">3. MT5 provider master</h2>
            <p className="text-sm text-muted-foreground">Connect the exact MT5 account whose trades should be published to followers.</p>
          </div>
          <Badge variant="outline">Master</Badge>
        </div>
        <ProviderTradingAccountCard />
      </section>

      {isAdmin && (
        <section className="scroll-mt-6 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">4. Botvio Robot master</h2>
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
