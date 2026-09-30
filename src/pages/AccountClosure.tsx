import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/trading/Header";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AccountClosure() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const closeAccount = async () => {
    if (!user || !confirmed) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("delete-account", { body: { confirm: true } });
    if (error) {
      toast.error(error.message || "Account closure failed");
      setBusy(false);
      return;
    }
    if (!data?.ok) {
      toast.error(data?.error || "Account closure failed");
      setBusy(false);
      return;
    }
    await signOut();
    toast.success("Your Botvio account and associated data have been deleted.");
    navigate("/", { replace: true });
  };

  if (!user) return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-xl px-4 py-12"><Card><CardHeader><CardTitle>Close Botvio account</CardTitle><CardDescription>Sign in first so we can verify that you own the account.</CardDescription></CardHeader><CardContent><Button onClick={() => navigate("/auth")}>Sign in</Button></CardContent></Card></main></div>;

  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-xl px-4 py-12"><Card className="border-destructive/30"><CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Delete your Botvio account</CardTitle><CardDescription>This permanently deletes your Botvio account and associated application data, including connected broker credentials and trading-account records stored by Botvio.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm"><p className="font-medium">This action cannot be undone.</p><p className="mt-1 text-muted-foreground">Records that Botvio is legally required to retain may be kept for the applicable retention period.</p></div><label className="flex items-start gap-3"><Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} /><span className="text-sm">I understand that deleting my account permanently removes my Botvio account and associated data.</span></label><Button variant="destructive" className="w-full" disabled={!confirmed || busy} onClick={closeAccount}><Trash2 className="mr-2 h-4 w-4" />{busy ? "Deleting account…" : "Permanently delete account"}</Button></CardContent></Card></main></div>;
}
