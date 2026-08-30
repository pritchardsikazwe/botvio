import { useState, useEffect } from "react";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Server, ShieldCheck, CheckCircle2, Info, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { SEOHead } from "@/components/seo/SEOHead";

const requestSchema = z.object({
  broker: z.string().min(2).max(80),
  account_login: z.string().trim().min(3).max(40),
  server_name: z.string().trim().min(2).max(80),
  investor_password: z.string().min(4).max(100),
  account_type: z.enum(["demo", "live"]),
  contact_whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  contact_email: z.string().trim().email().max(120).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

const STEPS = [
  { title: "Open an MT5 demo account", body: "Use any supported broker (Deriv MT5, Exness, Weltrade, FBS, etc.). A demo account is recommended for testing. Note your login number, server name and the investor (read-only) password." },
  { title: "Fill the request form below", body: "Submit broker, login, server and the INVESTOR password (read-only). Never share your master password — admins only need read-only credentials for execution." },
  { title: "Wait for admin approval", body: "Our team will review your request, provision a dedicated managed terminal (BOTVIO_*) on our VPS, and link it to your Botvio account." },
  { title: "Receive your terminal UID", body: "Once approved, you'll see your terminal UID on this page (e.g. BOTVIO_XXXXXX). Signals from Botvio will then auto-execute on your MT5 account 24/7." },
  { title: "Start trading", body: "Use 'Send to MT5' from the AI Chart Analysis or auto-trade signals. SL/TP are applied automatically." },
];

export default function BridgeRequest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [form, setForm] = useState({
    broker: "Deriv MT5",
    account_login: "",
    server_name: "",
    investor_password: "",
    account_type: "demo",
    contact_whatsapp: "",
    contact_email: user?.email || "",
    notes: "",
  });

  const fetchRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bridge_connection_requests")
      .select(
        "id,user_id,broker,account_login,server_name,account_type,notes,contact_whatsapp,contact_email,status,terminal_uid,admin_note,created_at,updated_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to submit a bridge request.");
      return;
    }
    const parsed = requestSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please review the form fields.");
      return;
    }
    setLoading(true);
    // Credentials go through a security-definer RPC so the investor password
    // is stored in a protected table that is never directly readable.
    const { error } = await supabase.rpc("submit_bridge_connection_request" as never, {
      _broker: parsed.data.broker,
      _account_login: parsed.data.account_login,
      _server_name: parsed.data.server_name,
      _investor_password: parsed.data.investor_password,
      _account_type: parsed.data.account_type,
      _contact_whatsapp: parsed.data.contact_whatsapp || null,
      _contact_email: parsed.data.contact_email || null,
      _notes: parsed.data.notes || null,
    } as never);

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bridge request submitted! Admin will review shortly.");
    setForm((f) => ({ ...f, account_login: "", investor_password: "", notes: "" }));
    fetchRequests();
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Request Managed MT5 Bridge | Botvio"
        description="Submit your MT5 demo or live credentials and let Botvio's team set up a managed bridge for 24/7 auto-execution — no VPS install required."
      />
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold">Request Managed MT5 Bridge</h1>
          </div>
          <p className="text-muted-foreground">
            No VPS, no EA install. Submit your MT5 details and our team will configure a dedicated terminal for you.
          </p>
        </div>

        <Alert className="mb-6 border-primary/40">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Use the INVESTOR (read-only) password</AlertTitle>
          <AlertDescription>
            MT5 has two passwords: master (full control) and <strong>investor</strong> (read-only — can place trades via API but cannot withdraw funds or change settings). Always submit the investor password for safety.
          </AlertDescription>
        </Alert>

        {/* How it works */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>5 simple steps to a fully managed MT5 bridge</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {STEPS.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Existing requests */}
        {requests.length > 0 && (
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle>Your requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.broker}</span>
                      <Badge variant="outline">#{r.account_login}</Badge>
                      <Badge
                        variant={
                          r.status === "approved" || r.status === "installed"
                            ? "default"
                            : r.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Server: {r.server_name} · Submitted {new Date(r.created_at).toLocaleString()}
                    </p>
                    {r.terminal_uid && (
                      <p className="text-xs mt-1">
                        Terminal: <code className="text-primary">{r.terminal_uid}</code>
                      </p>
                    )}
                    {r.admin_note && (
                      <p className="text-xs italic text-muted-foreground mt-1">Note: {r.admin_note}</p>
                    )}
                  </div>
                  {(r.status === "approved" || r.status === "installed") && (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" /> Submit Bridge Request
            </CardTitle>
            <CardDescription>
              Credentials are stored securely and only viewed by Botvio admins for setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!user ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>Please sign in to submit a bridge request.</AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="broker">Broker</Label>
                    <Select value={form.broker} onValueChange={(v) => setForm({ ...form, broker: v })}>
                      <SelectTrigger id="broker"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Deriv MT5">Deriv MT5</SelectItem>
                        <SelectItem value="Exness">Exness</SelectItem>
                        <SelectItem value="Weltrade">Weltrade</SelectItem>
                        <SelectItem value="FBS">FBS</SelectItem>
                        <SelectItem value="XM">XM</SelectItem>
                        <SelectItem value="OctaFX">OctaFX</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_type">Account type</Label>
                    <Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v })}>
                      <SelectTrigger id="account_type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Demo (recommended)</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_login">MT5 Login (account number)</Label>
                    <Input
                      id="account_login"
                      placeholder="e.g. 21876568"
                      value={form.account_login}
                      onChange={(e) => setForm({ ...form, account_login: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server_name">Server name</Label>
                    <Input
                      id="server_name"
                      placeholder="e.g. DerivSVG-Server-02"
                      value={form.server_name}
                      onChange={(e) => setForm({ ...form, server_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="investor_password">Investor (read-only) password</Label>
                    <Input
                      id="investor_password"
                      type="password"
                      placeholder="Read-only password"
                      value={form.investor_password}
                      onChange={(e) => setForm({ ...form, investor_password: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      In MT5 → Tools → Options → Server → Change password → "Change investor password".
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_whatsapp">WhatsApp (optional)</Label>
                    <Input
                      id="contact_whatsapp"
                      placeholder="+260966284085"
                      value={form.contact_whatsapp}
                      onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Anything we should know — preferred symbols, lot sizing, etc."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading ? "Submitting..." : "Submit Bridge Request"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}