import { useEffect, useMemo, useState } from "react";
import { useDeriv } from "@/contexts/DerivContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const DEFAULT_SYMBOLS = ["R_100", "R_50", "R_25", "R_10", "frxXAUUSD", "frxEURUSD", "cryBTCUSD"];

export const DerivPanel = () => {
  const { connected, authorized, balance, error, loading, connect, disconnect, subscribeTicks, unsubscribeTicks, lastTick } =
    useDeriv();

  const envAppId = (import.meta as any).env?.VITE_DERIV_APP_ID as string | undefined;
  const envToken = (import.meta as any).env?.VITE_DERIV_API_TOKEN as string | undefined;

  const [token, setToken] = useState(envToken ?? "");
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOLS[0]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (line: string) => {
    setLogs((prev) => [line, ...prev].slice(0, 12));
  };

  useEffect(() => {
    if (error) addLog(`Error: ${error}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    if (lastTick) {
      addLog(`Tick ${lastTick.symbol}: ${lastTick.quote}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTick?.epoch]);

  const canConnect = !!token.trim() && !loading && !authorized;
  const canDisconnect = !!connected;
  const canSubscribe = authorized && !loading;
  const canUnsubscribe = authorized && !loading;

  const balanceText = useMemo(() => {
    if (!balance) return "—";
    return `${balance.currency} ${balance.balance.toFixed(2)}`;
  }, [balance]);

  return (
    <section className="glass-card p-4 space-y-3">
      <header className="space-y-1">
        <h3 className="font-semibold">Deriv Panel</h3>
        <p className="text-xs text-muted-foreground">
          App ID: <span className="font-mono">{envAppId ?? "(set VITE_DERIV_APP_ID)"}</span>
        </p>
      </header>

      <div className="space-y-2">
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="DERIV API TOKEN"
          type="password"
          disabled={loading || authorized}
        />

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="default"
            onClick={async () => {
              addLog("Connecting + Authorizing...");
              try {
                const b = await connect(token.trim());
                addLog(`Authorized: ${b.loginid}`);
              } catch (e: any) {
                addLog(`Connect failed: ${e?.message || "Unknown"}`);
              }
            }}
            disabled={!canConnect}
          >
            Connect
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              disconnect();
              addLog("Disconnected");
            }}
            disabled={!canDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Balance</span>
          <span className="font-mono text-sm">{balanceText}</span>
        </div>

        <Select value={symbol} onValueChange={setSymbol}>
          <SelectTrigger className="bg-secondary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEFAULT_SYMBOLS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              addLog(`Subscribe ticks: ${symbol}`);
              await subscribeTicks(symbol);
            }}
            disabled={!canSubscribe}
          >
            Start Ticks
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              addLog(`Unsubscribe ticks: ${symbol}`);
              await unsubscribeTicks(symbol);
            }}
            disabled={!canUnsubscribe}
          >
            Stop Ticks
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status</span>
          <span
            className={cn(
              "text-xs font-medium",
              authorized ? "text-success" : connected ? "text-primary" : "text-muted-foreground",
            )}
          >
            {authorized ? "Authorized" : connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="rounded-md border border-border bg-secondary/30 p-2">
          <p className="text-xs text-muted-foreground mb-2">Logs (latest first)</p>
          <div className="space-y-1 max-h-40 overflow-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No logs yet.</p>
            ) : (
              logs.map((l, idx) => (
                <p key={idx} className="text-xs font-mono text-foreground/90 break-words">
                  {l}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
