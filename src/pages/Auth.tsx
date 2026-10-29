import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Safe internal redirect target after sign-in (defaults to plan selection). */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/choose-plan";
  return raw;
}

export default function Auth() {
  const { user, signIn } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate(next, { replace: true }); }, [user, next, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) toast.error(error.message || "Sign in failed");
  };

  const google = async () => {
    sessionStorage.setItem("botvio_post_auth", next);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + next } });
    if (error) toast.error(error.message);
  };

  const reset = async () => {
    if (!email.trim()) { toast.error("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message); else toast.success("Password reset email sent");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-md px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to Botvio</CardTitle>
            <CardDescription>Sign in to choose a plan and submit your payment.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
            </form>
            <Button variant="outline" className="mt-3 w-full" onClick={google}>Continue with Google</Button>
            <div className="mt-4 flex justify-between text-sm">
              <button type="button" onClick={reset} className="text-muted-foreground underline">Forgot password?</button>
              <Link to="/signup" className="font-semibold text-primary">Create account</Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
