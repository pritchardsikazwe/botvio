import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExchangeAccount, useSaveExchangeKeys, useTestExchangeConnection } from "@/hooks/useBinance";
import {
  Key, Eye, EyeOff, CheckCircle, XCircle, Loader2, Shield, AlertTriangle, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

const BinanceSettings = () => {
  const { user } = useAuth();
  const { data: account, isLoading: accountLoading } = useExchangeAccount();
  const saveKeys = useSaveExchangeKeys();
  const testConn = useTestExchangeConnection();

  const [label, setLabel] = useState("Binance");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleSave = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      toast.error("API Key and Secret are required");
      return;
    }
    try {
      await saveKeys.mutateAsync({ label, api_key: apiKey, api_secret: apiSecret });
      toast.success("API keys saved securely");
      setApiKey("");
      setApiSecret("");
    } catch (e: any) {
      toast.error(e.message || "Failed to save keys");
    }
  };

  const handleTest = async () => {
    if (!account?.id) {
      toast.error("Save your API keys first");
      return;
    }
    setTestResult(null);
    try {
      const result = await testConn.mutateAsync(account.id);
      setTestResult(result);
      if (result?.ok) {
        toast.success(`Connected! canTrade: ${result.canTrade}`);
      } else {
        toast.error(result?.error || "Test failed");
      }
    } catch (e: any) {
      toast.error(e.message || "Test failed");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Please sign in</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Binance Connection</h1>
          <p className="text-muted-foreground">
            Connect your Binance account for automated spot trading
          </p>
        </div>

        {/* Security Notice */}
        <Alert className="mb-6 border-warning/30 bg-warning/5">
          <Shield className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            <strong>Security:</strong> Your API keys are encrypted at rest using AES-256. 
            Only enable <strong>Spot Trading</strong> and <strong>Read</strong> permissions. 
            <strong className="text-destructive"> Never enable Withdrawals.</strong>
          </AlertDescription>
        </Alert>

        {/* Current Status */}
        {account && (
          <Card className="glass-card mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Current Connection
                </CardTitle>
                <Badge variant={account.status === "active" ? "default" : "secondary"}>
                  {account.status === "active" ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" /> Disabled</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Label:</span>
                  <span className="ml-2 font-medium">{account.label}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Connected:</span>
                  <span className="ml-2">{new Date(account.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={testConn.isPending}
                >
                  {testConn.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Testing...</>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg text-sm ${testResult.ok ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                  {testResult.ok ? (
                    <div className="space-y-1">
                      <p className="font-medium text-success flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Connection Successful
                      </p>
                      <p>Can Trade: {testResult.canTrade ? "Yes" : "No"}</p>
                      <p>Withdraw Enabled: {testResult.canWithdraw ? "⚠️ Yes (disable this!)" : "No ✓"}</p>
                      {testResult.balances?.length > 0 && (
                        <div>
                          <p className="font-medium mt-2">Balances:</p>
                          {testResult.balances.map((b: any) => (
                            <p key={b.asset} className="font-mono text-xs">
                              {b.asset}: {b.free} (locked: {b.locked})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-destructive flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> {testResult.error}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add/Update Keys */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{account ? "Update API Keys" : "Connect Binance"}</CardTitle>
            <CardDescription>
              {account
                ? "Enter new keys to update your connection"
                : "Enter your Binance API credentials to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="My Binance Account"
              />
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Your Binance API Key"
                type="text"
              />
            </div>

            <div className="space-y-2">
              <Label>API Secret</Label>
              <div className="relative">
                <Input
                  value={apiSecret}
                  onChange={e => setApiSecret(e.target.value)}
                  placeholder="Your Binance API Secret"
                  type={showSecret ? "text" : "password"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-2">
              <p className="font-medium">How to get your Binance API Key:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Log in to Binance.com</li>
                <li>Go to Account → API Management</li>
                <li>Create a new API key</li>
                <li>Enable <strong>Spot Trading</strong> and <strong>Read</strong> only</li>
                <li><strong className="text-destructive">Do NOT enable Withdrawals</strong></li>
                <li>Set IP restrictions if possible</li>
              </ol>
              <a
                href="https://www.binance.com/en/my/settings/api-management"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
              >
                Open Binance API Settings <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saveKeys.isPending || !apiKey.trim() || !apiSecret.trim()}
            >
              {saveKeys.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Encrypting & Saving...</>
              ) : (
                <><Key className="h-4 w-4 mr-2" /> {account ? "Update Keys" : "Save & Connect"}</>
              )}
            </Button>

            {testResult?.canWithdraw && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your API key has withdrawal permission enabled. For security, please disable it in your Binance settings.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BinanceSettings;
