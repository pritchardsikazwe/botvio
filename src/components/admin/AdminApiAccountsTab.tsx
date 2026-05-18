import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, Search, Plug, Activity } from "lucide-react";
import { toast } from "sonner";

interface TokenRow {
  id: string;
  user_id: string;
  loginid: string;
  is_virtual: boolean;
  currency: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TradeAgg {
  user_id: string;
  total: number;
  last_at: string | null;
}

export const AdminApiAccountsTab = () => {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [emails, setEmails] = useState<Record<string, { email: string; name: string | null }>>({});
  const [trades, setTrades] = useState<Record<string, TradeAgg>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState<string>("live");
  const [activeOnly, setActiveOnly] = useState<string>("all");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_deriv_tokens")
        .select("id,user_id,loginid,is_virtual,currency,label,is_active,created_at,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const rows = (data || []) as TokenRow[];
      setTokens(rows);

      const userIds = [...new Set(rows.map((t) => t.user_id))];
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id,email,display_name")
          .in("user_id", userIds);
        const map: Record<string, { email: string; name: string | null }> = {};
        profs?.forEach((p: any) => {
          map[p.user_id] = { email: p.email || "Unknown", name: p.display_name };
        });
        setEmails(map);

        // Aggregate trades per user from deriv_trades
        const { data: trd } = await supabase
          .from("deriv_trades")
          .select("user_id,created_at")
          .in("user_id", userIds)
          .order("created_at", { ascending: false })
          .limit(5000);
        const agg: Record<string, TradeAgg> = {};
        trd?.forEach((t: any) => {
          const cur = agg[t.user_id] || { user_id: t.user_id, total: 0, last_at: null };
          cur.total += 1;
          if (!cur.last_at || t.created_at > cur.last_at) cur.last_at = t.created_at;
          agg[t.user_id] = cur;
        });
        setTrades(agg);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load API accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    return tokens.filter((t) => {
      const u = emails[t.user_id];
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (u?.email || "").toLowerCase().includes(q) ||
        (u?.name || "").toLowerCase().includes(q) ||
        t.loginid.toLowerCase().includes(q);
      const matchEnv =
        envFilter === "all" ||
        (envFilter === "live" && !t.is_virtual) ||
        (envFilter === "demo" && t.is_virtual);
      const matchActive =
        activeOnly === "all" ||
        (activeOnly === "active" && t.is_active) ||
        (activeOnly === "inactive" && !t.is_active);
      return matchSearch && matchEnv && matchActive;
    });
  }, [tokens, emails, search, envFilter, activeOnly]);

  const liveCount = tokens.filter((t) => !t.is_virtual).length;
  const demoCount = tokens.filter((t) => t.is_virtual).length;
  const activeLive = tokens.filter((t) => !t.is_virtual && t.is_active).length;
  const uniqueUsers = new Set(tokens.map((t) => t.user_id)).size;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" />
              API-Connected Accounts (Deriv)
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Unique Users</p>
              <p className="text-2xl font-bold">{uniqueUsers}</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10">
              <p className="text-sm text-muted-foreground">Live Accounts</p>
              <p className="text-2xl font-bold text-success">{liveCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-muted-foreground">Active Live</p>
              <p className="text-2xl font-bold text-primary">{activeLive}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Demo Accounts</p>
              <p className="text-2xl font-bold">{demoCount}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, or loginid..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={envFilter} onValueChange={setEnvFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                <SelectItem value="live">Live Only</SelectItem>
                <SelectItem value="demo">Demo Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeOnly} onValueChange={setActiveOnly}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No accounts match the filters</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Login ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>Last Trade</TableHead>
                    <TableHead>Linked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => {
                    const u = emails[t.user_id];
                    const tr = trades[t.user_id];
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="font-medium">{u?.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{u?.email || t.user_id.slice(0, 8)}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{t.loginid}</TableCell>
                        <TableCell>
                          {t.is_virtual ? (
                            <Badge variant="outline">Demo</Badge>
                          ) : (
                            <Badge className="bg-success text-success-foreground">Live</Badge>
                          )}
                        </TableCell>
                        <TableCell>{t.currency}</TableCell>
                        <TableCell>
                          {t.is_active ? (
                            <Badge className="bg-primary"><Activity className="h-3 w-3 mr-1" />Active</Badge>
                          ) : (
                            <Badge variant="secondary">Idle</Badge>
                          )}
                        </TableCell>
                        <TableCell>{tr?.total ?? 0}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {tr?.last_at ? new Date(tr.last_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
