import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        if (active) setNeedsSignIn(true);
        return;
      }
      if (active) setNeedsSignIn(false);
      const { data, error: detErr } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detErr) {
        setError(detErr.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, reload]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    setReload((n) => n + 1);
  };

  const signInWithGoogle = async () => {
    const redirectTo = window.location.origin + window.location.pathname + window.location.search;
    const { error: gErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (gErr) setError(gErr.message);
  };

  const decide = async (approve: boolean) => {
    setBusy(true);
    setError(null);
    const { data, error: decErr } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (decErr) {
      setBusy(false);
      setError(decErr.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Connect an app to Botvio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {needsSignIn ? (
            <>
              <p className="text-sm text-muted-foreground">
                Sign in to your Botvio account to approve this connection.
              </p>
              <form onSubmit={signIn} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="consent-email">Email</Label>
                  <Input
                    id="consent-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="consent-password">Password</Label>
                  <Input
                    id="consent-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Sign in
                </Button>
              </form>
              <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
                Continue with Google
              </Button>
            </>
          ) : !details ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading authorization request…
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {details.client?.name ?? "An application"}
                </span>{" "}
                is requesting access to your Botvio account. It will be able to read your trading
                signals, your own trade executions and your performance summary as you.
              </p>
              <div className="flex gap-3">
                <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Approve
                </Button>
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() => decide(false)}
                  className="flex-1"
                >
                  Deny
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
