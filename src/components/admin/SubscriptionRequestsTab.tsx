import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard, CheckCircle, XCircle, Clock, Eye,
  AlertTriangle, RefreshCw, Calendar, Phone, Globe,
  FileText, DollarSign
} from "lucide-react";
import { toast } from "sonner";

interface MergedRequest {
  id: string;
  user_id: string;
  source: "subscription_request" | "payment_request";
  plan_id: string | null;
  amount_usd: number;
  status: string;
  payment_method: string | null;
  proof_upload_url: string | null;
  admin_note: string | null;
  created_at: string;
  plan_name?: string;
  plan_code?: string;
  current_price_usd?: number | null;
  plan_active?: boolean;
  profile?: {
    email: string | null;
    display_name: string | null;
    whatsapp_number: string | null;
    country: string | null;
  };
}

export const SubscriptionRequestsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<MergedRequest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [action, setAction] = useState<"approve" | "reject">("approve");

  // Fetch merged requests from both tables
  const { data: requests, isLoading, error, refetch } = useQuery({
    queryKey: ["admin_all_subscription_requests"],
    queryFn: async () => {
      // Fetch subscription_requests
      const { data: subReqs, error: subErr } = await supabase
        .from("subscription_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (subErr) throw subErr;

      // Fetch payment_requests
      const { data: payReqs, error: payErr } = await supabase
        .from("payment_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (payErr) throw payErr;

      // Collect all user IDs and plan IDs
      const allUserIds = [...new Set([
        ...subReqs.map(r => r.user_id),
        ...payReqs.map(r => r.user_id),
      ])];
      const allPlanIds = [...new Set([
        ...subReqs.map(r => r.plan_id).filter(Boolean),
        ...payReqs.map(r => r.plan_id).filter(Boolean),
      ])];

      // Fetch profiles with WhatsApp and country
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, display_name, whatsapp_number, country")
        .in("user_id", allUserIds);

      // Fetch plans
      const { data: plans } = allPlanIds.length > 0
        ? await supabase.from("pricing_plans").select("id, name, code, price_usd, is_active").in("id", allPlanIds)
        : { data: [] };

      // Merge into unified list
      const merged: MergedRequest[] = [
        ...subReqs.map(r => ({
          id: r.id,
          user_id: r.user_id,
          source: "subscription_request" as const,
          plan_id: r.plan_id,
          amount_usd: Number(r.amount_usd),
          status: r.status,
          payment_method: r.payment_method,
          proof_upload_url: r.proof_upload_url,
          admin_note: r.admin_note,
          created_at: r.created_at,
          plan_name: plans?.find(p => p.id === r.plan_id)?.name,
          plan_code: plans?.find(p => p.id === r.plan_id)?.code,
          current_price_usd: plans?.find(p => p.id === r.plan_id)?.price_usd ?? null,
          plan_active: plans?.find(p => p.id === r.plan_id)?.is_active !== false,
          profile: profiles?.find(p => p.user_id === r.user_id) || undefined,
        })),
        ...payReqs.map(r => ({
          id: r.id,
          user_id: r.user_id,
          source: "payment_request" as const,
          plan_id: r.plan_id,
          amount_usd: Number(r.amount_usd),
          status: r.status === "submitted" ? "pending_approval" : r.status,
          payment_method: r.method,
          proof_upload_url: r.proof_upload_url,
          admin_note: r.admin_note,
          created_at: r.created_at,
          plan_name: plans?.find(p => p.id === r.plan_id)?.name,
          plan_code: plans?.find(p => p.id === r.plan_id)?.code,
          current_price_usd: plans?.find(p => p.id === r.plan_id)?.price_usd ?? null,
          plan_active: plans?.find(p => p.id === r.plan_id)?.is_active !== false,
          profile: profiles?.find(p => p.user_id === r.user_id) || undefined,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return merged;
    },
  });

  const pendingCount = requests?.filter(r => r.status === "pending_approval" || r.status === "submitted").length || 0;

  const processRequest = useMutation({
    mutationFn: async ({ req, approve, note, expires }: {
      req: MergedRequest;
      approve: boolean;
      note: string;
      expires?: string;
    }) => {
      const status = approve ? "approved" : "rejected";

      if (req.source === "subscription_request") {
        const { error } = await supabase
          .from("subscription_requests")
          .update({
            status,
            admin_note: note,
            reviewed_by: user!.id,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", req.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payment_requests")
          .update({
            status,
            admin_note: note,
            reviewed_by: user!.id,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", req.id);
        if (error) throw error;
      }

      // If approved and has plan_id, activate subscription
      if (approve && req.plan_id) {
        const periodEnd = expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: existing } = await supabase
          .from("user_plan_subscriptions")
          .select("id")
          .eq("user_id", req.user_id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("user_plan_subscriptions")
            .update({
              pricing_plan_id: req.plan_id,
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("user_plan_subscriptions")
            .insert({
              user_id: req.user_id,
              pricing_plan_id: req.plan_id,
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: periodEnd,
            });
        }
      }

      // Notify user
      await supabase.from("notifications").insert({
        user_id: req.user_id,
        type: approve ? "success" : "error",
        title: approve ? "Subscription Upgraded!" : "Upgrade Request Rejected",
        message: approve
          ? "Your subscription upgrade has been approved. Enjoy your new features!"
          : note || "Your request was rejected. Contact support for more info.",
      });

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        action_type: approve ? "subscription_approved" : "subscription_rejected",
        payload_json: { request_id: req.id, source: req.source, target_user_id: req.user_id, plan_id: req.plan_id, admin_note: note },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_all_subscription_requests"] });
      toast.success(action === "approve" ? "Request approved & activated!" : "Request rejected");
      setShowDialog(false);
      setSelectedRequest(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed to process request"),
  });

  const openDialog = (request: MergedRequest, actionType: "approve" | "reject") => {
    setSelectedRequest(request);
    setAction(actionType);
    setAdminNote("");
    setExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setShowDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_approval":
      case "submitted":
        return <Badge variant="outline" className="border-amber-500 text-amber-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="border-emerald-500 text-emerald-400"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingRequests = requests?.filter(r => r.status === "pending_approval" || r.status === "submitted") || [];
  const processedRequests = requests?.filter(r => r.status !== "pending_approval" && r.status !== "submitted") || [];

  if (error) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-4" />
          <p className="text-destructive mb-4">Failed to load requests</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderTable = (items: MergedRequest[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Submitted / Current</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Proof</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((req) => (
          <TableRow key={`${req.source}-${req.id}`}>
            <TableCell>
              <div>
                <p className="font-medium">{req.profile?.display_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{req.profile?.email || "No email"}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                {req.profile?.whatsapp_number && (
                  <a href={`https://wa.me/${req.profile.whatsapp_number.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-400 hover:underline">
                    <Phone className="h-3 w-3" /> {req.profile.whatsapp_number}
                  </a>
                )}
                {req.profile?.country && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" /> {req.profile.country}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-[10px]">
                {req.source === "subscription_request" ? (
                  <><FileText className="h-3 w-3 mr-1" />Sub Req</>
                ) : (
                  <><DollarSign className="h-3 w-3 mr-1" />Payment</>
                )}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-col items-start gap-1">
                <Badge variant="secondary">{req.plan_name || "No plan"}</Badge>
                {req.plan_active === false && <Badge variant="outline" className="border-amber-500 text-amber-600">Legacy / inactive plan</Badge>}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm font-semibold">Submitted: ${Number(req.amount_usd || 0).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{req.plan_active === false ? "Current price unavailable (inactive plan)" : req.current_price_usd != null ? `Current list price: ${Number(req.current_price_usd).toFixed(2)}` : "Current list price unavailable"}</div>
            </TableCell>
            <TableCell className="capitalize text-sm">
              {req.payment_method?.replace("_", " ") || "—"}
            </TableCell>
            <TableCell>
              {req.proof_upload_url ? (
                <Button size="sm" variant="outline" onClick={() => window.open(req.proof_upload_url!, "_blank")}>
                  <Eye className="w-4 h-4 mr-1" /> View
                </Button>
              ) : (
                <span className="text-muted-foreground text-xs">No proof</span>
              )}
            </TableCell>
            <TableCell>{getStatusBadge(req.status)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(req.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              {(req.status === "pending_approval" || req.status === "submitted") ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white" onClick={() => openDialog(req, "approve")}>
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => openDialog(req, "reject")}>
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              ) : req.admin_note ? (
                <span className="text-xs text-muted-foreground" title={req.admin_note}>
                  Note: {req.admin_note.slice(0, 20)}...
                </span>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              All Subscription & Payment Requests
              {pendingCount > 0 && <Badge variant="destructive">{pendingCount} pending</Badge>}
            </CardTitle>
            <CardDescription>
              Merged view of subscription upgrade requests and payment submissions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : requests && requests.length > 0 ? (
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending {pendingCount > 0 && <Badge variant="destructive" className="ml-2 text-xs">{pendingCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="processed">
                Processed ({processedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              {pendingRequests.length > 0 ? (
                <div className="overflow-x-auto">{renderTable(pendingRequests)}</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No pending requests 🎉</div>
              )}
            </TabsContent>
            <TabsContent value="processed">
              {processedRequests.length > 0 ? (
                <div className="overflow-x-auto">{renderTable(processedRequests)}</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No processed requests</div>
              )}
            </TabsContent>
            <TabsContent value="all">
              <div className="overflow-x-auto">{renderTable(requests)}</div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No subscription or payment requests yet
          </div>
        )}
      </CardContent>

      {/* Approval/Rejection Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "approve" ? "Approve Request" : "Reject Request"}</DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? `Approve ${selectedRequest?.profile?.display_name}'s upgrade${selectedRequest?.plan_name ? ` to ${selectedRequest.plan_name}` : ""}`
                : "Reject this request"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedRequest?.profile && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <p><strong>User:</strong> {selectedRequest.profile.display_name}</p>
                <p><strong>Email:</strong> {selectedRequest.profile.email}</p>
                {selectedRequest.profile.whatsapp_number && (
                  <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedRequest.profile.whatsapp_number}</p>
                )}
                {selectedRequest.profile.country && (
                  <p className="flex items-center gap-1"><Globe className="h-3 w-3" /> {selectedRequest.profile.country}</p>
                )}
                <p><strong>Amount submitted:</strong> ${Number(selectedRequest.amount_usd || 0).toFixed(2)}</p>
                <p><strong>Plan requested:</strong> {selectedRequest.plan_name || "Not specified"}{selectedRequest.plan_active === false ? " (legacy / inactive)" : ""}</p>
                <p><strong>Current list price:</strong> {selectedRequest.plan_active === false || selectedRequest.current_price_usd == null ? "Unavailable for inactive/unknown plan" : `${Number(selectedRequest.current_price_usd).toFixed(2)}`}</p>
                {selectedRequest.plan_active === false && <p className="text-amber-600"><strong>Review required:</strong> this request references an inactive plan. Confirm the payment and intended entitlement before approving.</p>}
                <p><strong>Source:</strong> {selectedRequest.source === "subscription_request" ? "Subscription Request" : "Payment Request"}</p>
              </div>
            )}

            {action === "approve" && (
              <div className="space-y-2">
                <Label htmlFor="expiresAt" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Subscription End Date
                </Label>
                <Input id="expiresAt" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="adminNote">Admin Note {action === "reject" && "(required)"}</Label>
              <Textarea
                id="adminNote"
                placeholder={action === "approve" ? "Optional note..." : "Reason for rejection..."}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={() => selectedRequest && processRequest.mutate({
                req: selectedRequest,
                approve: action === "approve",
                note: adminNote,
                expires: action === "approve" ? new Date(expiresAt).toISOString() : undefined,
              })}
              disabled={processRequest.isPending || (action === "reject" && !adminNote)}
              variant={action === "approve" ? "default" : "destructive"}
            >
              {processRequest.isPending ? "Processing..." : action === "approve" ? "Approve & Activate" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
