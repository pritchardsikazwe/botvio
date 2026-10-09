import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, ExternalLink, ShieldCheck, CircleAlert } from "lucide-react";

/**
 * Read-only cTrader Open API onboarding scaffold.
 * No MT5/TradeCopy integration, token storage, or order execution is performed here.
 * OAuth must remain disabled until the app is registered and its server-side exchange
 * endpoint has been implemented and configured.
 */
export function CTraderConnectionCard() {
  const [showSetup, setShowSetup] = useState(false);
  const clientId = import.meta.env.VITE_CTRADER_CLIENT_ID as string | undefined;
  const redirectUri = import.meta.env.VITE_CTRADER_REDIRECT_URI as string | undefined;
  const configured = Boolean(clientId?.trim() && redirectUri?.trim());

  return (
    <Card id="ctrader-connection" className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">cTrader Open API</CardTitle>
          <Badge variant="outline">Separate integration</Badge>
          <Badge variant="secondary">Read-only test phase</Badge>
        </div>
        <CardDescription>
          Connect and verify a cTrader demo account independently. This does not use MT5 or TradeCopy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Environment</p>
            <p className="mt-1 font-medium">Demo first</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Order execution</p>
            <p className="mt-1 font-medium">Disabled</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">API credentials</p>
            <p className="mt-1 font-medium">{configured ? "Frontend settings found" : "Setup required"}</p>
          </div>
        </div>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Safe connection test</AlertTitle>
          <AlertDescription>
            The first test will request account-read permission only. Botvio will not place, modify, or close trades.
          </AlertDescription>
        </Alert>

        {!configured && (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>cTrader app setup is not complete</AlertTitle>
            <AlertDescription>
              Register and obtain approval for a cTrader Open API application, then configure its public client ID and exact redirect URI. The client secret must be stored only as a Supabase server-side secret, never in VITE_ variables.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowSetup((value) => !value)}>
            {showSetup ? "Hide setup checklist" : "View setup checklist"}
          </Button>
          <Button asChild>
            <a href="https://openapi.ctrader.com/" target="_blank" rel="noreferrer">
              Open cTrader API portal <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>

        {showSetup && (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Register a cTrader Open API application and wait for approval.</li>
            <li>Set the exact HTTPS callback URL in the cTrader application settings.</li>
            <li>Configure VITE_CTRADER_CLIENT_ID and VITE_CTRADER_REDIRECT_URI for the frontend.</li>
            <li>Store CTRADER_CLIENT_SECRET in Supabase Edge Function secrets only.</li>
            <li>Implement the server-side OAuth code exchange and account-read API handshake before enabling the actual Test Connection action.</li>
          </ol>
        )}

        <p className="text-xs text-muted-foreground">
          This is a setup/readiness panel only. A successful connection has not yet been established; the live test button will be enabled after the secure callback and account verification endpoint are implemented.
        </p>
      </CardContent>
    </Card>
  );
}
