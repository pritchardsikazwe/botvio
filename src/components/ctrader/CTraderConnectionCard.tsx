import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, ExternalLink, ShieldCheck, CircleAlert } from "lucide-react";

export function CTraderConnectionCard() {
  const [showSetup, setShowSetup] = useState(false);
  const clientId = import.meta.env.VITE_CTRADER_CLIENT_ID as string | undefined;
  const redirectUri = import.meta.env.VITE_CTRADER_REDIRECT_URI as string | undefined;
  const configured = Boolean(clientId?.trim() && redirectUri?.trim());

  const startDemoAuthorization = () => {
    if (!clientId || !redirectUri) return;
    const state = crypto.randomUUID();
    sessionStorage.setItem("ctrader_oauth_state", state);
    const authorizeUrl = new URL("https://id.ctrader.com/my/settings/openapi/grantingaccess/");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("scope", "accounts");
    authorizeUrl.searchParams.set("product", "web");
    authorizeUrl.searchParams.set("state", state);
    window.location.assign(authorizeUrl.toString());
  };

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
            <p className="text-xs text-muted-foreground">Application setup</p>
            <p className="mt-1 font-medium">{configured ? "Client ID and callback configured" : "Registration required"}</p>
          </div>
        </div>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Read-only connection test</AlertTitle>
          <AlertDescription>
            Botvio requests the cTrader accounts permission only. It verifies the demo API connection and account authorization. It does not place, modify or close trades, and does not save an access token.
          </AlertDescription>
        </Alert>

        {!configured && (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>cTrader application setup is required</AlertTitle>
            <AlertDescription>
              Register and obtain approval for a cTrader Open API application. Configure the public Client ID and exact HTTPS callback URL. Store the Client Secret only as a Supabase Edge Function secret, never in frontend variables.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={startDemoAuthorization} disabled={!configured}>
            Connect demo account
          </Button>
          <Button variant="outline" onClick={() => setShowSetup((value) => !value)}>
            {showSetup ? "Hide setup checklist" : "View setup checklist"}
          </Button>
          <Button variant="outline" asChild>
            <a href="https://openapi.ctrader.com/" target="_blank" rel="noreferrer">
              Open cTrader API portal <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>

        {showSetup && (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Register the application in the cTrader Open API portal and wait for approval.</li>
            <li>Add the exact callback URL: https://botvio.live/ctrader/callback</li>
            <li>Configure VITE_CTRADER_CLIENT_ID and VITE_CTRADER_REDIRECT_URI in the frontend environment.</li>
            <li>Configure CTRADER_CLIENT_ID, CTRADER_CLIENT_SECRET and CTRADER_REDIRECT_URI as Supabase Edge Function secrets.</li>
            <li>After configuration, sign in to Botvio and use Connect demo account to grant account-read permission.</li>
          </ol>
        )}

        <p className="text-xs text-muted-foreground">
          The connection button stays disabled until the public application ID and callback URL are configured. The secure server test requires the server-side Client Secret. No deployment or order execution is enabled by this change.
        </p>
      </CardContent>
    </Card>
  );
}
