import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  Users, 
  UserCheck, 
  UserX,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Bot,
  TrendingUp,
  DollarSign,
  Wallet,
  AlertOctagon,
  Eye,
  Ban,
  Signal,
  RefreshCw,
  FileText,
  Settings,
  Package,
  ClipboardCheck,
  Globe,
  Mail,
  Contact,
  Phone,
  Trophy,
  Server
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSignalForm } from "@/components/signals/AdminSignalForm";
import { useManualSignals, useUpdateSignalStatus, ManualSignal } from "@/hooks/useManualSignals";
import { useAdminPaymentRequests, useProcessPaymentRequest } from "@/hooks/useAdminBilling";
import { SubscriptionRequestsTab } from "@/components/admin/SubscriptionRequestsTab";
import { AdminDerivConnectionsTab } from "@/components/admin/AdminDerivConnectionsTab";
import { AdminApiAccountsTab } from "@/components/admin/AdminApiAccountsTab";
import { AdminPricingPlansTab } from "@/components/admin/AdminPricingPlansTab";
import { SignalApprovalsTab } from "@/components/admin/SignalApprovalsTab";
import { SignalManagersTab } from "@/components/admin/SignalManagersTab";
import { ProductsManagementTab } from "@/components/admin/ProductsManagementTab";
import { AdminSEOTab } from "@/components/admin/AdminSEOTab";
import { AdminSEOPagesTab } from "@/components/admin/AdminSEOPagesTab";
import { AdminNewsEventsTab } from "@/components/admin/AdminNewsEventsTab";
import { AdminProfilesTab } from "@/components/admin/AdminProfilesTab";
import { AdminNewsletterTab } from "@/components/admin/AdminNewsletterTab";
import { AdminRolesTab } from "@/components/admin/AdminRolesTab";
import { AdminSignalHistoryTab } from "@/components/admin/AdminSignalHistoryTab";
import { AdminSportsBettingAccessTab } from "@/components/admin/AdminSportsBettingAccessTab";
import { AdminLiveStreamsTab } from "@/components/admin/AdminLiveStreamsTab";
import { AdminAdvertsTab } from "@/components/admin/AdminAdvertsTab";
import { AdminTrainingVideosTab } from "@/components/admin/AdminTrainingVideosTab";
import { AdminChartLimitsTab } from "@/components/admin/AdminChartLimitsTab";
import { AdminPwaHealthTab } from "@/components/admin/AdminPwaHealthTab";
import { AdminManagedMt5Tab } from "@/components/admin/AdminManagedMt5Tab";
import { AdminBridgeRequestsTab } from "@/components/admin/AdminBridgeRequestsTab";
import { AdminEditorialTab } from "@/components/admin/AdminEditorialTab";
import { AdminCopyFollowersTab } from "@/components/admin/AdminCopyFollowersTab";

interface Provider {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  status: string;
  verified: boolean;
  created_at: string;
  total_subscribers: number;
  total_trades: number;
  win_rate: number;
}

interface UserSubscription {
  id: string;
  user_id: string;
  status: string;
  pricing_plan_id: string;
  current_period_start: string | null;
  current_period_end: string | null;
  pricing_plans: {
    name: string;
    code: string;
  } | null;
  profiles: {
    email: string | null;
    display_name: string | null;
    whatsapp_number: string | null;
    country: string | null;
  } | null;
}

interface AffiliateProfile {
  user_id: string;
  affiliate_code: string;
  status: string;
  total_clicks: number;
  total_signups: number;
  total_earnings_usd: number;
  created_at: string;
}

interface PayoutRequest {
  id: string;
  user_id: string;
  amount_usd: number;
  status: string;
  tx_reference: string | null;
  admin_note: string | null;
  created_at: string;
  method_id: string;
  payout_methods?: {
    type: string;
    crypto_network: string | null;
    crypto_address: string | null;
    mobile_network: string | null;
    mobile_number: string | null;
  } | null;
}

