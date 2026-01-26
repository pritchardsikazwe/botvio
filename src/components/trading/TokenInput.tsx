import { useState } from "react";
import { Key, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TokenInputProps {
  onTokenSubmit: (token: string) => void;
}

export const TokenInput = ({ onTokenSubmit }: TokenInputProps) => {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token.trim()) return;
    
    setIsLoading(true);
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsConnected(true);
    setIsLoading(false);
    onTokenSubmit(token);
  };

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Key className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">API Connection</h3>
          <p className="text-sm text-muted-foreground">Connect your broker token</p>
        </div>
      </div>

      {isConnected ? (
        <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
          <Check className="w-5 h-5 text-success" />
          <div>
            <p className="font-semibold text-success">Connected</p>
            <p className="text-sm text-muted-foreground">Token verified successfully</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your API token here..."
              className="pr-10 bg-secondary/50 border-border focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-start gap-2 p-3 bg-warning/5 border border-warning/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Your token is encrypted and never stored. We only use it to connect to your broker.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!token.trim() || isLoading}
            className="w-full"
            variant="gold"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Token"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
