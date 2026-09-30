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
import { TradingConnectionsCenter } from "@/components/tradecopy/TradingConnectionsCenter";
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

        <TradingConnectionsCenter />
 </Tabs>
      </main>
    </div>
  );
};

export default Connections;
