import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CreditCard, CheckCircle, XCircle, Clock, Eye, 
  AlertTriangle, RefreshCw, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { useAdminSubscriptionRequests, useProcessSubscriptionRequest, SubscriptionRequest } from "@/hooks/useSubscriptionRequests";

export const SubscriptionRequestsTab = () => {
  const { data: requests, isLoading, error, refetch } = useAdminSubscriptionRequests();
  const processRequest = useProcessSubscriptionRequest();
  
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [action, setAction] = useState<"approve" | "reject">("approve");

  const pendingCount = requests?.filter(r => r.status === "pending_approval").length || 0;

  const openDialog = (request: SubscriptionRequest, actionType: "approve" | "reject") => {
    setSelectedRequest(request);
    setAction(actionType);
    setAdminNote("");
    // Default to 30 days from now
    const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    setExpiresAt(defaultExpiry.toISOString().split("T")[0]);
    setShowDialog(true);
  };

  const handleProcess = async () => {
    if (!selectedRequest) return;

    await processRequest.mutateAsync({
      id: selectedRequest.id,
      approve: action === "approve",
      admin_note: adminNote,
      expires_at: action === "approve" ? new Date(expiresAt).toISOString() : undefined,
      user_id: selectedRequest.user_id,
      plan_id: selectedRequest.plan_id,
    });

    setShowDialog(false);
    setSelectedRequest(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_approval":
        return <Badge variant="outline" className="border-warning text-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="border-success text-success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "expired":
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (error) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-4" />
          <p className="text-destructive mb-4">Failed to load subscription requests</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Requests
              {pendingCount > 0 && (
                <Badge variant="destructive">{pendingCount} pending</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review and approve/reject subscription upgrade requests
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
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : requests && requests.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Requested Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.profiles?.display_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{request.profiles?.email || "No email"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {request.pricing_plans?.name || "Unknown Plan"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">${request.amount_usd}</TableCell>
                  <TableCell className="capitalize">
                    {request.payment_method?.replace("_", " ") || "Not specified"}
                  </TableCell>
                  <TableCell>
                    {request.proof_upload_url ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(request.proof_upload_url!, "_blank")}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">No proof</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {request.status === "pending_approval" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-success text-success hover:bg-success hover:text-success-foreground"
                          onClick={() => openDialog(request, "approve")}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => openDialog(request, "reject")}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {request.status !== "pending_approval" && request.admin_note && (
                      <span className="text-xs text-muted-foreground" title={request.admin_note}>
                        Note: {request.admin_note.slice(0, 20)}...
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No subscription requests yet
          </div>
        )}
      </CardContent>

      {/* Approval/Rejection Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve Subscription" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve" 
                ? `Approve ${selectedRequest?.profiles?.display_name}'s upgrade to ${selectedRequest?.pricing_plans?.name}` 
                : "Reject this subscription request"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {action === "approve" && (
              <div className="space-y-2">
                <Label htmlFor="expiresAt" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Subscription End Date
                </Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="adminNote">Admin Note {action === "reject" && "(required)"}</Label>
              <Textarea
                id="adminNote"
                placeholder={action === "approve" 
                  ? "Optional note about this approval..." 
                  : "Reason for rejection..."}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
              />
            </div>

            {selectedRequest && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p><strong>Amount:</strong> ${selectedRequest.amount_usd}</p>
                <p><strong>Plan:</strong> {selectedRequest.pricing_plans?.name}</p>
                <p><strong>Requested:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcess} 
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