import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { Header } from "@/components/trading/Header";
import { DerivConnectionPanel } from "@/components/broker/DerivConnectionPanel";
import MT5BridgeSetupWizard from "@/components/broker/MT5BridgeSetupWizard";
import { Mt5AutoExecuteCard } from "@/components/broker/Mt5AutoExecuteCard";
import { ProviderTradingAccountCard } from "@/components/tradecopy/ProviderTradingAccountCard";
import { FollowerTradeCopyPanel } from "@/components/tradecopy/FollowerTradeCopyPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Wallet,
  Monitor,
  ShieldCheck,
  Zap,
  Cloud,
  Users,
  Bot,
  ArrowRight,
  CheckCircle2,
  Info,
  Wrench,
  RefreshCw,
  Power,
  Trash2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Connections = () => {
  const { user } = useAuth();
  const { derivTokens } = useDeriv();
  const [authOpen, setAuthOpen] = useState(false);
  const [busyConnId, setBusyConnId] = useState<string | null>(null);

  const { data: connections, refetch: refetchConnections } = useQuery({
    queryKey: ["connections", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("deriv_connections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const disconnectConnection = async (id: string) => {
    setBusyConnId(id);
    try {
      const { error } = await supabase
        .from("deriv_connections")
        .update({ is_connected: false })
        .eq("id", id);
      if (error) throw error;
      toast.success("Deriv connection disconnected");
      refetchConnections();
    } catch (e: any) {
      toast.error("Could not disconnect", { description: e?.message });
    } finally {
      setBusyConnId(null);
    }
  };

  const deleteConnection = async (id: string) => {
    if (!window.confirm("Remove this Deriv connection permanently?")) return;
    setBusyConnId(id);
    try {
      const { error } = await supabase.from("deriv_connections").delete().eq("id", id);
      if (error) throw error;
      toast.success("Connection removed");
      refetchConnections();
    } catch (e: any) {
      toast.error("Could not remove connection", { description: e?.message });
    } finally {
      setBusyConnId(null);
    }
  };

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

  const activeDeriv = (connections ?? []).filter((c: any) => c.is_connected).length;

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

        <Tabs defaultValue="deriv" className="space-y-5">
          <TabsList className="grid h-auto w-full max-w-2xl grid-cols-2 rounded-xl p-1">
            <TabsTrigger value="deriv" className="gap-2 py-2.5">
              <Wallet className="h-4 w-4" /> Deriv Copy Trading
            </TabsTrigger>
            <TabsTrigger value="mt5" className="gap-2 py-2.5">
              <Monitor className="h-4 w-4" /> MT5 TradeCopy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deriv" className="space-y-5">
            <Alert className="border-primary/30 bg-primary/5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <AlertTitle>New Deriv connection flow</AlertTitle>
              <AlertDescription className="text-sm">
                Use <strong>Continue with Deriv</strong> to authorize Botvio. The old token/PAT route is
                not presented here. After connecting, use Botvio Copy Trading to follow providers or Botvio Robot.
              </AlertDescription>
            </Alert>

            <DerivConnectionPanel hideLegacyPat />

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="glass-card">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Browse providers</CardTitle><CardDescription>Find Deriv copy strategies.</CardDescription></CardHeader>
                <CardContent><Button asChild className="w-full"><Link to="/copy-trading">Open Copy Trading <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="pb-3"><CardTitle className="text-sm">My Deriv Copy</CardTitle><CardDescription>Pause, resume or stop active copies.</CardDescription></CardHeader>
                <CardContent><Button asChild variant="outline" className="w-full"><Link to="/copy-trading/my">My Copy Trading <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Botvio Robot</CardTitle><CardDescription>Use Botvio's automated signal source.</CardDescription></CardHeader>
                <CardContent><Button asChild variant="outline" className="w-full"><Link to="/botvio-robot"><Bot className="mr-2 h-4 w-4" /> Botvio Robot</Link></Button></CardContent>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm">Deriv connection history</CardTitle>
                  <CardDescription>{derivTokens.length} linked account(s) · {activeDeriv} active connection(s)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchConnections()}><RefreshCw className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {connections && connections.length > 0 ? connections.map((conn: any) => (
                  <div key={conn.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${conn.is_connected ? "bg-success" : "bg-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium">{conn.login_id || "Deriv account"}</p>
                        <p className="text-xs text-muted-foreground">{conn.connection_type} · {conn.env}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={conn.is_connected ? "default" : "secondary"}>{conn.is_connected ? "Connected" : "Disconnected"}</Badge>
                      {conn.is_connected && (
                        <Button size="sm" variant="outline" disabled={busyConnId === conn.id} onClick={() => disconnectConnection(conn.id)}>
                          <Power className="mr-1 h-3.5 w-3.5" /> Disconnect
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" disabled={busyConnId === conn.id} onClick={() => deleteConnection(conn.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">No Deriv connection saved yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mt5" className="space-y-5">
            <Card className="glass-card border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Cloud className="h-5 w-5 text-primary" /> MT5 Copy Trading is now TradeCopy Cloud</CardTitle>
                <CardDescription>
                  This is the new MT5 route. Connect a master or follower account, configure risk, then start copying.
                  No BOTVIO Bridge EA, Terminal UID or personal VPS is required for TradeCopy.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {[
                  ["1", "Connect MT5", "Enter your MT5 account details securely."],
                  ["2", "Choose source", "Botvio Robot or an approved provider."],
                  ["3", "Start Copying", "Set risk controls and activate when ready."],
                ].map(([n, t, d]) => (
                  <div key={n} className="rounded-xl border border-border/60 bg-background/50 p-3">
                    <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{n}</div>
                    <p className="text-sm font-semibold">{t}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{d}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <FollowerTradeCopyPanel />
            <ProviderTradingAccountCard />
            <ProviderTradingAccountCard robot />

            <Accordion type="single" collapsible className="rounded-xl border border-border/60 px-4">
              <AccordionItem value="legacy" className="border-0">
                <AccordionTrigger className="py-4 text-sm">
                  <span className="flex items-center gap-2"><Wrench className="h-4 w-4 text-muted-foreground" /> Legacy MT5 Bridge — existing users only</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-5">
                  <Alert className="border-warning/30 bg-warning/5">
                    <Info className="h-4 w-4 text-warning" />
                    <AlertTitle>Legacy route retained for existing Bridge users</AlertTitle>
                    <AlertDescription className="text-xs">
                      New MT5 copy-trading setups should use TradeCopy Cloud above. The Bridge EA/VPS tools remain here only so existing installations are not stranded.
                    </AlertDescription>
                  </Alert>
                  <MT5BridgeSetupWizard />
                  <Mt5AutoExecuteCard />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <p className="text-center text-[11px] text-muted-foreground">
              MT5 copy trading carries real risk of loss. Test with a demo account before enabling live copying.
            </p>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Connections;
