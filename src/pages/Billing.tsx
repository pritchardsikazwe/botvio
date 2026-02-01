import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePricingPlans, useMySubscription } from "@/hooks/useBotvio";
import { useTrialStatus, useActivateTrial, usePaymentRequests, useCreatePaymentRequest, useUploadPaymentProof } from "@/hooks/useBilling";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/trading/Header";
import { PaymentMethodSelector } from "@/components/billing/PaymentMethodSelector";
import { useNavigate, Link } from "react-router-dom";
import { Check, Crown, Clock, Users, Bot, Copy, Star, Upload, Gift, AlertTriangle, Sparkles, Shield, Zap } from "lucide-react";
import { toast } from "sonner";

const Billing = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: plans, isLoading: plansLoading } = usePricingPlans();
  const { data: mySubscription, isLoading: subLoading } = useMySubscription();
  const { data: trialStatus } = useTrialStatus();
  const { data: paymentRequests } = usePaymentRequests();
  const activateTrial = useActivateTrial();
  const createPaymentRequest = useCreatePaymentRequest();
  const uploadProof = useUploadPaymentProof();
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineMethod, setOfflineMethod] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const currentPlanCode = mySubscription?.pricing_plan?.code || "trial";

  // Redirect admins to admin panel
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
          <p className="text-muted-foreground mb-6">
            As an admin, you have full access to the platform.
          </p>
          <Button onClick={() => navigate("/admin")}>Go to Admin Panel</Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to manage billing</h1>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const handleActivateTrial = () => {
    activateTrial.mutate();
  };

  const handleUpgradeToVIP = (plan: any) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentInitiated = (method: string, details: any) => {
    console.log("Payment initiated:", method, details);
    toast.success("Payment initiated! You'll receive confirmation shortly.");
    setShowPaymentModal(false);
  };

  const handleSubmitOfflinePayment = async () => {
    if (!offlineMethod) {
      toast.error("Please select a payment method");
      return;
    }
    
    setUploading(true);
    let proofUrl = undefined;
    
    try {
      if (proofFile) {
        proofUrl = await uploadProof.mutateAsync(proofFile);
      }
      
      await createPaymentRequest.mutateAsync({
        plan_id: selectedPlan.id,
        amount_usd: selectedPlan.price_usd,
        method: offlineMethod,
        proof_upload_url: proofUrl
      });
      
      setShowOfflineModal(false);
      setOfflineMethod("");
      setProofFile(null);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setUploading(false);
    }
  };

  // Filter to only show active plans (Trial + VIP)
  const activePlans = plans?.filter(p => p.is_active) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription Plans</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start with a free trial, then upgrade to VIP for unlimited access. Strategies can be purchased individually.
          </p>
        </div>

        {/* Trial Banner */}
        {!trialStatus?.hasUsedTrial && (
          <Card className="glass-card mb-8 max-w-2xl mx-auto border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-600/10">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-amber-500/20">
                    <Gift className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Free 7-Day Trial!</h3>
                    <p className="text-sm text-muted-foreground">
                      Try all features for 1 week. No payment required.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="gold" 
                  onClick={handleActivateTrial}
                  disabled={activateTrial.isPending}
                >
                  {activateTrial.isPending ? "Activating..." : "Start Free Trial"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Trial Banner */}
        {trialStatus?.isTrialActive && (
          <Card className="glass-card mb-8 max-w-2xl mx-auto border-success/30 bg-success/10">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium">Trial Active</p>
                    <p className="text-sm text-muted-foreground">
                      {trialStatus.hoursRemaining} hours remaining ({Math.ceil(trialStatus.hoursRemaining / 24)} days)
                    </p>
                  </div>
                </div>
                <Badge className="bg-success text-success-foreground">Trial Active</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Plan */}
        {!subLoading && mySubscription && (
          <Card className="glass-card mb-8 max-w-md mx-auto">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-xl font-bold">{mySubscription.pricing_plan?.name || "Trial"}</p>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="plans" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="plans">
            {/* Plans Grid - Trial + VIP only */}
            {plansLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {activePlans.map((plan) => {
                  const isTrial = plan.code === "trial";
                  const isVIP = plan.code === "vip";
                  const isCurrentPlan = plan.code === currentPlanCode;
                  
                  return (
                    <Card 
                      key={plan.id} 
                      className={`glass-card relative overflow-hidden ${
                        isVIP ? "border-amber-500/50 ring-2 ring-amber-500/20" : ""
                      }`}
                    >
                      {isVIP && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                          Best Value
                        </div>
                      )}
                      
                      <CardHeader className="text-center pb-2">
                        <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-white mb-4 ${
                          isTrial 
                            ? "bg-gradient-to-br from-blue-500 to-blue-600" 
                            : "bg-gradient-to-br from-amber-500 to-amber-600"
                        }`}>
                          {isTrial ? <Zap className="h-6 w-6" /> : <Crown className="h-6 w-6" />}
                        </div>
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <CardDescription>
                          {isTrial ? "7 days free access" : "Unlimited monthly access"}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="text-center">
                        <div className="mb-6">
                          <span className="text-4xl font-bold">
                            {plan.price_usd === 0 ? "Free" : `$${plan.price_usd}`}
                          </span>
                          {plan.price_usd > 0 && (
                            <span className="text-muted-foreground">/month</span>
                          )}
                        </div>

                        <ul className="space-y-3 mb-6 text-left">
                          <li className="flex items-center gap-2">
                            <div className="p-1 rounded-full bg-success/10">
                              <Check className="h-3 w-3 text-success" />
                            </div>
                            <span className="text-sm flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {plan.max_accounts >= 999 ? "Unlimited" : plan.max_accounts} accounts
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="p-1 rounded-full bg-success/10">
                              <Check className="h-3 w-3 text-success" />
                            </div>
                            <span className="text-sm flex items-center gap-2">
                              <Bot className="h-4 w-4" />
                              {plan.max_bot_instances >= 999 ? "Unlimited" : plan.max_bot_instances} bots
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className={`p-1 rounded-full ${plan.allow_copy_trading ? "bg-success/10" : "bg-muted"}`}>
                              {plan.allow_copy_trading ? <Check className="h-3 w-3 text-success" /> : <span className="h-3 w-3 block" />}
                            </div>
                            <span className={`text-sm flex items-center gap-2 ${!plan.allow_copy_trading ? "text-muted-foreground line-through" : ""}`}>
                              <Copy className="h-4 w-4" />
                              Copy trading
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className={`p-1 rounded-full ${plan.allow_premium_bots ? "bg-success/10" : "bg-muted"}`}>
                              {plan.allow_premium_bots ? <Check className="h-3 w-3 text-success" /> : <span className="h-3 w-3 block" />}
                            </div>
                            <span className={`text-sm flex items-center gap-2 ${!plan.allow_premium_bots ? "text-muted-foreground line-through" : ""}`}>
                              <Star className="h-4 w-4" />
                              Premium bots
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className={`p-1 rounded-full ${plan.allow_provider_listing ? "bg-success/10" : "bg-muted"}`}>
                              {plan.allow_provider_listing ? <Check className="h-3 w-3 text-success" /> : <span className="h-3 w-3 block" />}
                            </div>
                            <span className={`text-sm flex items-center gap-2 ${!plan.allow_provider_listing ? "text-muted-foreground line-through" : ""}`}>
                              <Crown className="h-4 w-4" />
                              Become a provider
                            </span>
                          </li>
                        </ul>

                        {isCurrentPlan ? (
                          <Button className="w-full" variant="outline" disabled>
                            Current Plan
                          </Button>
                        ) : isTrial ? (
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={handleActivateTrial}
                            disabled={activateTrial.isPending || trialStatus?.hasUsedTrial}
                          >
                            {trialStatus?.hasUsedTrial ? "Trial Used" : "Start Trial"}
                          </Button>
                        ) : (
                          <Button 
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                            onClick={() => handleUpgradeToVIP(plan)}
                          >
                            Upgrade to VIP
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Individual Strategies Note */}
            <Card className="glass-card mt-8 max-w-2xl mx-auto">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Buy Strategies Individually</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      You don't need a subscription to buy strategies! Each strategy can be purchased separately 
                      and used forever.
                    </p>
                    <Button variant="outline" asChild>
                      <Link to="/bots">Browse Strategies</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your recent payments and requests</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentRequests && paymentRequests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentRequests.map((request: any) => (
                        <TableRow key={request.id}>
                          <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>${request.amount_usd}</TableCell>
                          <TableCell className="capitalize">{request.method}</TableCell>
                          <TableCell>
                            <Badge variant={
                              request.status === "approved" ? "default" :
                              request.status === "pending" ? "secondary" : "destructive"
                            }>
                              {request.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No payment history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Choose your preferred payment method
            </DialogDescription>
          </DialogHeader>
          <PaymentMethodSelector
            amount={selectedPlan?.price_usd || 0}
            planCode={selectedPlan?.code || "vip"}
            planName={selectedPlan?.name || "VIP"}
            onPaymentInitiated={handlePaymentInitiated}
          />
        </DialogContent>
      </Dialog>

      {/* Offline Payment Modal */}
      <Dialog open={showOfflineModal} onOpenChange={setShowOfflineModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offline Payment</DialogTitle>
            <DialogDescription>
              Submit your payment proof for manual verification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <select 
                className="w-full p-2 border rounded mt-1"
                value={offlineMethod}
                onChange={(e) => setOfflineMethod(e.target.value)}
              >
                <option value="">Select method...</option>
                <option value="airtel_money">Airtel Money</option>
                <option value="mtn_money">MTN Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="crypto_usdt">USDT (Crypto)</option>
              </select>
            </div>
            <div>
              <Label>Upload Proof (optional)</Label>
              <Input 
                type="file" 
                accept="image/*,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfflineModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitOfflinePayment} disabled={uploading}>
              {uploading ? "Submitting..." : "Submit Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;