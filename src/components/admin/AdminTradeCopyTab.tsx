import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Server, Power, ShieldAlert, RefreshCw, Link2 } from "lucide-react";

interface AccountRow {
  id: string;
  user_id: string;
  label: string | null;
  broker: string | null;
  server: string | null;
  login_id: string | null;
  platform: string | null;
  account_role: string | null;
  environment: string | null;
  connection_status: string | null;
  tradecopy_active: boolean | null;
  is_active: boolean | null;
  is_botvio_robot: boolean | null;
  tradecopy_user_id: number | null;
  created_at: string;
  profile?: { email: string | null; display_name: string | null } | null;
}

interface RelationshipRow {
  id: string;
  status: string;
  master_account_id: string | null;
  follower_account_id: string | null;
}

const envVariant = (env: string | null) => (env === "LIVE" ? "destructive" : "secondary");
const statusVariant = (s: string | null) => (s === "connected" ? "default" : "outline");

export const AdminTradeCopyTab = () => {
  const queryClient = useQueryClient();

  const { data: accounts, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin_tradecopy_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_accounts")
        .select(
          "id, user_id, label, broker, server, login_id, platform, account_role, environment, connection_status, tradecopy_active, is_active, is_botvio_robot, tradecopy_user_id, created_at, profile:profiles!trading_accounts_user_id_fkey(email, display_name)"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as AccountRow[];
    },
  });

  const { data: relationships } = useQuery({
    queryKey: ["admin_tradecopy_relationships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copy_relationships")
        .select("id, status, master_account_id, follower_account_id");
      if (error) throw error;
      return data as RelationshipRow[];
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { tradecopy_active?: boolean; environment?: string; is_active?: boolean } }) => {
      const { error } = await supabase.from("trading_accounts").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Account updated");
      queryClient.invalidateQueries({ queryKey: ["admin_tradecopy_accounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const followerCount = (masterId: string) =>
    (relationships ?? []).filter((r) => r.master_account_id === masterId && r.status === "active").length;

  const masters = (accounts ?? []).filter((a) => a.account_role === "master");
  const followers = (accounts ?? []).filter((a) => a.account_role !== "master");
  const liveCount = (accounts ?? []).filter((a) => a.environment === "LIVE").length;

  const renderRow = (a: AccountRow) => (
    <TableRow key={a.id}>
      <TableCell>
        <div className="font-medium flex items-center gap-2">
          {a.label || "Account"}
          {a.is_botvio_robot && <Badge variant="outline" className="text-[10px]">Botvio Robot</Badge>}
        </div>
        <div className="text-xs text-muted-foreground">{a.profile?.display_name || a.profile?.email || a.user_id.slice(0, 8) + "…"}</div>
      </TableCell>
      <TableCell className="text-sm">
        <div>{a.broker || "—"}</div>
        <div className="text-xs text-muted-foreground">{a.login_id || "—"} · {a.server || "—"}</div>
      </TableCell>
      <TableCell>
        <Badge variant={envVariant(a.environment)}>{a.environment || "DEMO"}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant(a.connection_status)}>{a.connection_status || "unknown"}</Badge>
        <div className="text-xs text-muted-foreground mt-1">TC ID: {a.tradecopy_user_id ?? "—"}</div>
      </TableCell>
      <TableCell className="text-sm">
        {a.account_role === "master" ? `${followerCount(a.id)} followers` : "—"}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={a.tradecopy_active ? "outline" : "default"}
            disabled={updateAccount.isPending}
            onClick={() => updateAccount.mutate({ id: a.id, patch: { tradecopy_active: !a.tradecopy_active } })}
          >
            <Power className="w-4 h-4 mr-1" />
            {a.tradecopy_active ? "Deactivate" : "Activate"}
          </Button>
          {a.environment === "LIVE" && (
            <Button
              size="sm"
              variant="destructive"
              disabled={updateAccount.isPending}
              onClick={() => updateAccount.mutate({ id: a.id, patch: { environment: "DEMO", tradecopy_active: false } })}
            >
              <ShieldAlert className="w-4 h-4 mr-1" />
              Force Demo
            </Button>
          )}
          {a.is_active && (
            <Button
              size="sm"
              variant="ghost"
              disabled={updateAccount.isPending}
              onClick={() => updateAccount.mutate({ id: a.id, patch: { is_active: false, tradecopy_active: false } })}
            >
              Disable
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  const renderTable = (rows: AccountRow[], empty: string) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account / Owner</TableHead>
            <TableHead>Broker · Login · Server</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Copying</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">{empty}</TableCell></TableRow>
          ) : rows.map(renderRow)}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              TradeCopy Accounts
              {liveCount > 0 && <Badge variant="destructive">{liveCount} LIVE</Badge>}
            </CardTitle>
            <CardDescription>
              Every MT5 account connected through TradeCopy. Deactivate or force an account back to Demo to stop copying immediately. Passwords are never shown.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Masters ({masters.length})
                </h3>
                {renderTable(masters, "No master accounts connected yet.")}
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">Followers ({followers.length})</h3>
                {renderTable(followers, "No follower accounts connected yet.")}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTradeCopyTab;
