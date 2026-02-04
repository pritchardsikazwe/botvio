import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  Link as LinkIcon, 
  Unlink, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ExternalLink,
  RefreshCw,
  Copy,
  Monitor
} from "lucide-react";
import { toast } from "sonner";
import { startDerivOAuthLogin } from "@/lib/derivAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Connections = () => {
  const { user } = useAuth();
  const derivContext = useDeriv();
  const [mt5TerminalUid, setMt5TerminalUid] = useState("");
  
  // Map deriv context properties
  const isConnected = derivContext.authorized;
  const isLoading = derivContext.loading;

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
    toast.success("Terminal UID copied!");
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
            {/* Current Connection Status */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Deriv Connection Status
                </CardTitle>
                <CardDescription>
                  Connect your Deriv account using OAuth for secure trading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking connection...
                  </div>
                ) : isConnected && connections && connections.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="font-medium text-success">Connected</span>
                      <Badge variant="outline">{connections[0]?.login_id || 'Active'}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Account Type</p>
                        <p className="font-medium">{connections[0]?.account_type || 'Standard'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Currency</p>
                        <p className="font-medium">{connections[0]?.currency || 'USD'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="font-medium">{derivContext.balance?.balance?.toFixed(2) || '---'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Environment</p>
                        <p className="font-medium">{connections[0]?.env === 'demo' ? 'Demo' : 'Real'}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => refetchConnections()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                      <Button variant="destructive" onClick={() => derivContext.disconnect()}>
                        <Unlink className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Not connected</span>
                    </div>
                    
                    <Button onClick={startDerivOAuthLogin} variant="gold">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Connect with Deriv OAuth
                    </Button>

                    <p className="text-xs text-muted-foreground">
                      You'll be redirected to Deriv to authorize BOTVIO to trade on your behalf.
                      Your token is encrypted and never exposed to the browser.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connection History */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Connection History</CardTitle>
                <CardDescription>All your Deriv connections</CardDescription>
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
                          <div className={`w-2 h-2 rounded-full ${
                            conn.is_connected ? 'bg-success' : 'bg-muted-foreground'
                          }`} />
                          <div>
                            <p className="font-medium">{conn.login_id || 'Unknown'}</p>
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
                  <p className="text-muted-foreground text-center py-8">
                    No connections yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mt5" className="space-y-6">
            {/* MT5 Bridge Setup */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  MT5 Bridge Setup
                </CardTitle>
                <CardDescription>
                  Connect your MetaTrader 5 terminal using the BOTVIO EA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Terminal UID */}
                <div className="space-y-2">
                  <Label>Your Terminal UID</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={`BOTVIO_${user?.id?.slice(0, 8).toUpperCase()}`}
                      readOnly
                      className="font-mono"
                    />
                    <Button variant="outline" onClick={copyTerminalUid}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this UID when configuring the BOTVIO EA in MetaTrader 5
                  </p>
                </div>

                {/* Setup Steps */}
                <div className="space-y-3">
                  <h4 className="font-medium">Setup Instructions</h4>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <Badge variant="outline" className="shrink-0">1</Badge>
                      <span>Download the BOTVIO_BridgeEA.ex5 file from the download section</span>
                    </li>
                    <li className="flex gap-3">
                      <Badge variant="outline" className="shrink-0">2</Badge>
                      <span>Copy it to your MT5 Experts folder (File → Open Data Folder → MQL5 → Experts)</span>
                    </li>
                    <li className="flex gap-3">
                      <Badge variant="outline" className="shrink-0">3</Badge>
                      <span>Restart MetaTrader 5 and attach the EA to any chart</span>
                    </li>
                    <li className="flex gap-3">
                      <Badge variant="outline" className="shrink-0">4</Badge>
                      <span>Enter your Terminal UID in the EA settings</span>
                    </li>
                    <li className="flex gap-3">
                      <Badge variant="outline" className="shrink-0">5</Badge>
                      <span>Enable "Allow WebRequest" in Tools → Options → Expert Advisors</span>
                    </li>
                    <li className="flex gap-3">
                      <Badge variant="outline" className="shrink-0">6</Badge>
                      <span>Add *.supabase.co to allowed URLs</span>
                    </li>
                  </ol>
                </div>

                <Button variant="outline" asChild>
                  <a href="#" download>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Download BOTVIO EA
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Connected MT5 Terminals */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Connected MT5 Terminals</CardTitle>
                <CardDescription>Your active MetaTrader 5 connections</CardDescription>
              </CardHeader>
              <CardContent>
                {mt5Accounts && mt5Accounts.length > 0 ? (
                  <div className="space-y-3">
                    {mt5Accounts.map((acc: any) => (
                      <div 
                        key={acc.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            acc.connection_status === 'connected' ? 'bg-success' : 'bg-muted-foreground'
                          }`} />
                          <div>
                            <p className="font-medium">{acc.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {acc.login_id} • {acc.permissions_json?.broker_name || 'MT5'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={acc.connection_status === 'connected' ? "default" : "secondary"}>
                          {acc.connection_status === 'connected' ? "Online" : "Offline"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No MT5 terminals connected yet. Follow the setup instructions above.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Connections;
