import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Eye, Server, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface BridgeRequest {
  id: string;
  user_id: string;
  broker: string;
  account_login: string;
  server_name: string;
  investor_password: string;
  account_type: string;
  notes: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  status: string;
  terminal_uid: string | null;
  admin_note: string | null;
  created_at: string;
}

export const AdminBridgeRequestsTab = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<BridgeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<BridgeRequest | null>(null);
  const [terminalUid, setTerminalUid] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bridge_connection_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as BridgeRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (status: string) => {
    if (!active) return;
    const payload: Record<string, any> = {
      status,
      admin_note: adminNote || null,
      reviewed_by: user?.id || null,
      reviewed_at: new Date().toISOString(),
    };
    if (terminalUid) payload.terminal_uid = terminalUid;
    const { error } = await supabase
      .from("bridge_connection_requests")
      .update(payload)
      .eq("id", active.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Request marked as ${status}`);
    setActive(null);
    setTerminalUid("");
    setAdminNote("");
    setShowPassword(false);
    fetchData();
  };

  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          MT5 Bridge Requests
          {pending > 0 && <Badge variant="destructive">{pending} pending</Badge>}
        </CardTitle>
        <CardDescription>
          Review user-submitted MT5 credentials and provision managed terminals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No bridge requests yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Server</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terminal</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{r.broker}</TableCell>
                  <TableCell className="font-mono">{r.account_login}</TableCell>
                  <TableCell className="text-xs">{r.server_name}</TableCell>
                  <TableCell><Badge variant="outline">{r.account_type}</Badge></TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.terminal_uid ? <code className="text-primary">{r.terminal_uid}</code> : "—"}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => {
                      setActive(r);
                      setTerminalUid(r.terminal_uid || "");
                      setAdminNote(r.admin_note || "");
                      setShowPassword(false);
                    }}>
                      <Eye className="w-4 h-4 mr-1" /> Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bridge Request Details</DialogTitle>
            <DialogDescription>
              Review the credentials and approve / reject this request.
            </DialogDescription>
          </DialogHeader>
          {active && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Broker:</span> <strong>{active.broker}</strong></div>
                <div><span className="text-muted-foreground">Type:</span> <strong>{active.account_type}</strong></div>
                <div><span className="text-muted-foreground">Login:</span> <code>{active.account_login}</code></div>
                <div><span className="text-muted-foreground">Server:</span> <code>{active.server_name}</code></div>
                <div><span className="text-muted-foreground">WhatsApp:</span> {active.contact_whatsapp || "—"}</div>
                <div><span className="text-muted-foreground">Email:</span> {active.contact_email || "—"}</div>
              </div>
              <div>
                <Label>Investor Password</Label>
                <div className="flex gap-2 items-center">
                  <Input readOnly type={showPassword ? "text" : "password"} value={active.investor_password} />
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowPassword((s) => !s)}>
                    {showPassword ? "Hide" : "Show"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(active.investor_password);
                    toast.success("Copied");
                  }}>Copy</Button>
                </div>
              </div>
              {active.notes && (
                <div>
                  <Label>User notes</Label>
                  <p className="text-muted-foreground italic">{active.notes}</p>
                </div>
              )}
              <div className="space-y-2 pt-2 border-t border-border">
                <Label htmlFor="terminal_uid">Terminal UID (assigned)</Label>
                <Input
                  id="terminal_uid"
                  placeholder="BOTVIO_XXXXXX"
                  value={terminalUid}
                  onChange={(e) => setTerminalUid(e.target.value)}
                />
                <Label htmlFor="admin_note">Admin note (visible to user)</Label>
                <Textarea
                  id="admin_note"
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActive(null)}>Close</Button>
            <Button variant="destructive" onClick={() => updateStatus("rejected")}>
              <XCircle className="w-4 h-4 mr-1" /> Reject
            </Button>
            <Button onClick={() => updateStatus("approved")}>
              <CheckCircle className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button variant="default" onClick={() => updateStatus("installed")}>
              <Server className="w-4 h-4 mr-1" /> Mark Installed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};