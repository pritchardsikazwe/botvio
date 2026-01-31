import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDerivConfig } from "@/config/derivEnv";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DerivCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing Deriv connection...");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`OAuth error: ${error}`);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("Missing OAuth authorization code. Please try again.");
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
          return;
        }

        setStatus("success");
        setMessage("Connected to Deriv successfully!");
        
        // Redirect after short delay
        setTimeout(() => {
          navigate("/accounts");
        }, 2000);
      } catch (err: any) {
        setStatus("error");
        setMessage(`Connection failed: ${err.message}`);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

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
            <div className="space-y-2">
              <Button onClick={() => navigate("/accounts")} variant="outline">
                Go to Accounts
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
