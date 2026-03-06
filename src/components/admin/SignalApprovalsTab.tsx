import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Eye, History, AlertTriangle, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useUpdateSignalOutcome } from "@/hooks/useManualSignals";

interface Signal {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  status: string;
  created_at: string;
  expires_at: string | null;
  reason: string | null;
  posted_by: string | null;
  strategy_name: string;
  confidence: number | null;
  outcome: string | null;
}

interface AuditLog {
  id: string;
  signal_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
  performed_by: string | null;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  EXPIRED: "outline",
  CLOSED: "outline",
};

const outcomeColors: Record<string, string> = {
  win: "bg-success/15 text-success border-success/30",
  loss: "bg-destructive/15 text-destructive border-destructive/30",
  pending: "bg-muted text-muted-foreground border-border",
};

export const SignalApprovalsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditSignalId, setAuditSignalId] = useState<string | null>(null);
  const outcomeMutation = useUpdateSignalOutcome();

  // Fetch pending signals
  const { data: pendingSignals, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-pending-signals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_signals")
        .select("*")
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Signal[];
    },
  });

  // Fetch all signals (for history view)
  const { data: allSignals, isLoading: allLoading } = useQuery({
    queryKey: ["admin-all-signals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_signals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Signal[];
    },
  });

  // Fetch audit logs for a signal
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["signal-audit-logs", auditSignalId],
    enabled: !!auditSignalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signal_audit_logs")
        .select("*")
        .eq("signal_id", auditSignalId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  // Approve/Reject mutation
  const processMutation = useMutation({
    mutationFn: async ({ signalId, action, notes }: { signalId: string; action: "approve" | "reject"; notes: string }) => {
      const newStatus = action === "approve" ? "ACTIVE" : "REJECTED";
      
      // Update signal status
      const updateData: Record<string, unknown> = {
        status: newStatus,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      };
      
      if (action === "reject") {
        updateData.rejection_reason = notes;
      }

      const { error: updateError } = await supabase
        .from("trading_signals")
        .update(updateData)
        .eq("id", signalId);

      if (updateError) throw updateError;

      // Insert audit log
      const { error: auditError } = await supabase
        .from("signal_audit_logs")
        .insert({
          signal_id: signalId,
          action: action === "approve" ? "approved" : "rejected",
          performed_by: user?.id,
          old_status: "PENDING",
          new_status: newStatus,
          notes,
        });

      if (auditError) console.error("Audit log error:", auditError);

      return { signalId, action };
    },
    onSuccess: ({ action }) => {
      toast.success(`Signal ${action === "approve" ? "approved" : "rejected"} successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-pending-signals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-signals"] });
      setSelectedSignal(null);
      setActionType(null);
      setNotes("");
    },
    onError: (error: Error) => {
      toast.error(`Failed to process signal: ${error.message}`);
    },
  });

  const handleAction = (signal: Signal, action: "approve" | "reject") => {
    setSelectedSignal(signal);
    setActionType(action);
    setNotes("");
  };

  const handleSubmit = () => {
    if (!selectedSignal || !actionType) return;
    processMutation.mutate({
      signalId: selectedSignal.id,
      action: actionType,
      notes,
    });
  };

  const openAuditLog = (signalId: string) => {
    setAuditSignalId(signalId);
    setShowAuditLog(true);
  };

  const pendingCount = pendingSignals?.length || 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Signals</TabsTrigger>
        </TabsList>

        {/* Pending Signals */}
        <TabsContent value="pending">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Pending Signal Approvals
              </CardTitle>
              <CardDescription>Review and approve or reject submitted signals</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : pendingSignals && pendingSignals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>TP/SL</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSignals.map((signal) => (
                      <TableRow key={signal.id}>
                        <TableCell className="font-medium">{signal.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={signal.direction === "BUY" ? "default" : "destructive"}>
                            {signal.direction}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{signal.entry_price}</TableCell>
                        <TableCell className="text-sm">
                          <span className="text-success">{signal.take_profit || "-"}</span>
                          {" / "}
                          <span className="text-destructive">{signal.stop_loss || "-"}</span>
                        </TableCell>
                        <TableCell>{signal.strategy_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(signal.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-success text-success hover:bg-success hover:text-success-foreground"
                              onClick={() => handleAction(signal, "approve")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleAction(signal, "reject")}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success/50" />
                  <p>No pending signals to approve</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Signals */}
        <TabsContent value="all">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Signal History
              </CardTitle>
              <CardDescription>View all signals and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {allLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : allSignals && allSignals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSignals.map((signal) => (
                      <TableRow key={signal.id}>
                        <TableCell className="font-medium">{signal.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={signal.direction === "BUY" ? "default" : "destructive"}>
                            {signal.direction}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{signal.entry_price}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[signal.status] || "secondary"}>
                            {signal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={outcomeColors[signal.outcome || "pending"] || outcomeColors.pending}>
                            {signal.outcome === "win" && <Trophy className="h-3 w-3 mr-1" />}
                            {(signal.outcome || "pending").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(signal.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={signal.outcome === "win" ? "default" : "outline"}
                              className={signal.outcome === "win" ? "bg-success hover:bg-success/90 text-success-foreground h-7 px-2" : "border-success text-success hover:bg-success hover:text-success-foreground h-7 px-2"}
                              onClick={() => outcomeMutation.mutate({ id: signal.id, outcome: signal.outcome === "win" ? "pending" : "win" })}
                              disabled={outcomeMutation.isPending}
                            >
                              <Trophy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant={signal.outcome === "loss" ? "destructive" : "outline"}
                              className={signal.outcome !== "loss" ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-7 px-2" : "h-7 px-2"}
                              onClick={() => outcomeMutation.mutate({ id: signal.id, outcome: signal.outcome === "loss" ? "pending" : "loss" })}
                              disabled={outcomeMutation.isPending}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openAuditLog(signal.id)}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No signals found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve/Reject Dialog */}
      <Dialog open={!!selectedSignal && !!actionType} onOpenChange={() => { setSelectedSignal(null); setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Signal" : "Reject Signal"}
            </DialogTitle>
            <DialogDescription>
              {selectedSignal && (
                <>
                  {selectedSignal.symbol} {selectedSignal.direction} @ {selectedSignal.entry_price}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionType === "reject" && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Please provide a reason for rejection so the provider can improve.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">{actionType === "approve" ? "Notes (optional)" : "Rejection Reason"}</Label>
              <Textarea
                id="notes"
                placeholder={actionType === "approve" ? "Add any notes..." : "Explain why this signal is being rejected..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedSignal(null); setActionType(null); }}>
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleSubmit}
              disabled={processMutation.isPending || (actionType === "reject" && !notes.trim())}
            >
              {processMutation.isPending ? "Processing..." : actionType === "approve" ? "Approve Signal" : "Reject Signal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Signal Audit Log</DialogTitle>
            <DialogDescription>History of actions taken on this signal</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {auditLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : auditLogs && auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="capitalize">{log.action}</Badge>
                      {log.old_status && log.new_status && (
                        <span className="text-xs text-muted-foreground">
                          {log.old_status} → {log.new_status}
                        </span>
                      )}
                    </div>
                    {log.notes && <p className="text-sm text-muted-foreground">{log.notes}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No audit logs found</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
