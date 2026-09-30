import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/trading/Header";
import { TradingConnectionsCenter } from "@/components/tradecopy/TradingConnectionsCenter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Monitor, ShieldCheck, Zap, Cloud } from "lucide-react";

const Connections = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-4xl px-4 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h1 className="mb-3 text-3xl font-bold">Trading Connections</h1>
            <p className="text-muted-foreground">
              Connect your Deriv account for Deriv copy trading, or connect MT5 through TradeCopy Cloud
              for MT5 copy trading.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Secure", text: "OAuth for Deriv and server-side MT5 credentials." },
              { icon: Cloud, title: "Cloud copy trading", text: "MT5 TradeCopy does not require the old Bridge EA path." },
              { icon: Zap, title: "One control center", text: "Manage connections, copying and emergency controls in Botvio." },
            ].map((item) => (
              <Card key={item.title} className="glass-card">
                <CardContent className="p-4">
                  <item.icon className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6 glass-card">
            <CardHeader>
              <CardTitle className="text-base">Get started</CardTitle>
              <CardDescription>Sign in to connect a trading account.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setAuthOpen(true)}>Sign in / Create account</Button>
            </CardContent>
          </Card>
        </main>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto space-y-6 px-4 py-6">
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-7">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-primary/30 text-primary">BOTVIO CONNECT</Badge>
              <Badge variant="secondary">2 supported copy routes</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Trading Connections</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
              Choose the connection that matches your account. Deriv uses secure OAuth. MT5 copy trading
              uses TradeCopy Cloud — the new route, without the old Bridge EA/VPS workflow.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
                <div className="rounded-lg bg-primary/10 p-2"><Wallet className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-sm font-semibold">Deriv Copy Trading</p>
                  <p className="text-xs text-muted-foreground">Connect once with Deriv OAuth, then follow Botvio providers or Botvio Robot.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
                <div className="rounded-lg bg-primary/10 p-2"><Monitor className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-sm font-semibold">MT5 Copy Trading · TradeCopy</p>
                  <p className="text-xs text-muted-foreground">Connect an MT5 master or follower directly to TradeCopy Cloud. No Bridge EA required.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="glass-card">
            <CardContent className="flex items-start gap-3 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div><p className="text-sm font-medium">Credentials protected</p><p className="text-xs text-muted-foreground">Secrets stay server-side.</p></div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="flex items-start gap-3 p-4">
              <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div><p className="text-sm font-medium">TradeCopy Cloud</p><p className="text-xs text-muted-foreground">MT5 copying without the legacy bridge flow.</p></div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="flex items-start gap-3 p-4">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div><p className="text-sm font-medium">Pause / Stop / Emergency</p><p className="text-xs text-muted-foreground">Controls are available before live copying.</p></div>
            </CardContent>
          </Card>
        </div>

        <TradingConnectionsCenter />
      </main>
    </div>
  );
};

export default Connections;
