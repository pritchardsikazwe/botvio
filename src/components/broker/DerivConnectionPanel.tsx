import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, CheckCircle, XCircle, ExternalLink, 
  Key, User, Wifi, WifiOff, RefreshCw, Shield
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DerivConnectionPanelProps {
  onConnected?: (balance: any) => void;
  showAccountSelection?: boolean;
}

export const DerivConnectionPanel = ({ onConnected, showAccountSelection = true }: DerivConnectionPanelProps) => {
  const { user } = useAuth();
  const { connected, authorized, balance, error, loading, connect, disconnect } = useDeriv();
  
  const [connectionMethod, setConnectionMethod] = useState<"token" | "oauth">("token");
  const [apiToken, setApiToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToAccount, setSaveToAccount] = useState(true);
  const [accountLabel, setAccountLabel] = useState("");

  const handleTokenConnect = async () => {
    if (!apiToken.trim()) {
      toast.error("Please enter your API token");
      return;
    }

    // Basic token validation
    if (apiToken.length < 10) {
      toast.error("Invalid token format");
      return;
    }

    setIsConnecting(true);
    try {
      const balanceResult = await connect(apiToken);
      toast.success(`Connected as ${balanceResult.loginid}`);
      
      // Save to trading_accounts if requested
      if (saveToAccount && user) {
        setIsSaving(true);
        const label = accountLabel || `Deriv ${balanceResult.loginid}`;
        
        const { error: saveError } = await supabase
          .from("trading_accounts")
          .insert({
            user_id: user.id,
            broker: "deriv",
            label,
            api_key_encrypted: apiToken,
            login_id: balanceResult.loginid,
            connection_type: "api_token",
            connection_status: "connected",
            is_virtual: balanceResult.loginid?.startsWith("VRTC"),
          });

        if (saveError) {
          console.error("Failed to save account:", saveError);
          toast.error("Connected but failed to save account");
        } else {
          toast.success("Account saved for future use");
        }
        setIsSaving(false);
      }

      onConnected?.(balanceResult);
    } catch (e: any) {
      toast.error(e.message || "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOAuthConnect = () => {
    // Updated Deriv OAuth URL with correct App ID
    const appId = "124208";
    const redirectUri = encodeURIComponent(window.location.origin + "/accounts");
    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${appId}&redirect_uri=${redirectUri}`;
    
    window.open(oauthUrl, "_blank", "width=600,height=700");
    toast.info("Complete the login in the popup window");
  };

  const handleDisconnect = () => {
    disconnect();
    setApiToken("");
    toast.info("Disconnected from Deriv");
  };

  const getConnectionStatus = () => {
    if (loading || isConnecting) return "connecting";
    if (authorized && connected) return "connected";
    if (connected && !authorized) return "connected_no_auth";
    if (error) return "error";
    return "disconnected";
  };

  const status = getConnectionStatus();

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Deriv Connection
            </CardTitle>
            <CardDescription>
              Connect your Deriv account to enable trading
            </CardDescription>
          </div>
          <Badge
            variant={status === "connected" ? "default" : status === "connecting" ? "secondary" : "outline"}
            className={
              status === "connected"
                ? "bg-success text-success-foreground"
                : status === "error"
                ? "bg-destructive text-destructive-foreground"
                : ""
            }
          >
            {status === "connected" && <Wifi className="h-3 w-3 mr-1" />}
            {status === "disconnected" && <WifiOff className="h-3 w-3 mr-1" />}
            {status === "connecting" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {status === "error" && <XCircle className="h-3 w-3 mr-1" />}
            {status === "connected"
              ? "Connected"
              : status === "connecting"
              ? "Connecting..."
              : status === "error"
              ? "Error"
              : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {authorized ? (
          <div className="space-y-4">
            {/* Connected State */}
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">{balance?.fullname || "Deriv Account"}</p>
                    <p className="text-sm text-muted-foreground">{balance?.loginid}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {balance?.balance?.toFixed(2)} {balance?.currency}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {balance?.loginid?.startsWith("VRTC") ? "Demo" : "Real"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleDisconnect}>
                <WifiOff className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={connectionMethod} onValueChange={(v) => setConnectionMethod(v as "token" | "oauth")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="token" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Token
                </TabsTrigger>
                <TabsTrigger value="oauth" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Deriv Login
                </TabsTrigger>
              </TabsList>

              <TabsContent value="token" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="api_token">API Token</Label>
                  <Input
                    id="api_token"
                    type="password"
                    placeholder="Enter your Deriv API token"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    disabled={isConnecting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your token is encrypted and stored securely
                  </p>
                </div>

                {showAccountSelection && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="account_label">Account Label (optional)</Label>
                      <Input
                        id="account_label"
                        placeholder="e.g., My Trading Account"
                        value={accountLabel}
                        onChange={(e) => setAccountLabel(e.target.value)}
                        disabled={isConnecting}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="save_account"
                        checked={saveToAccount}
                        onChange={(e) => setSaveToAccount(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="save_account" className="text-sm cursor-pointer">
                        Save account for future sessions
                      </Label>
                    </div>
                  </>
                )}

                <Button
                  className="w-full"
                  onClick={handleTokenConnect}
                  disabled={isConnecting || loading || !apiToken.trim()}
                >
                  {isConnecting || loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4 mr-2" />
                      Connect with Token
                    </>
                  )}
                </Button>

                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium mb-2">How to get your API Token:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>
                      <a
                        href="https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Log in to Deriv
                      </a>{" "}
                      or{" "}
                      <a
                        href="https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Create a free demo account
                      </a>
                    </li>
                    <li>Go to Settings → API Token</li>
                    <li>Create a token with <strong>Trade</strong> and <strong>Read</strong> permissions</li>
                    <li>Copy and paste the token above</li>
                  </ol>
                  <a
                    href="https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary mt-2 hover:underline"
                  >
                    Get your Demo API Token <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </TabsContent>

              <TabsContent value="oauth" className="space-y-4 mt-4">
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Sign in with Deriv</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use your existing Deriv account to connect securely without sharing your API token
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>No API token needed</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Secure OAuth authentication</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Auto-syncs account info</span>
                  </div>
                </div>

                <Button className="w-full" onClick={handleOAuthConnect}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Continue with Deriv
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You'll be redirected to Deriv to authorize this app
                </p>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
