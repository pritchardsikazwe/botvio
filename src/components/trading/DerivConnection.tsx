import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useDeriv } from "@/contexts/DerivContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Key, Eye, EyeOff, Wallet, LogOut, Loader2,
  AlertCircle, CheckCircle, DollarSign,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const DERIV_AFFILIATE_LINK = "https://deriv.com/signup/?utm_source=botvio&utm_medium=affiliate&utm_campaign=CU23827";

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
  const [logs, setLogs] = useState<string[]>([]);
  const autoConnectAttempted = useRef(false);

  // Auto-reconnect using stored token on mount
  useEffect(() => {
    if (authorized || loading || autoConnectAttempted.current) return;
    autoConnectAttempted.current = true;

    const storedToken = localStorage.getItem("deriv_pat_token");
    if (storedToken && storedToken.length >= 10) {
      addLog("🔄 Auto-reconnecting with saved session...");
      connect(storedToken)
        .then((bal) => {
          addLog(`✅ Auto-connected: ${bal.loginid}`);
        })
        .catch(() => {
          addLog("⚠️ Saved session expired. Please reconnect.");
          localStorage.removeItem("deriv_pat_token");
        });
    }
  }, [authorized, loading, connect]);

  const addLog = useCallback((line: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${line}`, ...prev].slice(0, 20));
  }, []);

  useEffect(() => {
    if (error) addLog(`❌ Error: ${error}`);
  }, [error, addLog]);

  const isValidToken = (t: string) => {
    const trimmed = t.trim();
    // Deriv PATs may include letters, digits, hyphens, and underscores
    return trimmed.length >= 10 && /^[A-Za-z0-9_-]+$/.test(trimmed);
  };

  const handleTokenConnect = async () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) { toast.error("Please enter your Deriv PAT"); return; }
    if (!isValidToken(trimmedToken)) { toast.error("Invalid token format."); return; }

    addLog("🔄 Connecting to Deriv API...");
    try {
      const bal = await connect(trimmedToken);
      localStorage.setItem("deriv_pat_token", trimmedToken);
      addLog(`✅ Authorized: ${bal.loginid}`);
      addLog(`💰 Balance: ${bal.currency} ${bal.balance.toFixed(2)}`);
      toast.success(`Connected! Balance: ${bal.currency} ${bal.balance.toFixed(2)}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to connect";
      addLog(`❌ Connection failed: ${message}`);
      toast.error(message);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setToken("");
    localStorage.removeItem("deriv_pat_token");
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
              {authorized ? `Connected: ${balanceDisplay?.loginid}` : "Connect with API Token"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {authorized && (
            <Badge variant="outline" className={cn("text-xs font-medium", isConnectedDemo ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-success/10 text-success border-success/20")}>
              {isConnectedDemo ? "🧪 Demo" : "💰 Real"}
            </Badge>
          )}
          <Badge variant="outline" className={cn("text-xs", authorized ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground")}>
            {authorized ? "Authorized" : "Disconnected"}
          </Badge>
        </div>
      </div>

      {/* Authorized View */}
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
        /* Not Authorized View - Token Only */
        <div className="space-y-4">
          {/* Real Token Input */}
          <div className="p-3 bg-success/5 border border-success/20 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">💰 Real Account</span>
            </div>
            <div className="relative">
              <Input type={showToken ? "text" : "password"} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste your API token..." className="pr-10 bg-background/50 border-border focus:border-primary text-sm" disabled={loading} />
              <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded">
                <AlertCircle className="w-3 h-3 text-destructive mt-0.5 shrink-0" /><p className="text-xs text-destructive">{error}</p>
              </div>
            )}
            <Button onClick={handleTokenConnect} disabled={!token.trim() || loading} className="w-full" variant="gold" size="sm">
              {loading ? (<><Loader2 className="w-3 h-3 mr-1 animate-spin" />Connecting...</>) : (<><CheckCircle className="w-3 h-3 mr-1" />Connect Real Account</>)}
            </Button>
          </div>

          {/* Get Token Instructions */}
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

          {/* Create Account Affiliate Link */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">Don't have a Deriv account?</p>
            <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm inline-flex items-center gap-1 font-medium">
              Create Free Deriv Account <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
            <p className="font-medium mb-1">Supported markets:</p>
            <p>Synthetic Indices, Forex, Gold (XAUUSD), Crypto, Boom/Crash</p>
          </div>
        </div>
      )}
    </div>
  );
};
