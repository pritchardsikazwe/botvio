import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDerivConfig } from "@/config/derivEnv";
import { setDerivOAuthToken } from "@/lib/derivAuth";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const RETRY_COOLDOWN_KEY = "botvio_oauth_retry_at";
const OAUTH_COOLDOWN_KEY = "botvio_oauth_cooldown_until";

// Parse token from hash or query params (Deriv uses various patterns)
function parseDerivParams(): Record<string, string> {
  const hash = window.location.hash.replace("#", "");
  const query = window.location.search.replace("?", "");
  const raw = hash || query;
  const params = new URLSearchParams(raw);

  const obj: Record<string, string> = {};
  params.forEach((v, k) => (obj[k] = v));
  return obj;
}

export default function DerivCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing Deriv connection...");
  const [searchParams] = useSearchParams();
  const [retryCountdown, setRetryCountdown] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // First, try the standard code flow
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      // Also check for direct token flow (hash-based)
      const hashParams = parseDerivParams();
      const directToken = hashParams.token || hashParams.access_token || hashParams.token1 || "";

      if (error) {
        setStatus("error");
        setMessage(`OAuth error: ${error}`);
        return;
      }

      // Handle direct token flow (some Deriv flows return token directly)
      if (directToken && !code) {
        console.log("[DerivCallback] Direct token received, verifying and storing");
        
        // Check if user is authenticated first
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
          // Store token locally for now, but warn user
          setDerivOAuthToken(directToken);
          setStatus("success");
          setMessage("Connected to Deriv! Log in to enable auto-trading.");
          setTimeout(() => navigate("/accounts?oauth=complete"), 2000);
          return;
        }

        // Call edge function to verify and persist the token
        try {
          const cfg = getDerivConfig();
          const { data, error: fnError } = await supabase.functions.invoke("deriv-oauth-exchange", {
            body: { 
              code: directToken, // Direct token acts as the OAuth code
              env: cfg.env, 
              redirectUrl: cfg.redirectUrl 
            },
          });

          if (fnError || !data?.ok) {
            console.error("[DerivCallback] Token verification failed:", data?.error || fnError?.message);
            // Still store locally for WebSocket, but warn about auto-trading
            setDerivOAuthToken(directToken);
            setStatus("success");
            setMessage("Connected to Deriv (limited mode)");
            setTimeout(() => navigate("/accounts?oauth=complete"), 2000);
            return;
          }

          // Token verified and stored in database
          setDerivOAuthToken(directToken);
          setStatus("success");
          setMessage("Connected to Deriv successfully!");
          localStorage.removeItem(RETRY_COOLDOWN_KEY);
          localStorage.removeItem(OAUTH_COOLDOWN_KEY);
          console.log("[LOGIN SUCCESS] OAuth callback completed");
          setTimeout(() => navigate("/accounts?oauth=complete"), 2000);
        } catch (err: any) {
          console.error("[DerivCallback] Error verifying token:", err);
          setDerivOAuthToken(directToken);
          setStatus("success");
          setMessage("Connected to Deriv (limited mode)");
          setTimeout(() => navigate("/accounts?oauth=complete"), 2000);
        }
        return;
      }

      if (!code) {
        console.log("[DerivCallback] Params received:", { ...hashParams, code });
        setStatus("error");
        setMessage("Missing OAuth authorization code. Please try again.");
        return;
      }

      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        setStatus("error");
        setMessage("Please log in to your Botvio account first, then reconnect Deriv.");
        return;
      }

      // Check if already connected (idempotent)
      const { data: existingConnection } = await supabase
        .from("deriv_connections")
        .select("id, is_connected, oauth_access_token")
        .eq("user_id", sessionData.session.user.id)
        .eq("is_connected", true)
        .maybeSingle();

      if (existingConnection?.oauth_access_token) {
        // Already connected, just redirect
        setStatus("success");
        setMessage("Deriv account already connected!");
        setTimeout(() => navigate("/accounts?oauth=complete"), 1500);
        return;
      }

      try {
        const cfg = getDerivConfig();

        const { data, error: fnError } = await supabase.functions.invoke("deriv-oauth-exchange", {
          body: { 
            code, 
            env: cfg.env, 
            redirectUrl: cfg.redirectUrl 
          },
        });

        if (fnError || !data?.ok) {
          setStatus("error");
          setMessage(`OAuth failed: ${data?.error || fnError?.message || "Unknown error"}`);
          // Set retry cooldown
          localStorage.setItem(RETRY_COOLDOWN_KEY, (Date.now() + 60000).toString());
          return;
        }

        // Also store token locally for WebSocket usage
        if (data.token) {
          setDerivOAuthToken(data.token);
        }

        setStatus("success");
        setMessage("Connected to Deriv successfully!");
        console.log("[LOGIN SUCCESS] OAuth code exchange completed");
        
        // Clear cooldown on success
        localStorage.removeItem(RETRY_COOLDOWN_KEY);
        localStorage.removeItem(OAUTH_COOLDOWN_KEY);
        
        setTimeout(() => {
          navigate("/accounts?oauth=complete");
        }, 2000);
      } catch (err: any) {
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
