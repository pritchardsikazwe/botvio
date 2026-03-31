import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle, MailX } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

type Status = "loading" | "valid" | "already" | "invalid" | "confirming" | "done" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    validateToken(token);
  }, [token]);

  const validateToken = async (t: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${t}`,
        { headers: { apikey: anonKey } }
      );
      const data = await res.json();
      if (data.valid === false && data.reason === "already_unsubscribed") {
        setStatus("already");
      } else if (data.valid) {
        setStatus("valid");
      } else {
        setStatus("invalid");
      }
    } catch {
      setStatus("invalid");
    }
  };

  const handleUnsubscribe = async () => {
    if (!token) return;
    setStatus("confirming");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("done");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Validating your request…</p>
            </>
          )}

          {status === "valid" && (
            <>
              <MailX className="h-10 w-10 text-warning mb-4" />
              <h2 className="text-xl font-bold mb-2">Unsubscribe?</h2>
              <p className="text-muted-foreground mb-6">
                You'll stop receiving app emails from Botvio. Auth emails (password
                resets, verification) will still be sent.
              </p>
              <Button onClick={handleUnsubscribe} className="w-full">
                Confirm Unsubscribe
              </Button>
            </>
          )}

          {status === "confirming" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Processing…</p>
            </>
          )}

          {status === "done" && (
            <>
              <CheckCircle className="h-10 w-10 text-success mb-4" />
              <h2 className="text-xl font-bold mb-2">Unsubscribed</h2>
              <p className="text-muted-foreground mb-6">
                You've been unsubscribed from Botvio app emails.
              </p>
              <Button variant="outline" asChild>
                <Link to="/">Go Home</Link>
              </Button>
            </>
          )}

          {status === "already" && (
            <>
              <CheckCircle className="h-10 w-10 text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">Already Unsubscribed</h2>
              <p className="text-muted-foreground mb-6">
                You've already unsubscribed from these emails.
              </p>
              <Button variant="outline" asChild>
                <Link to="/">Go Home</Link>
              </Button>
            </>
          )}

          {(status === "invalid" || status === "error") && (
            <>
              <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">
                {status === "invalid" ? "Invalid Link" : "Something Went Wrong"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {status === "invalid"
                  ? "This unsubscribe link is invalid or expired."
                  : "We couldn't process your request. Please try again."}
              </p>
              <Button variant="outline" asChild>
                <Link to="/">Go Home</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
