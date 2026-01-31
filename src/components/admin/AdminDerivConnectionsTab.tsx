import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, RefreshCw, Eye, WifiOff, Search, 
  CheckCircle, XCircle, Activity
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DerivConnection {
  id: string;
  user_id: string;
  env: string;
  connection_type: string;
  login_id: string | null;
  is_connected: boolean;
  last_verified_at: string | null;
  last_error: string | null;
  balance: number | null;
  currency: string | null;
  account_type: string | null;
  created_at: string;
  updated_at: string;
}

interface ConnectionLog {
  id: string;
  user_id: string;
  env: string;
  event: string;
  details: any;
  created_at: string;
}

export const AdminDerivConnectionsTab = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<DerivConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [envFilter, setEnvFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [healthCheckLoading, setHealthCheckLoading] = useState<string | null>(null);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedUserLogs, setSelectedUserLogs] = useState<ConnectionLog[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("deriv_connections")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConnections(data || []);

      // Fetch user emails for display
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", userIds);
        
        const emailMap: Record<string, string> = {};
        profiles?.forEach(p => {
          emailMap[p.user_id] = p.email || "Unknown";
        });
        setUserEmails(emailMap);
      }
    } catch (error: any) {
      toast.error("Failed to load connections");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleHealthCheck = async (connection: DerivConnection) => {
    setHealthCheckLoading(connection.id);
    try {
      const { data, error } = await supabase.functions.invoke("deriv-health-check", {
        body: { user_id: connection.user_id, env: connection.env },
      });

      if (error) throw error;

      if (data?.ok) {
        toast.success("Health check completed");
        fetchConnections();
      } else {
        toast.error(data?.error || "Health check failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Health check failed");
    } finally {
      setHealthCheckLoading(null);
    }
  };

  const handleDisconnect = async (connection: DerivConnection) => {
    try {
      const { error } = await supabase
        .from("deriv_connections")
        .update({ is_connected: false, last_error: "Disconnected by admin" })
        .eq("id", connection.id);

      if (error) throw error;

      // Log the action
      await supabase.from("deriv_connection_logs").insert({
        user_id: connection.user_id,
        env: connection.env,
        event: "disconnected_by_admin",
        details: { admin_id: user?.id },
      });

      toast.success("Connection disconnected");
      fetchConnections();
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect");
    }
  };

  const handleViewLogs = async (userId: string) => {
    setSelectedUserId(userId);
    try {
      const { data, error } = await supabase
        .from("deriv_connection_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSelectedUserLogs(data || []);
      setLogsModalOpen(true);
    } catch (error: any) {
      toast.error("Failed to load logs");
    }
  };

  const filteredConnections = connections.filter(conn => {
    const email = userEmails[conn.user_id] || "";
    const matchesSearch = email.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesEnv = envFilter === "all" || conn.env === envFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "connected" && conn.is_connected) ||
      (statusFilter === "disconnected" && !conn.is_connected);
    
    return matchesSearch && matchesEnv && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Deriv Connections Monitor
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchConnections} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={envFilter} onValueChange={setEnvFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                <SelectItem value="prod">Production</SelectItem>
                <SelectItem value="dev">Development</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="disconnected">Disconnected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Connections</p>
              <p className="text-2xl font-bold">{connections.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10">
              <p className="text-sm text-muted-foreground">Connected</p>
              <p className="text-2xl font-bold text-success">
                {connections.filter(c => c.is_connected).length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10">
              <p className="text-sm text-muted-foreground">Disconnected</p>
              <p className="text-2xl font-bold text-destructive">
                {connections.filter(c => !c.is_connected).length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-muted-foreground">Production</p>
              <p className="text-2xl font-bold text-primary">
                {connections.filter(c => c.env === "prod").length}
              </p>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No connections found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Login ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Verified</TableHead>
                    <TableHead>Last Error</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConnections.map((conn) => (
                    <TableRow key={conn.id}>
                      <TableCell className="font-medium">
                        {userEmails[conn.user_id] || conn.user_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={conn.env === "prod" ? "default" : "secondary"}>
                          {conn.env.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{conn.connection_type}</TableCell>
                      <TableCell>{conn.login_id || "-"}</TableCell>
                      <TableCell>
                        {conn.is_connected ? (
                          <Badge className="bg-success text-success-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Disconnected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {conn.last_verified_at
                          ? new Date(conn.last_verified_at).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={conn.last_error || ""}>
                        {conn.last_error || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleHealthCheck(conn)}
                            disabled={healthCheckLoading === conn.id}
                          >
                            {healthCheckLoading === conn.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewLogs(conn.user_id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {conn.is_connected && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDisconnect(conn)}
                            >
                              <WifiOff className="h-3 w-3" />
                            </Button>
                          )}
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

      {/* Logs Modal */}
      <Dialog open={logsModalOpen} onOpenChange={setLogsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Connection Logs</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {selectedUserLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No logs found</p>
              ) : (
                selectedUserLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline">{log.event}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Env: {log.env}</p>
                    {log.details && (
                      <pre className="mt-2 p-2 rounded bg-muted text-xs overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
