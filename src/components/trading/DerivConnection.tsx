import { useEffect, useMemo, useState, useRef } from "react";
import { useDeriv } from "@/contexts/DerivContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Key,
  Eye,
  EyeOff,
  Wallet,
  RefreshCw,
  LogOut,
  TrendingUp,
  TrendingDown,
  PlayCircle,
  StopCircle,
  AlertCircle,
  CheckCircle,
  Loader2,
  TestTube,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

// Deriv symbols for dropdown
const DERIV_SYMBOLS = [
  { value: "R_100", label: "Volatility 100 Index" },
  { value: "R_50", label: "Volatility 50 Index" },
  { value: "R_25", label: "Volatility 25 Index" },
  { value: "R_10", label: "Volatility 10 Index" },
  { value: "frxXAUUSD", label: "Gold / USD (XAUUSD)" },
  { value: "frxEURUSD", label: "EUR / USD" },
  { value: "frxGBPUSD", label: "GBP / USD" },
  { value: "frxUSDJPY", label: "USD / JPY" },
  { value: "cryBTCUSD", label: "Bitcoin / USD" },
  { value: "cryETHUSD", label: "Ethereum / USD" },
  { value: "BOOM500", label: "Boom 500 Index" },
  { value: "CRASH500", label: "Crash 500 Index" },
];

interface DerivConnectionProps {
  onSymbolChange?: (symbol: string) => void;
}

