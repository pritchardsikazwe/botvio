import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePricingPlans, useMySubscription } from "@/hooks/useBotvio";
import { useTrialStatus, useActivateTrial, usePaymentRequests, useCreatePaymentRequest, useUploadPaymentProof } from "@/hooks/useBilling";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/trading/Header";
import { PaymentMethodSelector } from "@/components/billing/PaymentMethodSelector";
import { useNavigate, Link } from "react-router-dom";
import { Check, Zap, Crown, Rocket, Clock, Users, Bot, Copy, Star, Upload, Gift, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const Billing = () => {
  const { user } = useAuth();
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

  const currentPlanCode = mySubscription?.pricing_plan?.code || "starter";

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

  const handleUpgrade = (plan: any) => {
    if (plan.price_usd === 0) {
      toast.info("You're already on the free plan!");
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleOfflinePayment = (plan: any) => {
    setSelectedPlan(plan);
    setShowOfflineModal(true);
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

  const handlePaymentInitiated = (method: string, details: any) => {
    console.log("Payment initiated:", method, details);
    toast.success("Payment initiated! You'll receive confirmation shortly.");
    setShowPaymentModal(false);
  };

  const handleActivateTrial = () => {
    activateTrial.mutate();
  };

  const getPlanIcon = (code: string) => {
    switch (code) {
      case "starter":
        return <Zap className="h-6 w-6" />;
      case "pro":
        return <Rocket className="h-6 w-6" />;
      case "vip":
        return <Crown className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanColor = (code: string) => {
    switch (code) {
      case "starter":
        return "from-gray-500 to-gray-600";
      case "pro":
        return "from-blue-500 to-blue-600";
      case "vip":
        return "from-amber-500 to-amber-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getPlanDuration = (code: string) => {
    switch (code) {
      case "starter":
        return "Free";
      case "pro":
        return "15 days";
      case "vip":
        return "30 days";
      default:
        return "monthly";
    }
  };

  const getPlanFeatures = (plan: any) => {
    const features = [];
    
    features.push({
      label: `${plan.max_accounts >= 999 ? "Unlimited" : plan.max_accounts} connected accounts`,
      icon: <Users className="h-4 w-4" />,
      enabled: true,
    });
    
    features.push({
      label: `${plan.max_bot_instances >= 999 ? "Unlimited" : plan.max_bot_instances} bot instances`,
      icon: <Bot className="h-4 w-4" />,
      enabled: true,
    });
    
    features.push({
      label: "Copy trading",
      icon: <Copy className="h-4 w-4" />,
      enabled: plan.allow_copy_trading,
    });
    
    features.push({
      label: "Premium bots",
      icon: <Star className="h-4 w-4" />,
      enabled: plan.allow_premium_bots,
    });
    
    features.push({
      label: "Become a signal provider",
      icon: <Crown className="h-4 w-4" />,
      enabled: plan.allow_provider_listing,
    });
    
    return features;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Pricing Plans</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your trading needs. All plans include copy trading!
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
                    <h3 className="font-bold text-lg">Free 2-Day VIP Trial!</h3>
                    <p className="text-sm text-muted-foreground">
                      Try all VIP features for 48 hours. No payment required.
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
                    <p className="font-medium">VIP Trial Active</p>
                    <p className="text-sm text-muted-foreground">
                      {trialStatus.hoursRemaining} hours remaining
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
                  <p className="text-xl font-bold">{mySubscription.pricing_plan?.name}</p>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="plans" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="plans">Pricing Plans</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="plans">
            {/* Plans Grid */}
            {plansLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans?.map((plan) => {
                  const isCurrentPlan = plan.code === currentPlanCode;
                  const isPro = plan.code === "pro";
                  const isVip = plan.code === "vip";
                  const features = getPlanFeatures(plan);
                  
                  return (
                    <Card 
                      key={plan.id} 
                      className={`glass-card relative overflow-hidden ${
                        isPro ? "border-primary ring-2 ring-primary/20 scale-105" : ""
                      } ${isVip ? "border-amber-500/50" : ""}`}
                    >
                      {isPro && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                          Most Popular
                        </div>
                      )}
                      {isVip && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                          Best Value
                        </div>
                      )}
                      
                      <CardHeader className="text-center pb-2">
                        <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${getPlanColor(plan.code)} flex items-center justify-center text-white mb-4`}>
                          {getPlanIcon(plan.code)}
                        </div>
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <CardDescription className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getPlanDuration(plan.code)}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="text-center">
                        <div className="mb-6">
                          <span className="text-4xl font-bold">${plan.price_usd}</span>
                          {plan.code !== "starter" && (
                            <span className="text-muted-foreground">/{getPlanDuration(plan.code)}</span>
                          )}
                          {plan.price_zmw > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              or K{plan.price_zmw}
                            </p>
                          )}
                        </div>

                        <ul className="space-y-3 mb-6 text-left">
                          {features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <div className={`p-1 rounded-full ${feature.enabled ? "bg-success/10" : "bg-muted"}`}>
                                {feature.enabled ? (
                                  <Check className="h-3 w-3 text-success" />
                                ) : (
                                  <span className="h-3 w-3 block" />
                                )}
                              </div>
                              <span className={`text-sm flex items-center gap-2 ${!feature.enabled ? "text-muted-foreground line-through" : ""}`}>
                                {feature.icon}
                                {feature.label}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {isCurrentPlan ? (
                          <Button className="w-full" variant="outline" disabled>
                            Current Plan
                          </Button>
                        ) : plan.code === "starter" ? (
                          <Button className="w-full" variant="outline" disabled>
                            Free Plan
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <Button 
                              className={`w-full ${isVip ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700" : ""}`}
                              variant={isPro ? "default" : "outline"}
                              onClick={() => handleUpgrade(plan)}
                            >
                              Upgrade to {plan.name}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-muted-foreground"
                              onClick={() => handleOfflinePayment(plan)}
                            >
                              <Upload className="h-3 w-3 mr-2" />
                              Pay Offline
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your payment requests and their status</CardDescription>
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
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">${request.amount_usd}</TableCell>
                          <TableCell className="capitalize">{request.method.replace("_", " ")}</TableCell>
                          <TableCell>
                            <Badge variant={
                              request.status === "approved" ? "default" :
                              request.status === "rejected" ? "destructive" : "secondary"
                            }>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {request.admin_note || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No payment history yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Methods Info */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold mb-4">We Accept</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2">
              <span className="mr-2">💳</span> Visa / Mastercard
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <span className="mr-2">₿</span> Bitcoin / USDT
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <span className="mr-2">📱</span> M-Pesa / Airtel Money
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <span className="mr-2">📱</span> MTN MoMo / EcoCash
            </Badge>
          </div>
        </div>

        {/* Deriv Branding + Disclaimer */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span className="text-sm">Powered by</span>
            <span className="font-semibold">Deriv API</span>
          </div>
          <div className="max-w-2xl mx-auto p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground text-left">
                <strong className="text-foreground">Risk Warning:</strong> Trading binary options, CFDs, and synthetic indices involves significant risk of loss. 
                You may lose all of your invested capital. Botvio is powered by Deriv API but is not affiliated with, 
                endorsed by, or sponsored by Deriv. Past performance is not indicative of future results.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-primary underline">Terms of Service</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-primary underline">Privacy Policy</Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">How do offline payments work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Click "Pay Offline" and upload proof of payment (screenshot, receipt, or transaction hash). 
                  Our admin team will review and approve your subscription within 24 hours.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Can I try before I buy?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Every new user gets a free 2-day VIP trial. No payment required. 
                  Experience all premium features before deciding to subscribe.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Subscriptions are not auto-renewed. Your access continues until the end of your billing period.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept Visa, Mastercard, cryptocurrency (BTC, USDT, ETH, LTC), and mobile money including M-Pesa, Airtel Money, MTN MoMo, EcoCash, and more across Africa.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Online Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Your Upgrade</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <PaymentMethodSelector
              planCode={selectedPlan.code}
              planName={selectedPlan.name}
              amount={selectedPlan.price_usd}
              onPaymentInitiated={handlePaymentInitiated}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Offline Payment Modal */}
      <Dialog open={showOfflineModal} onOpenChange={setShowOfflineModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Offline Payment</DialogTitle>
            <DialogDescription>
              Pay ${selectedPlan?.price_usd} for {selectedPlan?.name} plan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={offlineMethod} onValueChange={setOfflineMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money (M-Pesa, Airtel, MTN)</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency (BTC, USDT)</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Proof of Payment (Optional)</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Upload screenshot, receipt, or transaction confirmation
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="font-medium mb-1">Payment Instructions:</p>
              <ul className="text-muted-foreground text-xs space-y-1">
                <li>• Mobile Money: Send to +260 XXX XXX XXX</li>
                <li>• Crypto: Send to wallet address (contact support)</li>
                <li>• Include your email as reference</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfflineModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitOfflinePayment} disabled={uploading || !offlineMethod}>
              {uploading ? "Submitting..." : "Submit Payment Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