interface FraudFlag {
  id: string;
  type: string;
  description: string;
  user_id: string;
  affiliate_code: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

// Signals Management Component
const SignalsManagement = () => {
  const { data: signals, isLoading, refetch } = useManualSignals({ status: "all" });
  const updateStatus = useUpdateSignalStatus();

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateStatus.mutateAsync({ id, status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Post New Signal Form */}
      <AdminSignalForm onSuccess={() => refetch()} />
      
      {/* Existing Signals */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signal className="h-5 w-5" />
            Posted Signals
          </CardTitle>
          <CardDescription>
            Manage and update signal statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading signals...</div>
          ) : signals && signals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>TP</TableHead>
                  <TableHead>SL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signals.map((signal) => (
                  <TableRow key={signal.id}>
                    <TableCell className="font-medium">{signal.symbol}</TableCell>
                    <TableCell>
                      <Badge variant={signal.direction === 'BUY' ? 'default' : 'destructive'}>
                        {signal.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{signal.entry_price}</TableCell>
                    <TableCell className="font-mono text-success">{signal.take_profit || '-'}</TableCell>
                    <TableCell className="font-mono text-destructive">{signal.stop_loss || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={signal.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {signal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(signal.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {signal.status === 'ACTIVE' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(signal.id, 'CLOSED')}
                          >
                            Close
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(signal.id, 'ACTIVE')}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No signals posted yet. Use the form above to create your first signal.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Billing Requests Management Component
const BillingRequestsTab = () => {
  const { data: paymentRequests, isLoading } = useAdminPaymentRequests();
  const processRequest = useProcessPaymentRequest();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const handleProcess = async (approve: boolean) => {
    if (!selectedRequest) return;
    
    await processRequest.mutateAsync({
      id: selectedRequest.id,
      approve,
      admin_note: adminNote,
      plan_id: selectedRequest.plan_id,
      user_id: selectedRequest.user_id
    });
    
    setShowDialog(false);
    setSelectedRequest(null);
    setAdminNote("");
  };

  const pendingCount = paymentRequests?.filter(r => r.status === 'submitted').length || 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Requests
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} pending</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Review and approve offline payment requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading payment requests...</div>
        ) : paymentRequests && paymentRequests.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="text-sm">
                    {new Date(request.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-bold">${request.amount_usd}</TableCell>
                  <TableCell className="capitalize">
                    {request.method.replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    {request.proof_upload_url ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(request.proof_upload_url!, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">No proof</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      request.status === 'approved' ? 'default' :
                      request.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.status === 'submitted' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-success text-success hover:bg-success hover:text-success-foreground"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDialog(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNote("Payment rejected.");
                            processRequest.mutate({
                              id: request.id,
                              approve: false,
                              admin_note: "Payment rejected.",
                              user_id: request.user_id
                            });
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No payment requests yet
          </div>
        )}
      </CardContent>

      {/* Approval Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment Request</DialogTitle>
            <DialogDescription>
              Confirm approval for ${selectedRequest?.amount_usd} payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approvalNote">Admin Note (optional)</Label>
              <Input
                id="approvalNote"
                placeholder="Add a note..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleProcess(true)} disabled={processRequest.isPending}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {processRequest.isPending ? "Processing..." : "Approve & Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const Admin = () => {
  const { user, isSuperAdmin } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateProfile[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [stats, setStats] = useState({
    pendingProviders: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    totalBotInstances: 0,
    pendingPayouts: 0,
    totalAffiliates: 0,
    pendingEarnings: 0,
    fraudAlerts: 0
  });

  // Payout approval dialog
  const [payoutDialog, setPayoutDialog] = useState<{
    open: boolean;
    payout: PayoutRequest | null;
    txReference: string;
    adminNote: string;
  }>({
    open: false,
    payout: null,
    txReference: "",
    adminNote: ""
  });

  // Fetch data on mount - RequireSuperAdmin already verified auth
  useEffect(() => {
    if (user) {
      setLoadError(null);
      setDataLoading(true);
      
      // Timeout guard - if data doesn't load in 15 seconds, show error
      const timeout = setTimeout(() => {
        setLoadError("Admin dashboard loading timed out. Check console for RLS or query errors.");
        setDataLoading(false);
      }, 15000);

      fetchData()
        .catch((err) => {
          console.error("[Admin] Data fetch error:", err);
          setLoadError(err?.message || "Failed to load admin data. Check RLS policies.");
        })
        .finally(() => {
          clearTimeout(timeout);
          setDataLoading(false);
        });
    }
  }, [user]);

  const fetchData = async () => {
    const errors: string[] = [];

    // Fetch providers
    const { data: providersData, error: providersError } = await supabase
      .from("providers")
      .select("*")
      .order("created_at", { ascending: false });

    if (providersError) {
      console.error("[Admin] Providers fetch error:", providersError);
      errors.push(`Providers: ${providersError.message}`);
    }
    if (providersData) {
      setProviders(providersData);
    }

    // Fetch user subscriptions with plan info
    const { data: subsData, error: subsError } = await supabase
      .from("user_plan_subscriptions")
      .select(`
        *,
        pricing_plans (name, code)
      `)
      .order("created_at", { ascending: false });

    if (subsError) {
      console.error("[Admin] Subscriptions fetch error:", subsError);
      errors.push(`Subscriptions: ${subsError.message}`);
    }

    if (subsData && subsData.length > 0) {
      const userIds = subsData.map(s => s.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, display_name, whatsapp_number, country")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("[Admin] Profiles fetch error:", profilesError);
        errors.push(`Profiles: ${profilesError.message}`);
      }

      const mergedSubs = subsData.map(sub => ({
        ...sub,
        profiles: profilesData?.find(p => p.user_id === sub.user_id) || null
      }));

      setSubscriptions(mergedSubs as UserSubscription[]);
    } else {
      setSubscriptions([]);
    }

    // Fetch affiliate profiles
    const { data: affiliatesData, error: affiliatesError } = await supabase
      .from("affiliate_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (affiliatesError) {
      console.error("[Admin] Affiliates fetch error:", affiliatesError);
      errors.push(`Affiliates: ${affiliatesError.message}`);
    }
    if (affiliatesData) {
      setAffiliates(affiliatesData);
    }

    // Fetch payout requests with method details
    const { data: payoutsData, error: payoutsError } = await supabase
      .from("payout_requests")
      .select(`
        *,
        payout_methods (type, crypto_network, crypto_address, mobile_network, mobile_number)
      `)
      .order("created_at", { ascending: false });

    if (payoutsError) {
      console.error("[Admin] Payouts fetch error:", payoutsError);
      errors.push(`Payouts: ${payoutsError.message}`);
    }
    if (payoutsData) {
      setPayouts(payoutsData as PayoutRequest[]);
    }

    // Detect fraud patterns
    await detectFraudPatterns();

    // Calculate stats
    const pendingCount = providersData?.filter(p => p.status === 'pending').length || 0;
    const activeSubsCount = subsData?.filter(s => s.status === 'active').length || 0;
    const pendingPayoutsCount = payoutsData?.filter(p => p.status === 'requested').length || 0;

    // Get pending earnings
    const { data: earningsData, error: earningsError } = await supabase
      .from("affiliate_earnings")
      .select("amount_usd")
      .eq("status", "pending");

    if (earningsError) {
      console.error("[Admin] Earnings fetch error:", earningsError);
      errors.push(`Earnings: ${earningsError.message}`);
    }

    const pendingEarningsSum = earningsData?.reduce((sum, e) => sum + Number(e.amount_usd), 0) || 0;

    const { count: botCount, error: botError } = await supabase
      .from("bot_instances")
      .select("*", { count: 'exact', head: true });

    if (botError) {
      console.error("[Admin] Bot instances fetch error:", botError);
      errors.push(`Bot instances: ${botError.message}`);
    }

    setStats({
      pendingProviders: pendingCount,
      totalUsers: subsData?.length || 0,
      activeSubscriptions: activeSubsCount,
      totalBotInstances: botCount || 0,
      pendingPayouts: pendingPayoutsCount,
      totalAffiliates: affiliatesData?.length || 0,
      pendingEarnings: pendingEarningsSum,
      fraudAlerts: fraudFlags.length
    });

    // If any errors occurred, throw them to be caught by the caller
    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  };

  const detectFraudPatterns = async () => {
    const flags: FraudFlag[] = [];

    // Check for self-referrals
    const { data: referrals } = await supabase
      .from("referrals")
      .select("*");

    referrals?.forEach(ref => {
      if (ref.referrer_user_id === ref.referred_user_id) {
        flags.push({
          id: `self-${ref.id}`,
          type: "Self-Referral",
          description: "User attempted to refer themselves",
          user_id: ref.referrer_user_id,
          affiliate_code: ref.affiliate_code,
          severity: "high",
          created_at: ref.attributed_at
        });
      }
    });

    // Check for duplicate device patterns
    const { data: clicks } = await supabase
      .from("referral_clicks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    const deviceCounts: Record<string, { count: number; codes: Set<string> }> = {};
    clicks?.forEach(click => {
      if (click.device_fingerprint_hash) {
        if (!deviceCounts[click.device_fingerprint_hash]) {
          deviceCounts[click.device_fingerprint_hash] = { count: 0, codes: new Set() };
        }
        deviceCounts[click.device_fingerprint_hash].count++;
        deviceCounts[click.device_fingerprint_hash].codes.add(click.code);
      }
    });

    Object.entries(deviceCounts).forEach(([hash, data]) => {
      if (data.count > 50 || data.codes.size > 5) {
        flags.push({
          id: `device-${hash.slice(0, 8)}`,
          type: "Suspicious Device Activity",
          description: `Device used ${data.count} times across ${data.codes.size} affiliate codes`,
          user_id: "",
          affiliate_code: Array.from(data.codes).join(", "),
          severity: data.count > 100 ? "high" : "medium",
          created_at: new Date().toISOString()
        });
      }
    });

    // Check for IP pattern abuse
    const ipCounts: Record<string, number> = {};
    clicks?.forEach(click => {
      if (click.ip_hash) {
        ipCounts[click.ip_hash] = (ipCounts[click.ip_hash] || 0) + 1;
      }
    });

    Object.entries(ipCounts).forEach(([hash, count]) => {
      if (count > 100) {
        flags.push({
          id: `ip-${hash.slice(0, 8)}`,
          type: "IP Abuse",
          description: `Same IP used ${count} times for referral clicks`,
          user_id: "",
          affiliate_code: "",
          severity: count > 200 ? "high" : "medium",
          created_at: new Date().toISOString()
        });
      }
    });

    setFraudFlags(flags);
  };

  const updateProviderStatus = async (providerId: string, newStatus: string, verified: boolean = false) => {
    const { error } = await supabase
      .from("providers")
      .update({ status: newStatus, verified })
      .eq("id", providerId);

    if (error) {
      toast.error("Failed to update provider status");
      return;
    }

    toast.success(`Provider ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`);
    await fetchData();
  };

  const updateUserPlan = async (subscriptionId: string, newPlanCode: string) => {
    const { data: planData } = await supabase
      .from("pricing_plans")
      .select("id")
      .eq("code", newPlanCode)
      .single();

    if (!planData) {
      toast.error("Plan not found");
      return;
    }

    const { error } = await supabase
      .from("user_plan_subscriptions")
      .update({ pricing_plan_id: planData.id })
      .eq("id", subscriptionId);

    if (error) {
      toast.error("Failed to update subscription");
      return;
    }

    toast.success("Subscription updated successfully");
    await fetchData();
  };

  const updateAffiliateStatus = async (userId: string, newStatus: string) => {
    const { error } = await supabase
      .from("affiliate_profiles")
      .update({ status: newStatus })
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to update affiliate status");
      return;
    }

    toast.success(`Affiliate ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
    await fetchData();
  };

  const openPayoutApproval = (payout: PayoutRequest) => {
    setPayoutDialog({
      open: true,
      payout,
      txReference: "",
      adminNote: ""
    });
  };

  const processPayoutApproval = async (approve: boolean) => {
    if (!payoutDialog.payout) return;

    const updates: Record<string, unknown> = {
      status: approve ? 'paid' : 'rejected',
      admin_note: payoutDialog.adminNote,
      processed_at: new Date().toISOString(),
      processed_by: user?.id
    };

    if (approve && payoutDialog.txReference) {
      updates.tx_reference = payoutDialog.txReference;
    }

    const { error } = await supabase
      .from("payout_requests")
      .update(updates as never)
      .eq("id", payoutDialog.payout.id);

    if (error) {
      toast.error("Failed to process payout");
      return;
    }

    // If approved, mark related earnings as paid
    if (approve) {
      await supabase
        .from("affiliate_earnings")
        .update({ status: 'paid' })
        .eq("referrer_user_id", payoutDialog.payout.user_id)
        .eq("status", "approved");
    }

    toast.success(`Payout ${approve ? 'approved and paid' : 'rejected'}`);
    setPayoutDialog({ open: false, payout: null, txReference: "", adminNote: "" });
    await fetchData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'requested':
        return <Badge variant="outline" className="border-warning text-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
      case 'active':
        return <Badge variant="outline" className="border-success text-success"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'rejected':
      case 'suspended':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      case 'paid':
        return <Badge variant="outline" className="border-success text-success"><DollarSign className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive"><AlertOctagon className="w-3 h-3 mr-1" />High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-warning text-warning"><AlertTriangle className="w-3 h-3 mr-1" />Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  // Show error state if loading failed
  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-6 h-6" />
                Admin Dashboard Error
              </CardTitle>
              <CardDescription>
                Failed to load admin data. This is usually caused by RLS policy restrictions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm font-mono text-destructive whitespace-pre-wrap break-words">
                  {loadError}
                </p>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">Common causes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>RLS policies blocking admin access to tables</li>
                  <li>Missing super_admin role in user_roles table</li>
                  <li>Session expired - try logging out and back in</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setLoadError(null);
                    setDataLoading(true);
                    fetchData()
                      .catch((err) => setLoadError(err?.message || "Failed to load"))
                      .finally(() => setDataLoading(false));
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Only show data loading state - auth is handled by RequireSuperAdmin
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Loading admin data...</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>If this takes more than a few seconds, check browser console for errors.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage providers, affiliates, payouts, and fraud detection.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Providers</p>
                  <p className="text-2xl font-bold text-warning">{stats.pendingProviders}</p>
                </div>
                <UserCheck className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Affiliates</p>
                  <p className="text-2xl font-bold">{stats.totalAffiliates}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  <p className="text-2xl font-bold text-warning">{stats.pendingPayouts}</p>
                </div>
                <Wallet className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fraud Alerts</p>
                  <p className="text-2xl font-bold text-destructive">{fraudFlags.length}</p>
                </div>
                <AlertOctagon className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="signals" className="space-y-6">
          <TabsList className="glass-card p-1 flex-wrap">
            <TabsTrigger value="signals" className="flex items-center gap-2">
              <Signal className="w-4 h-4" />
              Signals
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="providers" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Providers
                {stats.pendingProviders > 0 && (
                  <Badge variant="destructive" className="ml-1">{stats.pendingProviders}</Badge>
                )}
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="subscription_requests" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Subscription Requests
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="copy_followers" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Copy Followers
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Subscriptions
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="affiliates" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Affiliates
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="payouts" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Payouts
                {stats.pendingPayouts > 0 && (
                  <Badge variant="destructive" className="ml-1">{stats.pendingPayouts}</Badge>
                )}
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="fraud" className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                Fraud Detection
                {fraudFlags.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{fraudFlags.length}</Badge>
                )}
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Billing Requests
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="deriv_connections" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Deriv Connections
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="api_accounts" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                API Accounts
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="pricing_plans" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Pricing Plans
              </TabsTrigger>
            )}
            <TabsTrigger value="signal_approvals" className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Signal Approvals
            </TabsTrigger>
            <TabsTrigger value="signal_managers" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Signal Managers
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                SEO & Webmasters
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="seo_pages" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                SEO Pages
              </TabsTrigger>
            )}
            <TabsTrigger value="news_events" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              News Events
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="profiles" className="flex items-center gap-2">
                <Contact className="w-4 h-4" />
                Profiles
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="newsletter" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Newsletter
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="admin_roles" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin Roles
              </TabsTrigger>
            )}
            <TabsTrigger value="signal_history" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Signal History
            </TabsTrigger>
            <TabsTrigger value="sports_access" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Sports Access
            </TabsTrigger>
            <TabsTrigger value="live_streams" className="flex items-center gap-2">
              <Signal className="w-4 h-4" />
              Live Streams
            </TabsTrigger>
            <TabsTrigger value="adverts" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Adverts
            </TabsTrigger>
            <TabsTrigger value="training_videos" className="flex items-center gap-2">
              <Signal className="w-4 h-4" />
              Training Videos
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="chart_limits" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Chart Limits
              </TabsTrigger>
            )}
            <TabsTrigger value="managed_mt5" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Managed MT5
            </TabsTrigger>
            <TabsTrigger value="bridge_requests" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Bridge Requests
            </TabsTrigger>
            <TabsTrigger value="editorial" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Editorial
            </TabsTrigger>
            <TabsTrigger value="pwa_health" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              System Health
            </TabsTrigger>
          </TabsList>

          {/* Signals Tab */}
          <TabsContent value="signals">
            <SignalsManagement />
          </TabsContent>

          {/* Signal Approvals Tab */}
          <TabsContent value="signal_approvals">
            <SignalApprovalsTab />
          </TabsContent>

          {/* Signal Managers Tab */}
          <TabsContent value="signal_managers">
            <SignalManagersTab />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <ProductsManagementTab />
          </TabsContent>

          {/* SEO & Webmasters Tab */}
          <TabsContent value="seo">
            <AdminSEOTab />
          </TabsContent>

          {/* SEO Pages Management Tab */}
          <TabsContent value="seo_pages">
            <AdminSEOPagesTab />
          </TabsContent>

          {/* News Events Tab */}
          <TabsContent value="news_events">
            <AdminNewsEventsTab />
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles">
            <AdminProfilesTab />
          </TabsContent>

          {/* Newsletter Tab */}
          <TabsContent value="newsletter">
            <AdminNewsletterTab />
          </TabsContent>

          {/* Admin Roles Tab */}
          <TabsContent value="admin_roles">
            <AdminRolesTab />
          </TabsContent>

          {/* Signal History Tab */}
          <TabsContent value="signal_history">
            <AdminSignalHistoryTab />
          </TabsContent>

          {/* Sports Betting Access Tab */}
          <TabsContent value="sports_access">
            <AdminSportsBettingAccessTab />
          </TabsContent>

          {/* Live Streams Tab */}
          <TabsContent value="live_streams">
            <AdminLiveStreamsTab />
          </TabsContent>

          {/* Adverts Tab */}
          <TabsContent value="adverts">
            <AdminAdvertsTab />
          </TabsContent>

          {/* Training Videos Tab */}
          <TabsContent value="training_videos">
            <AdminTrainingVideosTab />
          </TabsContent>

          {/* Chart Upload Limits Tab */}
          <TabsContent value="chart_limits">
            <AdminChartLimitsTab />
          </TabsContent>

          {/* Managed MT5 Provisioning Tab */}
          <TabsContent value="managed_mt5">
            <AdminManagedMt5Tab />
          </TabsContent>

          {/* Bridge Requests Tab */}
          <TabsContent value="bridge_requests">
            <AdminBridgeRequestsTab />
          </TabsContent>

          {/* Editorial Tab */}
          <TabsContent value="editorial">
            <AdminEditorialTab />
          </TabsContent>

          {/* System Health / PWA Tab */}
          <TabsContent value="pwa_health">
            <AdminPwaHealthTab />
          </TabsContent>

          {/* Subscription Requests Tab */}
          <TabsContent value="subscription_requests">
            <SubscriptionRequestsTab />
          </TabsContent>

          {/* Copy Trading Followers Tab */}
          <TabsContent value="copy_followers">
            <AdminCopyFollowersTab />
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Provider Applications</CardTitle>
                <CardDescription>
                  Review and approve/reject provider applications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Bio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No provider applications yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      providers.map((provider) => (
                        <TableRow key={provider.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{provider.display_name}</p>
                                {provider.verified && (
                                  <Badge variant="outline" className="text-xs border-success text-success">Verified</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {provider.bio || "No bio provided"}
                          </TableCell>
                          <TableCell>{getStatusBadge(provider.status || 'pending')}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{provider.total_trades} trades</p>
                              <p className="text-muted-foreground">{provider.win_rate}% win rate</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(provider.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {provider.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-success text-success hover:bg-success hover:text-success-foreground"
                                    onClick={() => updateProviderStatus(provider.id, 'approved', true)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => updateProviderStatus(provider.id, 'rejected')}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {provider.status === 'approved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-warning text-warning"
                                  onClick={() => updateProviderStatus(provider.id, 'pending', false)}
                                >
                                  Revoke
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>User Subscriptions</CardTitle>
                <CardDescription>
                  Manage user subscription plans.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Current Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No subscriptions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.profiles?.display_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{sub.profiles?.email || 'No email'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {sub.profiles?.whatsapp_number && (
                                <a href={`https://wa.me/${sub.profiles.whatsapp_number.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-400 hover:underline">
                                  <Phone className="h-3 w-3" /> {sub.profiles.whatsapp_number}
                                </a>
                              )}
                              {sub.profiles?.country && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Globe className="h-3 w-3" /> {sub.profiles.country}
                                </span>
                              )}
                              {!sub.profiles?.whatsapp_number && !sub.profiles?.country && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.pricing_plans?.code === 'vip' ? 'default' : 'secondary'}>
                              {sub.pricing_plans?.name || 'Unknown Plan'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.status === 'active' ? 'outline' : 'destructive'} className={sub.status === 'active' ? 'border-success text-success' : ''}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sub.current_period_start ? (
                              <>
                                {new Date(sub.current_period_start).toLocaleDateString()} - 
                                {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'Ongoing'}
                              </>
                            ) : (
                              'Not set'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => updateUserPlan(sub.id, 'free')} disabled={sub.pricing_plans?.code === 'free'}>Free</Button>
                              <Button size="sm" variant="outline" onClick={() => updateUserPlan(sub.id, 'basic')} disabled={sub.pricing_plans?.code === 'basic'}>Basic</Button>
                              <Button size="sm" variant="outline" onClick={() => updateUserPlan(sub.id, 'standard')} disabled={sub.pricing_plans?.code === 'standard'}>Standard</Button>
                              <Button size="sm" variant="default" onClick={() => updateUserPlan(sub.id, 'vip')} disabled={sub.pricing_plans?.code === 'vip'}>VIP</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Affiliate Management</CardTitle>
                <CardDescription>
                  View and manage affiliate accounts, suspend for fraud, track performance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Signups</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No affiliates found
                        </TableCell>
                      </TableRow>
                    ) : (
                      affiliates.map((affiliate) => (
                        <TableRow key={affiliate.user_id}>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {affiliate.affiliate_code}
                            </code>
                          </TableCell>
                          <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                          <TableCell>{affiliate.total_clicks || 0}</TableCell>
                          <TableCell>{affiliate.total_signups || 0}</TableCell>
                          <TableCell className="font-medium text-success">
                            ${(affiliate.total_earnings_usd || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(affiliate.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {affiliate.status === 'active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-destructive text-destructive"
                                  onClick={() => updateAffiliateStatus(affiliate.user_id, 'suspended')}
                                >
                                  <Ban className="w-4 h-4 mr-1" />
                                  Suspend
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-success text-success"
                                  onClick={() => updateAffiliateStatus(affiliate.user_id, 'active')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Activate
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Payout Requests</CardTitle>
                <CardDescription>
                  Approve, reject payouts and add transaction references.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>TX Reference</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No payout requests
                        </TableCell>
                      </TableRow>
                    ) : (
                      payouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell className="font-bold text-lg">
                            ${payout.amount_usd.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payout.payout_methods?.type === 'crypto' ? '₿ Crypto' : '📱 Mobile'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {payout.payout_methods?.type === 'crypto' ? (
                              <div>
                                <p className="font-mono text-xs truncate max-w-[150px]">
                                  {payout.payout_methods.crypto_address}
                                </p>
                                <p className="text-muted-foreground">{payout.payout_methods.crypto_network}</p>
                              </div>
                            ) : (
                              <div>
                                <p>{payout.payout_methods?.mobile_number}</p>
                                <p className="text-muted-foreground">{payout.payout_methods?.mobile_network}</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                          <TableCell className="font-mono text-xs max-w-[100px] truncate">
                            {payout.tx_reference || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(payout.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {payout.status === 'requested' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPayoutApproval(payout)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Process
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fraud Detection Tab */}
          <TabsContent value="fraud">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-destructive" />
                  Fraud Detection
                </CardTitle>
                <CardDescription>
                  Automated detection of suspicious patterns: self-referrals, duplicate devices, IP abuse.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fraudFlags.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 mx-auto text-success mb-4" />
                    <h3 className="text-lg font-semibold">No Fraud Detected</h3>
                    <p className="text-muted-foreground">All affiliate activity looks legitimate.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Affiliate Code</TableHead>
                        <TableHead>Detected</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fraudFlags.map((flag) => (
                        <TableRow key={flag.id}>
                          <TableCell className="font-medium">{flag.type}</TableCell>
                          <TableCell>{getSeverityBadge(flag.severity)}</TableCell>
                          <TableCell className="max-w-[250px]">{flag.description}</TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                              {flag.affiliate_code || 'N/A'}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(flag.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {flag.user_id && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateAffiliateStatus(flag.user_id, 'suspended')}
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Suspend
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Requests Tab */}
          <TabsContent value="billing">
            <BillingRequestsTab />
          </TabsContent>

          {/* Deriv Connections Tab */}
          <TabsContent value="deriv_connections">
            <AdminDerivConnectionsTab />
          </TabsContent>

          {/* API-Connected Accounts Tab */}
          <TabsContent value="api_accounts">
            <AdminApiAccountsTab />
          </TabsContent>

          {/* Pricing Plans Tab */}
          <TabsContent value="pricing_plans">
            <AdminPricingPlansTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Payout Approval Dialog */}
      <Dialog open={payoutDialog.open} onOpenChange={(open) => setPayoutDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout Request</DialogTitle>
            <DialogDescription>
              Review and approve or reject this payout request.
            </DialogDescription>
          </DialogHeader>

          {payoutDialog.payout && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-2xl font-bold">${payoutDialog.payout.amount_usd.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Method</Label>
                  <p className="font-medium">
                    {payoutDialog.payout.payout_methods?.type === 'crypto' 
                      ? `Crypto (${payoutDialog.payout.payout_methods.crypto_network})`
                      : `Mobile Money (${payoutDialog.payout.payout_methods?.mobile_network})`
                    }
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Destination</Label>
                <p className="font-mono text-sm bg-muted p-2 rounded mt-1">
                  {payoutDialog.payout.payout_methods?.type === 'crypto'
                    ? payoutDialog.payout.payout_methods.crypto_address
                    : payoutDialog.payout.payout_methods?.mobile_number
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="txReference">Transaction Reference (required for approval)</Label>
                <Input
                  id="txReference"
                  placeholder="Enter TX hash or reference number"
                  value={payoutDialog.txReference}
                  onChange={(e) => setPayoutDialog(prev => ({ ...prev, txReference: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNote">Admin Note (optional)</Label>
                <Textarea
                  id="adminNote"
                  placeholder="Add a note about this payout..."
                  value={payoutDialog.adminNote}
                  onChange={(e) => setPayoutDialog(prev => ({ ...prev, adminNote: e.target.value }))}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPayoutDialog({ open: false, payout: null, txReference: "", adminNote: "" })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => processPayoutApproval(false)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => processPayoutApproval(true)}
              disabled={!payoutDialog.txReference}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve & Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
