import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePricingPlans, useMySubscription } from "@/hooks/useBotvio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Header } from "@/components/trading/Header";
import { PaymentMethodSelector } from "@/components/billing/PaymentMethodSelector";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Crown, Rocket, Clock, Users, Bot, Copy, Star } from "lucide-react";
import { toast } from "sonner";

const Billing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: plans, isLoading: plansLoading } = usePricingPlans();
  const { data: mySubscription, isLoading: subLoading } = useMySubscription();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  const handlePaymentInitiated = (method: string, details: any) => {
    console.log("Payment initiated:", method, details);
    toast.success("Payment initiated! You'll receive confirmation shortly.");
    setShowPaymentModal(false);
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
        return "2 days trial";
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
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Pricing Plans</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your trading needs. All plans include copy trading!
          </p>
        </div>

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

        {/* Plans Grid */}
        {plansLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
                      <Button 
                        className={`w-full ${isVip ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700" : ""}`}
                        variant={isPro ? "default" : "outline"}
                        onClick={() => handleUpgrade(plan)}
                      >
                        Upgrade to {plan.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

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

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can cancel your subscription at any time. Your access will continue until the end of your billing period.
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

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Can I become a copy trading provider for free?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! The free Starter plan allows you to become a signal provider and connect up to 2 accounts. Upgrade to Pro or VIP for more accounts and features.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Do I need a broker account?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you'll need a Deriv or other supported broker account to connect and trade. We don't hold your funds - all trading happens directly on your broker account.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
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
    </div>
  );
};

export default Billing;
