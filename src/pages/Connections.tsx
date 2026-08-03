import { useState } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { Header } from "@/components/trading/Header";
import { DerivConnectionPanel } from "@/components/broker/DerivConnectionPanel";
import { AccountSwitcher } from "@/components/trading/AccountSwitcher";
import MT5BridgeSetupWizard from "@/components/broker/MT5BridgeSetupWizard";
import { Mt5AutoExecuteCard } from "@/components/broker/Mt5AutoExecuteCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Wallet,
  RefreshCw,
  Monitor,
  Info,
  ShieldCheck,
  Zap,
  Clock,
  HelpCircle,
  ExternalLink,
  Copy,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Connections = () => {
  const { user } = useAuth();
  const { derivTokens, switchDerivToken, removeDerivToken } = useDeriv();
  const [authOpen, setAuthOpen] = useState(false);
  const [busyConnId, setBusyConnId] = useState<string | null>(null);

  // Fetch all connections
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

  // Fetch MT5 accounts
  const { data: mt5Accounts } = useQuery({
    queryKey: ["mt5-accounts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("trading_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("broker", "mt5")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const copyTerminalUid = () => {
    const uid = `BOTVIO_${user?.id?.slice(0, 8).toUpperCase()}`;
    navigator.clipboard.writeText(uid);
    toast.success("Terminal UID copied", { description: uid });
  };

  const scrollToConnect = () => {
    document.getElementById("deriv-connect")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const disconnectConnection = async (id: string) => {
    setBusyConnId(id);
    try {
      const { error } = await supabase
        .from("deriv_connections")
        .update({ is_connected: false })
        .eq("id", id);
      if (error) throw error;
      toast.success("Connection disconnected");
      refetchConnections();
    } catch (e: any) {
      toast.error("Could not disconnect", { description: e?.message });
    } finally {
      setBusyConnId(null);
    }
  };

  const deleteConnection = async (id: string) => {
    if (!window.confirm("Remove this connection permanently?")) return;
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
        <main className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Connect Deriv Binary Options</h1>
            <p className="text-muted-foreground">
              Sign in to Botvio to link your Deriv account via OAuth and trade Rise/Fall, Digits and
              Multipliers on Volatility, Boom and Crash indices — straight from your dashboard.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 mb-8">
            {[
              { icon: ShieldCheck, t: "Secure OAuth", d: "No passwords or tokens copied by hand." },
              { icon: Zap, t: "One-click trading", d: "Execute signals on demo or real accounts." },
              { icon: Clock, t: "~60 second setup", d: "Authorize once, revoke anytime." },
            ].map((b, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-4">
                <b.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-medium">{b.t}</p>
                <p className="text-xs text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Get started</CardTitle>
              <CardDescription>
                Create a free Botvio account or sign in to manage your broker connections.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => setAuthOpen(true)}>Sign in / Create account</Button>
              <Button variant="outline" onClick={() => (window.location.href = "/learn")}>
                Learn binary options first
              </Button>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="mt-6">
            <AccordionItem value="what" className="border-border">
              <AccordionTrigger className="text-sm">What can I trade once connected?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>• Rise/Fall and Higher/Lower contracts on Volatility 10–100 indices.</p>
                <p>• Matches/Differs, Even/Odd and Over/Under digit contracts.</p>
                <p>• Multipliers on Boom 500/1000 and Crash 500/1000.</p>
                <p>• Forex, metals and stock indices where your Deriv account allows it.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="safe" className="border-border">
              <AccordionTrigger className="text-sm">Is my Deriv account safe?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Botvio never sees your Deriv password. Access tokens are encrypted at rest on our
                servers, are never exposed to your browser, and can be revoked from this page or
                from your Deriv settings at any time.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </main>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Broker Connections</h1>
          <p className="text-muted-foreground">
            Connect your Deriv or MT5 accounts to enable automated trading
          </p>
        </div>

        {/* Global trust strip */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <ShieldCheck className="h-5 w-5 text-success mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Tokens encrypted at rest</p>
              <p className="text-xs text-muted-foreground">Server-side only — never exposed to your browser.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Revoke anytime</p>
              <p className="text-xs text-muted-foreground">Disconnect from this page or from your broker dashboard.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <Clock className="h-5 w-5 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">~2 minute setup</p>
              <p className="text-xs text-muted-foreground">Deriv via OAuth is one click. MT5 needs an EA install.</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="deriv" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="deriv" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Deriv API
            </TabsTrigger>
            <TabsTrigger value="mt5" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              MT5 Bridge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deriv" className="space-y-6">
            {/* Important notice — legacy PATs no longer work */}
            <Alert className="border-warning/40 bg-warning/5">
              <Info className="h-4 w-4 text-warning" />
              <AlertTitle>Deriv now requires OAuth — legacy API tokens are deprecated</AlertTitle>
              <AlertDescription className="text-sm text-muted-foreground">
                If your old API token suddenly stopped working, that's why. Click{" "}
                <strong>Connect with Deriv</strong> below to authorize Botvio in one step —
                no token copying, no expiry headaches.
              </AlertDescription>
            </Alert>

            {/* How to connect — step by step */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  How to connect your Deriv account
                </CardTitle>
                <CardDescription>3 steps · ~60 seconds · works on demo and real</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  {[
                    {
                      t: "Click \"Connect with Deriv\"",
                      d: "We'll send you to Deriv to log in securely. No password ever touches Botvio.",
                    },
                    {
                      t: "Approve Botvio's access",
                      d: "Deriv asks once. You can revoke from your Deriv settings at any time.",
                    },
                    {
                      t: "Pick your active account",
                      d: "All your demo & real accounts appear in the switcher above. Toggle the one Botvio should trade with.",
                    },
                  ].map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium">{s.t}</p>
                        <p className="text-muted-foreground">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <Accordion type="single" collapsible className="mt-4">
                  <AccordionItem value="trouble" className="border-border">
                    <AccordionTrigger className="text-sm">Having trouble connecting?</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                      <p>• Sign out of all Deriv tabs first, then retry — mixed sessions are the #1 cause of failures.</p>
                      <p>• Disable popup blockers and ad-blockers for botvio.live and deriv.com.</p>
                      <p>• If "AccountNotFound" appears, the account you picked isn't owned by the Deriv login you used. Switch login.</p>
                      <p>
                        Still stuck? Email{" "}
                        <a href="mailto:info@botvio.live" className="text-primary hover:underline">
                          info@botvio.live
                        </a>{" "}
                        with a screenshot.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Connections manager summary */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Connections Manager</CardTitle>
                    <CardDescription>
                      {derivTokens.length} linked account{derivTokens.length === 1 ? "" : "s"} ·{" "}
                      {(connections ?? []).filter((c: any) => c.is_connected).length} active connection
                      {(connections ?? []).filter((c: any) => c.is_connected).length === 1 ? "" : "s"}
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={scrollToConnect}>
                    <Plus className="h-4 w-4 mr-1" /> Add Deriv account
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pt-0">
                <Button size="sm" onClick={() => (window.location.href = "/rise-fall")}>
                  <Zap className="h-4 w-4 mr-1" /> Trade Rise &amp; Fall
                </Button>
                <Button size="sm" variant="outline" onClick={() => (window.location.href = "/deriv-app")}>
                  Open Deriv workspace
                </Button>
              </CardContent>
            </Card>

            {/* Multi-Account Switcher */}
            {derivTokens.length > 0 && (
              <AccountSwitcher
                tokens={derivTokens}
                onActivate={switchDerivToken}
                onRemove={removeDerivToken}
              />
            )}

            {/* Connection (OAuth or Token) */}
            <div id="deriv-connect">
              <DerivConnectionPanel />
            </div>

            {/* Connection History */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Saved Connections</CardTitle>
                    <CardDescription>View, disconnect or remove your Deriv connections</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchConnections()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {connections && connections.length > 0 ? (
                  <div className="space-y-3">
                    {connections.map((conn: any) => (
                      <div
                        key={conn.id}
                        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              conn.is_connected ? "bg-success" : "bg-muted-foreground"
                            }`}
                          />
                          <div>
                            <p className="font-medium">{conn.login_id || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {conn.connection_type} • {conn.env}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={conn.is_connected ? "default" : "secondary"}>
                            {conn.is_connected ? "Active" : "Inactive"}
                          </Badge>
                          {conn.is_connected && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => (window.location.href = "/rise-fall")}
                            >
                              <Zap className="h-3.5 w-3.5 mr-1" /> Trade Rise &amp; Fall
                            </Button>
                          )}
                          {conn.is_connected && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyConnId === conn.id}
                              onClick={() => disconnectConnection(conn.id)}
                            >
                              <Power className="h-3.5 w-3.5 mr-1" /> Disconnect
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={busyConnId === conn.id}
                            onClick={() => deleteConnection(conn.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-muted-foreground">No connections yet</p>
                    <Button size="sm" variant="outline" onClick={scrollToConnect}>
                      <Plus className="h-4 w-4 mr-1" /> Connect your first account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mt5" className="space-y-6">
            {/* How MT5 Bridge works */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  How the MT5 Bridge works
                </CardTitle>
                <CardDescription>
                  Two routes — pick the one that matches your setup
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <Badge variant="secondary" className="mb-2">Easiest</Badge>
                  <p className="font-medium">Managed Bridge (no VPS)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submit MT5 demo creds → we provision a dedicated terminal on our VPS within 24h.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <Badge className="mb-2">Self-hosted</Badge>
                  <p className="font-medium">Install the EA on your VPS/PC</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Download BOTVIO_BridgeEA.mq5, attach it to any chart, paste your Terminal UID.
                  </p>
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Your Terminal UID:</span>
                  <code className="px-2 py-1 rounded bg-muted text-xs font-mono">
                    BOTVIO_{user.id.slice(0, 8).toUpperCase()}
                  </code>
                  <Button variant="ghost" size="sm" onClick={copyTerminalUid}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <a
                    href="/BOTVIO_BridgeEA.mq5"
                    download
                    className="ml-auto text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Download EA <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>No VPS? Use our Managed Bridge</span>
                </CardTitle>
                <CardDescription>
                  Skip the EA install. Submit your MT5 demo credentials and our team will provision a dedicated terminal for you on our VPS — usually within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => (window.location.href = "/bridge-request")}>
                  Request Managed MT5 Bridge →
                </Button>
              </CardContent>
            </Card>
            <MT5BridgeSetupWizard />
            <Mt5AutoExecuteCard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Connections;