export const DerivConnection = ({ onSymbolChange }: DerivConnectionProps) => {
  const {
    connected,
    authorized,
    balance,
    error,
    loading,
    lastTick,
    connect,
    disconnect,
    subscribeTicks,
    unsubscribeTicks,
  } = useDeriv();

  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [symbol, setSymbol] = useState("R_100");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDemoAccount, setIsDemoAccount] = useState(true); // Default to demo for safety
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (line: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${line}`, ...prev].slice(0, 20));
  };

  // Log errors
  useEffect(() => {
    if (error) {
      addLog(`❌ Error: ${error}`);
    }
  }, [error]);

  // Log ticks
  useEffect(() => {
    if (lastTick) {
      addLog(`📊 ${lastTick.symbol}: ${lastTick.quote.toFixed(5)}`);
    }
  }, [lastTick?.epoch]);

  // Validate token format (basic check)
  const isValidToken = (t: string) => {
    const trimmed = t.trim();
    // Deriv tokens are typically 15+ alphanumeric characters
    return trimmed.length >= 10 && /^[a-zA-Z0-9]+$/.test(trimmed);
  };

  const handleConnect = async () => {
    const trimmedToken = token.trim();
    
    if (!trimmedToken) {
      toast.error("Please enter your Deriv API token");
      return;
    }

    if (!isValidToken(trimmedToken)) {
      toast.error("Invalid token format. Token should be alphanumeric and at least 10 characters.");
      return;
    }

    addLog("🔄 Connecting to Deriv API...");
    
    try {
      const bal = await connect(trimmedToken);
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
    setIsSubscribed(false);
    addLog("🔌 Disconnected");
    toast.info("Disconnected from Deriv");
  };

  const handleStartTicks = async () => {
    if (!authorized) {
      toast.error("Please connect first");
      return;
    }

    addLog(`▶️ Subscribing to ${symbol}...`);
    try {
      await subscribeTicks(symbol);
      setIsSubscribed(true);
      onSymbolChange?.(symbol);
      toast.success(`Subscribed to ${symbol}`);
    } catch (e: any) {
      addLog(`❌ Subscribe failed: ${e?.message}`);
      toast.error(e?.message || "Failed to subscribe");
    }
  };

  const handleStopTicks = async () => {
    addLog(`⏹️ Unsubscribing from ${symbol}...`);
    try {
      await unsubscribeTicks(symbol);
      setIsSubscribed(false);
      toast.info(`Unsubscribed from ${symbol}`);
    } catch (e: any) {
      addLog(`❌ Unsubscribe failed: ${e?.message}`);
    }
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

  const tickDisplay = useMemo(() => {
    if (!lastTick) return null;
    return {
      symbol: lastTick.symbol,
      price: lastTick.quote.toFixed(5),
    };
  }, [lastTick]);

  return (
    <div className="glass-card p-5 space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              authorized ? "bg-success/10" : "bg-primary/10"
            )}
          >
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
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                isDemoAccount
                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  : "bg-success/10 text-success border-success/20"
              )}
            >
              {isDemoAccount ? "Demo" : "Real"}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              authorized
                ? "bg-success/10 text-success border-success/20"
                : connected
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-muted text-muted-foreground"
            )}
          >
            {authorized ? "Authorized" : connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      {/* Authorized View */}
      {authorized && balanceDisplay ? (
        <div className="space-y-4">
          {/* Balance Card */}
          <div className="p-4 bg-gradient-to-r from-success/10 to-primary/10 rounded-xl border border-success/20">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-5 h-5 text-success" />
              <span className="text-sm text-muted-foreground">Account Balance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {balanceDisplay.currency === "USD" ? "$" : ""}
                {balanceDisplay.amount}
              </span>
              <span className="text-lg text-muted-foreground">{balanceDisplay.currency}</span>
            </div>
            {balanceDisplay.fullname && (
              <p className="text-xs text-muted-foreground mt-1">{balanceDisplay.fullname}</p>
            )}
          </div>

          {/* Live Tick Display */}
          {tickDisplay && (
            <div className="p-3 bg-secondary/50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3 text-primary animate-spin" />
                <span className="text-sm font-medium">{tickDisplay.symbol}</span>
              </div>
              <span className="font-mono text-lg font-semibold text-foreground">
                {tickDisplay.price}
              </span>
            </div>
          )}

          {/* Symbol Selection & Controls */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Trading Symbol</label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DERIV_SYMBOLS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleStartTicks}
                disabled={isSubscribed}
                className="gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                Start Ticks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopTicks}
                disabled={!isSubscribed}
                className="gap-2"
              >
                <StopCircle className="w-4 h-4" />
                Stop Ticks
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary/30 rounded-lg text-center">
              <TrendingUp className="w-4 h-4 text-success mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Ready to Trade</p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg text-center">
              <TrendingDown className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">
                {isSubscribed ? "Live Market" : "Idle"}
              </p>
            </div>
          </div>

          {/* Disconnect Button */}
          <Button variant="outline" onClick={handleDisconnect} className="w-full gap-2">
            <LogOut className="w-4 h-4" />
            Disconnect
          </Button>

          {/* Logs */}
          <div className="rounded-md border border-border bg-secondary/20 p-2">
            <p className="text-xs text-muted-foreground mb-2">Activity Log</p>
            <div className="space-y-1 max-h-32 overflow-auto text-xs font-mono">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No activity yet.</p>
              ) : (
                logs.map((l, idx) => (
                  <p key={idx} className="text-foreground/80 break-words">
                    {l}
                  </p>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      ) : (
        /* Not Authorized View */
        <div className="space-y-4">
          {/* Account Type Toggle */}
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              {isDemoAccount ? (
                <TestTube className="w-4 h-4 text-blue-500" />
              ) : (
                <DollarSign className="w-4 h-4 text-success" />
              )}
              <div>
                <Label htmlFor="account-type" className="text-sm font-medium">
                  {isDemoAccount ? "Demo Account" : "Real Account"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isDemoAccount 
                    ? "Practice with virtual funds" 
                    : "Trade with real money"}
                </p>
              </div>
            </div>
            <Switch
              id="account-type"
              checked={!isDemoAccount}
              onCheckedChange={(checked) => setIsDemoAccount(!checked)}
            />
          </div>

          {/* Demo Account Notice */}
          {isDemoAccount && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <TestTube className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-500">
                <p className="font-medium">Demo Mode Active</p>
                <p className="text-blue-400">You're using virtual funds. Perfect for learning and testing strategies without risk.</p>
              </div>
            </div>
          )}

          {/* Real Account Warning */}
          {!isDemoAccount && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="text-xs text-destructive">
                <p className="font-medium">Real Money Trading</p>
                <p>You will be trading with real funds. Losses are real. Trade responsibly.</p>
              </div>
            </div>
          )}

          {/* Token Input */}
          <div className="relative">
            <Input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={isDemoAccount ? "Paste your Demo API token..." : "Paste your Real API token..."}
              className="pr-10 bg-secondary/50 border-border focus:border-primary"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="flex items-start gap-2 p-3 bg-warning/5 border border-warning/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Get your {isDemoAccount ? "Demo" : "Real"} API token:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Log in to <a href="https://deriv.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Deriv.com</a></li>
                <li>Switch to your <strong>{isDemoAccount ? "Demo" : "Real"}</strong> account</li>
                <li>Go to Settings → API Token</li>
                <li>Create token with <strong>Trade</strong> permission</li>
              </ol>
              {isDemoAccount && (
                <p className="mt-2 text-primary">
                  💡 New to Deriv? <a href="https://deriv.com" target="_blank" rel="noopener noreferrer" className="underline">Create a free demo account</a> to get started!
                </p>
              )}
            </div>
          </div>

          {/* Supported Markets */}
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Supported markets:</p>
            <p>Synthetic Indices, Forex, Gold (XAUUSD), Crypto, Boom/Crash</p>
          </div>

          {/* Connect Button */}
          <Button
            onClick={handleConnect}
            disabled={!token.trim() || loading}
            className="w-full"
            variant="gold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Connect to Deriv
              </>
            )}
          </Button>

          {/* Logs (minimal in disconnected state) */}
          {logs.length > 0 && (
            <div className="rounded-md border border-border bg-secondary/20 p-2">
              <p className="text-xs text-muted-foreground mb-1">Recent Logs</p>
              <div className="space-y-0.5 max-h-20 overflow-auto text-xs font-mono">
                {logs.slice(0, 5).map((l, idx) => (
                  <p key={idx} className="text-foreground/70 break-words">
                    {l}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
