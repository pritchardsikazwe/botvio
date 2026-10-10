import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleAlert, Loader2, ShieldCheck } from "lucide-react";

type TestResult = {
  ok: boolean;
  status?: string;
  environment?: string;
  accountCount?: number;
  accounts?: Array<{
    accountId: string;
    brokerName: string | null;
    traderLogin: number | string | null;
    isLive: boolean;
    selectedForTest: boolean;
  }>;
  permission?: string;
  message?: string;
  error?: string;
};

export default function CTraderCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<TestResult | null>(null);
  const [busy, setBusy] = useState(true);
  const started = useRef(false);
  const code = params.get("code");
  const returnedState = params.get("state");
  const oauthError = params.get("error_description") || params.get("error");

  useEffect(() => {
    if (authLoading || started.current) return;
    started.current = true;

    // Remove the one-time authorization code from the visible URL immediately.
    window.history.replaceState({}, document.title, window.location.pathname);

    const run = async () => {
      if (!user) {
        setResult({ ok: false, error: "Sign in to Botvio first, then start the cTrader connection again." });
        setBusy(false);
        return;
      }
      if (oauthError) {
        setResult({ ok: false, error: oauthError });
        setBusy(false);
        return;
      }
      const expectedState = sessionStorage.getItem("ctrader_oauth_state");
      sessionStorage.removeItem("ctrader_oauth_state");
      if (!returnedState || !expectedState || returnedState !== expectedState) {
        setResult({ ok: false, error: "The authorization state check failed. Return to Connections and start again." });
        setBusy(false);
        return;
      }
      if (!code) {
        setResult({ ok: false, error: "No cTrader authorization code was returned. Start the connection again." });
        setBusy(false);
        return;
      }

      const redirectUri = import.meta.env.VITE_CTRADER_REDIRECT_URI as string | undefined;
      if (!redirectUri) {
        setResult({ ok: false, error: "The cTrader callback URL is not configured in this build." });
        setBusy(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("ctrader-test-connection", {
        body: { code, redirectUri },
      });
      if (error) {
        setResult({ ok: false, error: error.message || "The secure cTrader connection test failed." });
      } else {
        setResult(data as TestResult);
      }
      setBusy(false);
    };

    void run();
  }, [authLoading, user, code, returnedState, oauthError]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-2xl px-3 py-8 sm:px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>cTrader demo connection test</CardTitle>
            </div>
            <CardDescription>
              Botvio requests account-read permission only. This test does not place, modify or close trades.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {busy ? (
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div>
                  <p className="font-medium">Verifying cTrader authorization</p>
                  <p className="text-sm text-muted-foreground">Checking the demo connection and account access.</p>
                </div>
              </div>
            ) : result?.ok ? (
              <>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Read-only demo connection successful</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Environment</p><p className="font-semibold">Demo</p></div>
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Accounts granted</p><p className="font-semibold">{result.accountCount ?? 0}</p></div>
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Permission</p><p className="font-semibold">Read-only</p></div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Authorized accounts returned by cTrader</h3>
                  {(result.accounts ?? []).map((account) => (
                    <div key={account.accountId} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="min-w-0">
                        <p className="font-medium">{account.brokerName || "cTrader account"}</p>
                        <p className="text-xs text-muted-foreground">Account ID: {account.accountId}</p>
                      </div>
                      <Badge variant={account.selectedForTest ? "default" : "outline"}>{account.selectedForTest ? "Tested" : account.isLive ? "Live (not tested)" : "Demo"}</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Alert variant="destructive">
                <CircleAlert className="h-4 w-4" />
                <AlertTitle>Connection test not completed</AlertTitle>
                <AlertDescription>{result?.error || "An unexpected error occurred."}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate("/connections")}>Return to Connections</Button>
              <Button asChild variant="outline"><Link to="/connections#ctrader-open-api">Back to setup</Link></Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
