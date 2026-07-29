import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeriv } from "@/contexts/DerivContext";
import { CheckCircle2, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Single authoritative connection banner. Never renders "Connect Deriv to trade"
 * when the socket is authenticated with a real account id in prod.
 */
export const DerivConnectionStatus = () => {
  const {
    isDerivConnected, status, accountId, environment, initializing,
    socketReadyState, refreshDerivConnection,
  } = useDeriv();

  if (initializing || status === "connecting") {
    return (
      <Card className="glass-card">
        <CardContent className="py-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking your Deriv connection…
        </CardContent>
      </Card>
    );
  }

  if (isDerivConnected) {
    return (
      <Card className="glass-card border-success/30">
        <CardContent className="py-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="font-semibold text-success">Deriv Connected</span>
            <Badge variant="outline" className="ml-auto text-[10px] bg-success/10 text-success border-success/20">
              Live
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Account: <span className="font-medium text-foreground">{accountId}</span></p>
          <p className="text-xs text-muted-foreground">Environment: <span className="font-medium text-foreground">{environment === "prod" ? "Production" : "—"}</span></p>
          <p className="text-xs text-muted-foreground">
            WebSocket: <span className="font-medium text-foreground">{socketReadyState === 1 ? "Connected" : "Closed"}</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-destructive/30">
      <CardContent className="py-5 flex flex-col items-center text-center gap-2">
        <WifiOff className="h-6 w-6 text-destructive" />
        <p className="font-semibold">Deriv Disconnected</p>
        <p className="text-sm text-muted-foreground">Reconnect to continue trading.</p>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => refreshDerivConnection()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Re-check
          </Button>
          <Button size="sm" variant="gold" asChild><Link to="/connections">Reconnect</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
};