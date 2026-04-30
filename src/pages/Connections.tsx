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
import { Wallet, RefreshCw, Monitor } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
