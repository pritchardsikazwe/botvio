import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useDeriv } from "@/contexts/DerivContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Key, Eye, EyeOff, Wallet, LogOut, Loader2,
  AlertCircle, CheckCircle, TestTube, DollarSign,
  ExternalLink, User, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { buildDerivOAuthUrl } from "@/config/derivEnv";
import { Alert, AlertDescription } from "@/components/ui/alert";

const OAUTH_BLOCKED_KEY = "deriv_oauth_blocked";

const wasOAuthBlocked = (): boolean => {
  try {
    const blocked = localStorage.getItem(OAUTH_BLOCKED_KEY);
    if (!blocked) return false;
    const data = JSON.parse(blocked);
    return Date.now() - data.timestamp < 60 * 60 * 1000;
  } catch { return false; }
};

interface DerivConnectionProps {
  onSymbolChange?: (symbol: string) => void;
}

export const DerivConnection = ({ onSymbolChange }: DerivConnectionProps) => {
  const {
    connected, authorized, balance, error, loading,
    connect, disconnect,
  } = useDeriv();

  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isDemoAccount, setIsDemoAccount] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<"oauth" | "token">(
    wasOAuthBlocked() ? "token" : "oauth"
  );
  const [showBlockedError, setShowBlockedError] = useState(wasOAuthBlocked());
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const autoConnectAttempted = useRef(false);

  // Auto-reconnect using stored OAuth token on mount
  useEffect(() => {
    if (authorized || loading || autoConnectAttempted.current) return;
    autoConnectAttempted.current = true;

    const storedToken = localStorage.getItem("deriv_oauth_token");
    if (storedToken && storedToken.length >= 10) {
      addLog("🔄 Auto-reconnecting with saved session...");
      connect(storedToken)
        .then((bal) => {
          addLog(`✅ Auto-connected: ${bal.loginid}`);
        })
        .catch(() => {
          addLog("⚠️ Saved session expired. Please reconnect.");
          localStorage.removeItem("deriv_oauth_token");
        });
    }
  }, [authorized, loading, connect]);

  const addLog = useCallback((line: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${line}`, ...prev].slice(0, 20));
  }, []);

  const handleOAuthBlocked = useCallback(() => {
    setShowBlockedError(true);
    setConnectionMethod("token");
    localStorage.setItem(OAUTH_BLOCKED_KEY, JSON.stringify({ timestamp: Date.now() }));
    toast.error("Deriv login blocked. Please use API Token instead.");
    addLog("⚠️ OAuth blocked - switch to API Token");
  }, [addLog]);

  useEffect(() => {
    if (error) {
      addLog(`❌ Error: ${error}`);
      if (error.includes("blocked") || error.includes("refused") || error.includes("ERR_BLOCKED")) {
        handleOAuthBlocked();
      }
    }
  }, [error, addLog, handleOAuthBlocked]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth") === "complete") {
      // handled elsewhere
    }
  }, []);

  const isValidToken = (t: string) => {
    const trimmed = t.trim();
    return trimmed.length >= 10 && /^[a-zA-Z0-9]+$/.test(trimmed);
  };

  const handleOAuthConnect = () => {
    setShowBlockedError(false);
    const oauthUrl = buildDerivOAuthUrl();
    addLog("🔄 Redirecting to Deriv login...");
    window.location.href = oauthUrl;
  };

  const handleTokenConnect = async () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) { toast.error("Please enter your Deriv API token"); return; }
    if (!isValidToken(trimmedToken)) { toast.error("Invalid token format."); return; }

    addLog("🔄 Connecting to Deriv API...");
    try {
      const bal = await connect(trimmedToken);
      // Persist token for auto-reconnect on next visit
      localStorage.setItem("deriv_oauth_token", trimmedToken);
      addLog(`✅ Authorized: ${bal.loginid}`);
      addLog(`💰 Balance: ${bal.currency} ${bal.balance.toFixed(2)}`);
      toast.success(`Connected! Balance: ${bal.currency} ${bal.balance.toFixed(2)}`);
    } catch (e: any) {
      addLog(`❌ Connection failed: ${e?.message || "Unknown error"}`);
      toast.error(e?.message || "Failed to connect");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setToken("");
    localStorage.removeItem("deriv_oauth_token");
    autoConnectAttempted.current = false;
    addLog("🔌 Disconnected");
    toast.info("Disconnected from Deriv");
  };

  const balanceDisplay = useMemo(() => {
    if (!balance) return null;
    return {
      amount: balance.balance.toFixed(2),
      currency: balance.currency,
      loginid: balance.loginid,
      fullname: balance.fullname,
    };
  }, [balance]);

  const isConnectedDemo = balance?.loginid?.startsWith("VRTC");

  return (
    <div className="glass-card p-5 space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", authorized ? "bg-success/10" : "bg-primary/10")}>
            <Key className={cn("w-5 h-5", authorized ? "text-success" : "text-primary")} />
          </div>
          <div>
            <h3 className="font-semibold">Deriv API</h3>
            <p className="text-xs text-muted-foreground">
              {authorized ? `Connected: ${balanceDisplay?.loginid}` : "Connect your broker"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {authorized && (
            <Badge variant="outline" className={cn("text-xs font-medium", isConnectedDemo ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-success/10 text-success border-success/20")}>
              {isConnectedDemo ? "🧪 Demo" : "💰 Real"}
            </Badge>
          )}
          <Badge variant="outline" className={cn("text-xs", authorized ? "bg-success/10 text-success border-success/20" : connected ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground")}>
            {authorized ? "Authorized" : connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      {/* Authorized View - Compact, NO symbol/ticks/ready/idle */}
      {authorized && balanceDisplay ? (
        <div className="space-y-4">
          <div className={cn("p-4 rounded-xl border", isConnectedDemo ? "bg-gradient-to-r from-blue-500/10 to-primary/10 border-blue-500/20" : "bg-gradient-to-r from-success/10 to-primary/10 border-success/20")}>
            <div className="flex items-center gap-3 mb-2">
              <Wallet className={cn("w-5 h-5", isConnectedDemo ? "text-blue-500" : "text-success")} />
              <span className="text-sm text-muted-foreground">Account Balance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{balanceDisplay.currency === "USD" ? "$" : ""}{balanceDisplay.amount}</span>
              <span className="text-lg text-muted-foreground">{balanceDisplay.currency}</span>
            </div>
            {balanceDisplay.fullname && <p className="text-xs text-muted-foreground mt-1">{balanceDisplay.fullname}</p>}
          </div>

          <Button variant="outline" onClick={handleDisconnect} className="w-full gap-2">
            <LogOut className="w-4 h-4" /> Disconnect
          </Button>
        </div>
      ) : (
        /* Not Authorized View */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setIsDemoAccount(false)} className={cn("flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all", !isDemoAccount ? "bg-success/10 border-success text-success" : "bg-secondary/30 border-border text-muted-foreground hover:border-success/50")}>
              <DollarSign className="w-4 h-4" /><span className="font-medium">Real</span>
            </button>
            <button onClick={() => setIsDemoAccount(true)} className={cn("flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all", isDemoAccount ? "bg-blue-500/10 border-blue-500 text-blue-500" : "bg-secondary/30 border-border text-muted-foreground hover:border-blue-500/50")}>
              <TestTube className="w-4 h-4" /><span className="font-medium">Demo</span>
            </button>
          </div>

          {isDemoAccount ? (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <TestTube className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-500"><p className="font-medium">Demo Mode</p><p className="text-blue-400">Practice with virtual $10,000 USD. No risk!</p></div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="text-xs text-destructive"><p className="font-medium">Real Money Trading</p><p>Profits and losses are real. Trade responsibly.</p></div>
            </div>
          )}

          <Tabs value={connectionMethod} onValueChange={(v) => setConnectionMethod(v as "oauth" | "token")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="oauth" className="flex items-center gap-2"><User className="h-4 w-4" />Login with Deriv</TabsTrigger>
              <TabsTrigger value="token" className="flex items-center gap-2"><Key className="h-4 w-4" />API Token</TabsTrigger>
            </TabsList>

            <TabsContent value="oauth" className="space-y-4 mt-4">
              {showBlockedError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Deriv login was blocked. Please use API Token instead.</AlertDescription>
                </Alert>
              )}
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">Login securely with your Deriv account. No token needed!</p>
                <Button onClick={handleOAuthConnect} disabled={loading} className="w-full" variant="gold" size="lg">
                  {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</>) : (<><ExternalLink className="w-4 h-4 mr-2" />Login with Deriv</>)}
                </Button>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Don't have an account?</p>
                <a href="https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm inline-flex items-center gap-1">
                  Create a free Deriv account <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </TabsContent>

            <TabsContent value="token" className="space-y-4 mt-4">
              <div className="relative">
                <Input type={showToken ? "text" : "password"} value={token} onChange={(e) => setToken(e.target.value)} placeholder={isDemoAccount ? "Paste your Demo API token..." : "Paste your Real API token..."} className="pr-10 bg-secondary/50 border-border focus:border-primary" disabled={loading} />
                <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" /><p className="text-xs text-destructive">{error}</p>
                </div>
              )}
              <div className="flex items-start gap-2 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Get your API token:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Log in to <a href="https://deriv.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Deriv.com</a></li>
                    <li>Go to Settings → API Token</li>
                    <li>Create token with <strong>Trade</strong> permission</li>
                  </ol>
                </div>
              </div>
              <Button onClick={handleTokenConnect} disabled={!token.trim() || loading} className="w-full" variant="gold">
                {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</>) : (<><CheckCircle className="w-4 h-4 mr-2" />Connect with Token</>)}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
            <p className="font-medium mb-1">Supported markets:</p>
            <p>Synthetic Indices, Forex, Gold (XAUUSD), Crypto, Boom/Crash</p>
          </div>
        </div>
      )}
    </div>
  );
};
