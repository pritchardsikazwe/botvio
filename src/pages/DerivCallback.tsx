import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDerivConfig } from "@/config/derivEnv";
import { setDerivOAuthToken, getStoredCodeVerifier, getStoredOAuthState, clearPKCEStorage } from "@/lib/derivAuth";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const RETRY_COOLDOWN_KEY = "botvio_oauth_retry_at";
const OAUTH_COOLDOWN_KEY = "botvio_oauth_cooldown_until";

export default function DerivCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing Deriv connection...");
  const [searchParams] = useSearchParams();
  const [retryCountdown, setRetryCountdown] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setStatus("error");
        setMessage(`OAuth error: ${errorDescription || error}`);
        clearPKCEStorage();
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("Missing authorization code. Please try again.");
        clearPKCEStorage();
        return;
      }

      // Verify CSRF state
      const storedState = getStoredOAuthState();
      if (storedState && state !== storedState) {
        setStatus("error");
        setMessage("Security verification failed (state mismatch). Please try again.");
        clearPKCEStorage();
        return;
      }

      // Get the stored code_verifier for PKCE
      const codeVerifier = getStoredCodeVerifier();
      if (!codeVerifier) {
        setStatus("error");
        setMessage("PKCE verification data not found. Please try logging in again.");
        clearPKCEStorage();
        return;
      }

      // Check if user is authenticated with Botvio
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        setStatus("error");
        setMessage("Please log in to your Botvio account first, then reconnect Deriv.");
        // Don't clear PKCE yet — user might log in and come back
        return;
      }

      try {
        const cfg = getDerivConfig();

        setMessage("Exchanging authorization code...");

        // Exchange code for token via our edge function (server-side PKCE exchange)
        const { data, error: fnError } = await supabase.functions.invoke("deriv-oauth-exchange", {
          body: {
            code,
            code_verifier: codeVerifier,
            env: cfg.env,
            redirectUrl: cfg.redirectUrl,
          },
        });

        // Clear PKCE storage immediately after exchange attempt
        clearPKCEStorage();

        if (fnError || !data?.ok) {
          setStatus("error");
          setMessage(`OAuth failed: ${data?.error || fnError?.message || "Unknown error"}`);
          localStorage.setItem(RETRY_COOLDOWN_KEY, (Date.now() + 60000).toString());
          return;
        }

        // Save every Options account returned by Deriv, not only the first one.
        // This lets Botvio show Demo + Real together and switch between them
        // without sending the user back to Trading Connections.
        const preferredType = sessionStorage.getItem("deriv_preferred_account_type");
        const accounts = Array.isArray(data.accounts) ? data.accounts : [];
        const preferred: any = accounts.find((a: any) =>
          preferredType === "demo" ? !!a.is_virtual : preferredType === "real" ? !a.is_virtual : !!a.is_virtual
        ) || accounts[0];
        if (user && data.token && accounts.length > 0) {
          // Keep the modern Deriv account switcher and the main trading-account
          // registry in sync. Previously OAuth only populated user_deriv_tokens,
          // so the UI could say "connected" while Trading Accounts had nothing
          // to trade with.
          await supabase
            .from("user_deriv_tokens" as any)
            .update({ is_active: false } as any)
            .eq("user_id", user.id)
            .eq("is_active", true);

          for (const account of accounts) {
            const isActive = account.loginid === preferred.loginid;
            const label = account.is_virtual ? "Deriv Demo" : "Deriv Real";

            await supabase
              .from("user_deriv_tokens" as any)
              .upsert({
                user_id: user.id,
                loginid: account.loginid,
                is_virtual: !!account.is_virtual,
                currency: account.currency || "USD",
                token_encrypted: data.token,
                label,
                is_active: isActive,
              } as any, { onConflict: "user_id,loginid" });

            // Find the existing trading account first so reconnecting Deriv
            // updates the credential instead of creating duplicate accounts.
            const { data: existingAccount } = await supabase
              .from("trading_accounts")
              .select("id")
              .eq("user_id", user.id)
              .eq("broker", "deriv")
              .eq("login_id", account.loginid)
              .maybeSingle();

            const accountPayload = {
              user_id: user.id,
              broker: "deriv",
              label,
              api_key_encrypted: data.token,
              login_id: account.loginid,
              connection_type: "oauth",
              connection_status: "connected",
              is_virtual: !!account.is_virtual,
            };

            if (existingAccount?.id) {
              const { error: updateError } = await supabase
                .from("trading_accounts")
                .update(accountPayload)
                .eq("id", existingAccount.id);
              if (updateError) console.error("Failed to update Deriv trading account:", updateError);
            } else {
              const { error: insertError } = await supabase
                .from("trading_accounts")
                .insert(accountPayload);
              if (insertError) console.error("Failed to add Deriv trading account:", insertError);
            }
          }
        }
        // Set the selected account before notifying DerivProvider. The new Options API
        // requires accountId when requesting the OTP WebSocket URL; that URL then
        // determines whether the session is Demo or Real.
        if (data.token && preferred?.loginid) {
          setDerivOAuthToken(data.token, preferred.loginid);
        } else if (data.token) {
          setDerivOAuthToken(data.token);
        }
        sessionStorage.removeItem("deriv_preferred_account_type");

        setStatus("success");
        setMessage("Connected to Deriv successfully!");
        console.log("[LOGIN SUCCESS] OAuth v2 code exchange completed");

        // Clear cooldowns on success
        localStorage.removeItem(RETRY_COOLDOWN_KEY);
        localStorage.removeItem(OAUTH_COOLDOWN_KEY);

        setTimeout(() => {
          navigate("/deriv-app?oauth=complete");
        }, 2000);
      } catch (err: any) {
        clearPKCEStorage();
        setStatus("error");
        setMessage(`Connection failed: ${err.message}`);
        localStorage.setItem(RETRY_COOLDOWN_KEY, (Date.now() + 60000).toString());
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, user]);

  // Retry countdown timer
  useEffect(() => {
    const checkRetry = () => {
      const retryAt = localStorage.getItem(RETRY_COOLDOWN_KEY);
      if (!retryAt) {
        setRetryCountdown(0);
        return;
      }
      const remaining = Math.max(0, Math.ceil((parseInt(retryAt, 10) - Date.now()) / 1000));
      setRetryCountdown(remaining);
    };

    checkRetry();
    const interval = setInterval(checkRetry, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    if (retryCountdown > 0) return;
    navigate("/accounts");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === "loading" && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {status === "success" && <CheckCircle className="h-6 w-6 text-success" />}
            {status === "error" && <XCircle className="h-6 w-6 text-destructive" />}
            Deriv OAuth
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className={
            status === "error"
              ? "text-destructive"
              : status === "success"
              ? "text-success"
              : "text-muted-foreground"
          }>
            {message}
          </p>

          {status === "success" && (
            <p className="text-sm text-muted-foreground">
              Redirecting to accounts...
            </p>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <Button onClick={() => navigate("/accounts")} variant="outline" className="w-full">
                Go to Accounts
              </Button>
              <Button
                onClick={handleRetry}
                disabled={retryCountdown > 0}
                className="w-full"
              >
                {retryCountdown > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry in {retryCountdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
