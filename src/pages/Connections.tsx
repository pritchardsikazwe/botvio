import { useState } from "react";
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
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Connections = () => {
  const { user } = useAuth();
  const { derivTokens, switchDerivToken, removeDerivToken } = useDeriv();

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

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to manage connections</h1>
        </div>
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

            {/* Multi-Account Switcher */}
            {derivTokens.length > 0 && (
              <AccountSwitcher
                tokens={derivTokens}
                onActivate={switchDerivToken}
                onRemove={removeDerivToken}
              />
            )}

            {/* Connection (OAuth or Token) */}
            <DerivConnectionPanel />

            {/* Connection History */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Connection History</CardTitle>
                    <CardDescription>All your saved Deriv connections</CardDescription>
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
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
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
                        <Badge variant={conn.is_connected ? "default" : "secondary"}>
                          {conn.is_connected ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No connections yet</p>
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
