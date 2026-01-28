import { useAuth } from "@/contexts/AuthContext";
import { usePricingPlans, useMySubscription } from "@/hooks/useBotvio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/trading/Header";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Crown, Rocket } from "lucide-react";
import { toast } from "sonner";

const Billing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: plans, isLoading: plansLoading } = usePricingPlans();
  const { data: mySubscription, isLoading: subLoading } = useMySubscription();

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

  const handleUpgrade = (planCode: string) => {
    // For now, just show a message. In production, integrate with payment provider
    toast.info(`Upgrade to ${planCode} coming soon! Contact support for early access.`);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Pricing Plans</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your trading needs. Upgrade anytime to unlock more features.
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
                <Badge variant="outline">Active</Badge>
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
              
              return (
                <Card 
                  key={plan.id} 
                  className={`glass-card relative overflow-hidden ${
                    isPro ? "border-primary ring-2 ring-primary/20" : ""
                  }`}
                >
                  {isPro && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                      Popular
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${getPlanColor(plan.code)} flex items-center justify-center text-white mb-4`}>
                      {getPlanIcon(plan.code)}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.code === "starter" && "Get started for free"}
                      {plan.code === "pro" && "For serious traders"}
                      {plan.code === "vip" && "Maximum power"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">${plan.price_usd}</span>
                      <span className="text-muted-foreground">/month</span>
                      {plan.price_zmw > 0 && (
                        <p className="text-sm text-muted-foreground">
                          or K{plan.price_zmw}/month
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6 text-left">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">
                          {plan.max_bot_instances >= 999 ? "Unlimited" : plan.max_bot_instances} bot instances
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">
                          {plan.max_accounts >= 10 ? "Unlimited" : plan.max_accounts} connected accounts
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 flex-shrink-0 ${plan.allow_copy_trading ? "text-success" : "text-muted-foreground"}`} />
                        <span className={`text-sm ${!plan.allow_copy_trading ? "text-muted-foreground" : ""}`}>
                          Copy trading
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 flex-shrink-0 ${plan.allow_premium_bots ? "text-success" : "text-muted-foreground"}`} />
                        <span className={`text-sm ${!plan.allow_premium_bots ? "text-muted-foreground" : ""}`}>
                          Premium bots
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 flex-shrink-0 ${plan.allow_provider_listing ? "text-success" : "text-muted-foreground"}`} />
                        <span className={`text-sm ${!plan.allow_provider_listing ? "text-muted-foreground" : ""}`}>
                          Become a provider
                        </span>
                      </li>
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
                        className="w-full" 
                        variant={isPro ? "default" : "outline"}
                        onClick={() => handleUpgrade(plan.code)}
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
                  We accept Visa, Mastercard, mobile money (Airtel, MTN, Zamtel), and bank transfers for Zambian users.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Do I need a broker account?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you'll need a Deriv or Binance account to connect and trade. We don't hold your funds - all trading happens directly on your broker account.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Billing;
