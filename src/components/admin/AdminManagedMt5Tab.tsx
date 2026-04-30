import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Server, RefreshCw, CheckCircle2, XCircle, Ban, Cloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Req = {
  id: string;
  user_id: string;
  nickname: string;
  mt5_login: string;
  mt5_server: string;
  account_type: string;
  broker_name: string | null;
  status: "pending" | "provisioned" | "failed" | "revoked";
  assigned_terminal_uid: string | null;
  admin_notes: string | null;
  created_at: string;
};

type ProfileLite = { user_id: string; email: string | null; display_name: string | null };

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  provisioned: "default",
  failed: "destructive",
  revoked: "outline",
};

export function AdminManagedMt5Tab() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Req[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Req | null>(null);
  const [terminalUid, setTerminalUid] = useState("");
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState<Req["status"]>("provisioned");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("managed_mt5_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load requests", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const list = (data || []) as Req[];
    setRows(list);

    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", ids);
      const map: Record<string, ProfileLite> = {};
      (profs || []).forEach((p: any) => (map[p.user_id] = p));
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (r: Req) => {
    setEditing(r);
    setTerminalUid(r.assigned_terminal_uid || "");
    setNotes(r.admin_notes || "");
    setNewStatus(r.status === "pending" ? "provisioned" : r.status);
  };

  const save = async () => {
    if (!editing) return;
    if (newStatus === "provisioned" && !terminalUid.trim()) {
      toast({ title: "Terminal UID required", description: "Assign a Terminal UID before marking as provisioned.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("managed_mt5_requests")
      .update({
        status: newStatus,
        assigned_terminal_uid: terminalUid.trim() || null,
        admin_notes: notes.trim() || null,
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Request updated", description: `Status set to ${newStatus}.` });
    setEditing(null);
    load();
  };

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const counts = {
    pending: rows.filter((r) => r.status === "pending").length,
    provisioned: rows.filter((r) => r.status === "provisioned").length,
    failed: rows.filter((r) => r.status === "failed").length,
    revoked: rows.filter((r) => r.status === "revoked").length,
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Managed MT5 Provisioning
            </CardTitle>
            <CardDescription>
              Review user requests, assign a VPS Terminal UID, and mark the cloud terminal as provisioned.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Pending: {counts.pending}</Badge>
            <Badge>Provisioned: {counts.provisioned}</Badge>
            <Badge variant="destructive">Failed: {counts.failed}</Badge>
            <Button size="sm" variant="outline" onClick={load}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "provisioned", "failed", "revoked"].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filter === s ? "default" : "outline"}
              onClick={() => setFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests in this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Nickname</TableHead>
                  <TableHead>MT5 Login</TableHead>
                  <TableHead>Server</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terminal UID</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const p = profiles[r.user_id];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">
                        <div className="font-medium">{p?.display_name || "—"}</div>
                        <div className="text-muted-foreground">{p?.email || r.user_id.slice(0, 8)}</div>
                      </TableCell>
                      <TableCell>{r.nickname}</TableCell>
                      <TableCell className="font-mono text-xs">{r.mt5_login}</TableCell>
                      <TableCell className="text-xs">{r.mt5_server}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.account_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.assigned_terminal_uid || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                          <Server className="w-4 h-4 mr-1" /> Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="rounded-lg border bg-muted/30 p-4 text-xs space-y-2">
          <div className="font-semibold text-sm flex items-center gap-2">
            <Server className="w-4 h-4" /> VPS provisioning steps
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
            <li>SSH to your Contabo VPS and start a new MT5 terminal in its own Wine prefix / user folder.</li>
            <li>Log into the user's MT5 with the credentials they submitted (login + server).</li>
            <li>Install <code>BOTVIO_BridgeEA.mq5</code> on a chart and set the Terminal UID + Bridge Secret.</li>
            <li>Copy the Terminal UID (e.g. <code>BOTVIO_xxxx-N</code>) and paste it below; mark as <em>Provisioned</em>.</li>
            <li>The user's Auto-execute toggle in Connections → MT5 Bridge will route signals to this terminal.</li>
          </ol>
        </div>
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage MT5 Provisioning Request</DialogTitle>
            <DialogDescription>
              Assign a VPS Terminal UID and update the request status.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">User</div>
                  <div className="font-medium">{profiles[editing.user_id]?.email || editing.user_id}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Nickname</div>
                  <div className="font-medium">{editing.nickname}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">MT5 Login</div>
                  <div className="font-mono">{editing.mt5_login}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Server</div>
                  <div className="font-mono">{editing.mt5_server}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Account Type</div>
                  <div>{editing.account_type}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Broker</div>
                  <div>{editing.broker_name || "—"}</div>
                </div>
              </div>

              <div>
                <Label>Assigned Terminal UID</Label>
                <Input
                  placeholder="BOTVIO_xxxx-N"
                  value={terminalUid}
                  onChange={(e) => setTerminalUid(e.target.value)}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as Req["status"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="provisioned">Provisioned</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Admin notes (visible to user)</Label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Provisioned on Contabo VPS-2, terminal #4."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : (
                <>
                  {newStatus === "provisioned" && <CheckCircle2 className="w-4 h-4 mr-1" />}
                  {newStatus === "failed" && <XCircle className="w-4 h-4 mr-1" />}
                  {newStatus === "revoked" && <Ban className="w-4 h-4 mr-1" />}
                  Save changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}