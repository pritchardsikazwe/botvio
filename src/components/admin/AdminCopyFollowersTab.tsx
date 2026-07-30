import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, X, PauseCircle, ShieldCheck } from "lucide-react";

interface FollowerRow {
  id: string;
  provider_id: string;
  subscriber_user_id: string;
  status: string;
  approval_status: string;
  copy_mode: string;
  fixed_stake: number | null;
  multiplier: number | null;
  max_drawdown_percent: number | null;
  equity_floor_usd: number | null;
  daily_loss_limit_usd: number | null;
  baseline_equity_usd: number | null;
  created_at: string;
  provider?: { display_name: string } | null;
}

const approvalVariant = (s: string) =>
  s === "approved" ? "default" : s === "rejected" ? "destructive" : s === "suspended" ? "outline" : "secondary";

export const AdminCopyFollowersTab = () => {
  const queryClient = useQueryClient();

  const { data: followers, isLoading } = useQuery({
    queryKey: ["admin_copy_followers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copy_subscriptions")
        .select(
          "id, provider_id, subscriber_user_id, status, approval_status, copy_mode, fixed_stake, multiplier, max_drawdown_percent, equity_floor_usd, daily_loss_limit_usd, baseline_equity_usd, created_at, provider:providers(display_name)"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as FollowerRow[];
    },
  });

  const setApproval = useMutation({
    mutationFn: async ({ id, approval_status }: { id: string; approval_status: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("copy_subscriptions")
        .update({
          approval_status,
          approved_by: auth.user?.id ?? null,
          approved_at: new Date().toISOString(),
          status: approval_status === "approved" ? "active" : "paused",
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Follower updated");
      queryClient.invalidateQueries({ queryKey: ["admin_copy_followers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = followers?.filter((f) => f.approval_status === "pending").length ?? 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Copy-Trading Followers
          {pending > 0 && <Badge variant="destructive">{pending} pending</Badge>}
        </CardTitle>
        <CardDescription>
          Approve followers before their account starts copying a provider. Each follower must set an
          equity drawdown limit — copying stops automatically when it is breached.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !followers || followers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No follower subscriptions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Follower</TableHead>
                  <TableHead>Copy mode</TableHead>
                  <TableHead>Risk limits</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followers.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.provider?.display_name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{f.subscriber_user_id.slice(0, 8)}…</TableCell>
                    <TableCell className="text-sm">
                      {f.copy_mode}
                      {f.copy_mode === "fixed" && f.fixed_stake ? ` · $${f.fixed_stake}` : ""}
                      {f.copy_mode === "multiplier" && f.multiplier ? ` · ${f.multiplier}x` : ""}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>Max DD: {f.max_drawdown_percent ?? "—"}%</div>
                      <div className="text-muted-foreground text-xs">
                        Equity floor: {f.equity_floor_usd != null ? `$${f.equity_floor_usd}` : "—"} · Daily loss:{" "}
                        {f.daily_loss_limit_usd != null ? `$${f.daily_loss_limit_usd}` : "—"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Baseline equity: {f.baseline_equity_usd != null ? `$${f.baseline_equity_usd}` : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={approvalVariant(f.approval_status)}>{f.approval_status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={setApproval.isPending || f.approval_status === "approved"}
                          onClick={() => setApproval.mutate({ id: f.id, approval_status: "approved" })}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={setApproval.isPending || f.approval_status === "suspended"}
                          onClick={() => setApproval.mutate({ id: f.id, approval_status: "suspended" })}
                        >
                          <PauseCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={setApproval.isPending || f.approval_status === "rejected"}
                          onClick={() => setApproval.mutate({ id: f.id, approval_status: "rejected" })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCopyFollowersTab;