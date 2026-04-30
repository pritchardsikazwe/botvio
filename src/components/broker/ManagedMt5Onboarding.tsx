import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, Server, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const schema = z.object({
  nickname: z.string().trim().min(2).max(80),
  mt5_login: z.string().trim().regex(/^\d{4,12}$/, "MT5 login must be 4–12 digits"),
  mt5_server: z.string().trim().min(3).max(80),
  password: z.string().min(4).max(128),
  broker_name: z.string().max(60).optional().or(z.literal("")),
  account_type: z.enum(["real", "demo"]),
});

type Req = {
  id: string; nickname: string; mt5_login: string; mt5_server: string;
  status: "pending" | "provisioned" | "failed" | "revoked";
  assigned_terminal_uid: string | null; broker_name: string | null;
  account_type: string; created_at: string; admin_notes: string | null;
};

export function ManagedMt5Onboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nickname: "", mt5_login: "", mt5_server: "", password: "",
    broker_name: "", account_type: "real" as "real" | "demo",
  });

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("managed_mt5_requests")
      .select("id, nickname, mt5_login, mt5_server, status, assigned_terminal_uid, broker_name, account_type, created_at, admin_notes")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRequests((data as Req[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user]);

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Check your details",
        description: parsed.error.issues[0]?.message ?? "Invalid input",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("managed-mt5-submit", {
      body: parsed.data,
    });
    setSubmitting(false);
    if (error || (data as any)?.error) {
      toast({
        title: "Couldn't submit",
        description: (data as any)?.error || error?.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Request submitted",
      description: "Our team will provision a cloud terminal within minutes. You'll see the assigned UID below.",
    });
    setForm({ nickname: "", mt5_login: "", mt5_server: "", password: "", broker_name: "", account_type: "real" });
    refresh();
  };

  if (!user) return null;

  return (
    <Card className="border-success/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-success" />
          Managed MT5 Cloud Terminal
          <Badge variant="outline" className="border-success/40 text-success text-[10px]">No install needed</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Your password is encrypted with AES-GCM before it ever touches our database.</p>
          <p className="flex items-center gap-1.5"><Server className="h-3.5 w-3.5 text-primary" /> Botvio runs MT5 24/7 on a managed VPS pool — you don't install anything.</p>
          <p>Use the <strong>investor (read-trade)</strong> password if your broker offers one. Otherwise the master password is required for execution.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nickname</Label>
            <Input placeholder="e.g. Exness Real #1" value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })} maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label>Broker name (optional)</Label>
            <Input placeholder="Exness, Deriv, FBS…" value={form.broker_name}
              onChange={(e) => setForm({ ...form, broker_name: e.target.value })} maxLength={60} />
          </div>
          <div className="space-y-1.5">
            <Label>MT5 login</Label>
            <Input inputMode="numeric" placeholder="12345678" value={form.mt5_login}
              onChange={(e) => setForm({ ...form, mt5_login: e.target.value.replace(/\D/g, "") })} maxLength={12} />
          </div>
          <div className="space-y-1.5">
            <Label>MT5 server</Label>
            <Input placeholder="Exness-MT5Real8" value={form.mt5_server}
              onChange={(e) => setForm({ ...form, mt5_server: e.target.value })} maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input type="password" placeholder="Investor password preferred" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} maxLength={128} />
          </div>
          <div className="space-y-1.5">
            <Label>Account type</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.account_type}
              onChange={(e) => setForm({ ...form, account_type: e.target.value as "real" | "demo" })}
            >
              <option value="real">Real</option>
              <option value="demo">Demo</option>
            </select>
          </div>
        </div>

        <Button onClick={submit} disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
          Submit for cloud provisioning
        </Button>

        {/* Existing requests */}
        {loading ? null : requests.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium">Your managed terminals</p>
            {requests.map((r) => (
              <div key={r.id} className="rounded-lg border bg-card/50 p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {r.status === "provisioned" && <CheckCircle2 className="h-4 w-4 text-success" />}
                    {r.nickname}
                    <Badge variant="outline" className="text-[10px]">{r.account_type}</Badge>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Login {r.mt5_login} · {r.mt5_server}
                    {r.assigned_terminal_uid && <> · UID <code className="text-primary">{r.assigned_terminal_uid}</code></>}
                  </p>
                  {r.admin_notes && <p className="text-xs text-warning mt-0.5">{r.admin_notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: Req["status"] }) {
  const map: Record<Req["status"], { label: string; cls: string }> = {
    pending:     { label: "Pending",     cls: "border-warning/40 text-warning" },
    provisioned: { label: "Provisioned", cls: "border-success/40 text-success" },
    failed:      { label: "Failed",      cls: "border-destructive/40 text-destructive" },
    revoked:     { label: "Revoked",     cls: "border-muted text-muted-foreground" },
  };
  const m = map[status];
  return <Badge variant="outline" className={`text-[10px] ${m.cls}`}>{m.label}</Badge>;
}