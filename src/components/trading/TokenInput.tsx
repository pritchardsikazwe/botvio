import { useState, useEffect } from "react";
import { Key, Eye, EyeOff, Check, AlertCircle, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeriv } from "@/contexts/DerivContext";
import { toast } from "sonner";

interface TokenInputProps {
  onTokenSubmit: (token: string) => void;
}

export const TokenInput = ({ onTokenSubmit }: TokenInputProps) => {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const { connect, disconnect, authorized, balance, loading, error } = useDeriv();

  const handleSubmit = async () => {
    if (!token.trim()) {
      toast.error("Please enter your Deriv API token");
      return;
    }

    try {
      const balanceData = await connect(token);
      toast.success(`Connected! Balance: ${balanceData.currency} ${balanceData.balance.toFixed(2)}`);
      onTokenSubmit(token);
    } catch (err: any) {
      toast.error(err.message || "Failed to connect");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setToken("");
    toast.info("Disconnected from Deriv");
  };

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          authorized ? "bg-success/10" : "bg-primary/10"
        }`}>
          <Key className={`w-5 h-5 ${authorized ? "text-success" : "text-primary"}`} />
        </div>
        <div>
          <h3 className="font-semibold">Deriv API Connection</h3>
          <p className="text-sm text-muted-foreground">
            {authorized ? "Connected to Deriv" : "Connect your broker token"}
          </p>
        </div>
      </div>

      {authorized && balance ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
            <Check className="w-5 h-5 text-success" />
            <div className="flex-1">
              <p className="font-semibold text-success">Connected</p>
              <p className="text-sm text-muted-foreground">{balance.loginid}</p>
            </div>
          </div>

          {/* Balance Display */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-success/10 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Account Balance</p>
            <p className="text-2xl font-bold">
              {balance.currency === "USD" ? "$" : ""}{balance.balance.toFixed(2)} 
              <span className="text-sm font-normal text-muted-foreground ml-1">{balance.currency}</span>
            </p>
          </div>

          <Button
            onClick={handleDisconnect}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your Deriv API token here..."
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

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-warning/5 border border-warning/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Get your token from Deriv:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Log in to Deriv.com</li>
                <li>Go to Settings → API Token</li>
                <li>Create token with Trade permission</li>
              </ol>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
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
              "Connect to Deriv"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
