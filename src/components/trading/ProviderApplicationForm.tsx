import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMySubscription } from "@/hooks/useBotvio";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Upload, TrendingUp, Users, Shield, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ProviderApplicationFormProps {
  onSuccess?: () => void;
}

export const ProviderApplicationForm = ({ onSuccess }: ProviderApplicationFormProps) => {
  const { user } = useAuth();
  const { data: myPlan } = useMySubscription();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    experience_years: "",
    trading_style: "",
    avg_monthly_return: "",
    risk_management: "",
    social_proof_url: "",
    agree_terms: false,
  });

  // Allow all users to apply as providers (no VIP restriction)
  const canBeProvider = true;

  const tradingStyles = [
    { value: "scalper", label: "Scalper (Quick trades, small profits)" },
    { value: "day_trader", label: "Day Trader (Intraday positions)" },
    { value: "swing", label: "Swing Trader (Multi-day holds)" },
    { value: "signal", label: "Signal Provider (Entry/Exit alerts)" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to apply");
      return;
    }

    if (!form.display_name || !form.bio || !form.experience_years || !form.trading_style) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!form.agree_terms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("providers").insert({
        user_id: user.id,
        display_name: form.display_name,
        bio: form.bio,
        status: "pending",
      });

      if (error) throw error;

      // Send notification to admins (via notifications table)
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "info",
        title: "Provider Application Submitted",
        message: `Your application to become a signal provider is under review. We'll notify you within 24-48 hours.`,
      });

      toast.success("Application submitted successfully! Awaiting admin review.");
      onSuccess?.();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canBeProvider) {
    return (
      <Card className="glass-card border-warning/30">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-warning" />
          </div>
          <h3 className="text-xl font-semibold mb-2">VIP Plan Required</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Only VIP members can become signal providers. Upgrade your plan to unlock this feature and start earning from your trading expertise.
          </p>
          <Button variant="gold" asChild>
            <Link to="/billing">
              Upgrade to VIP <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Provider Application</CardTitle>
            <CardDescription>Step {step} of 3 - {step === 1 ? "Basic Info" : step === 2 ? "Trading Details" : "Verification"}</CardDescription>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-1 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  placeholder="Your trader name (visible to subscribers)"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">This will be your public identity as a provider</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Trading Philosophy *</Label>
                <Textarea
                  id="bio"
                  placeholder="Describe your trading experience, strategies, and what makes you unique..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_years">Trading Experience *</Label>
                <Select
                  value={form.experience_years}
                  onValueChange={(v) => setForm({ ...form, experience_years: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Less than 1 year</SelectItem>
                    <SelectItem value="1-2">1-2 years</SelectItem>
                    <SelectItem value="2-5">2-5 years</SelectItem>
                    <SelectItem value="5+">5+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  if (!form.display_name || !form.bio || !form.experience_years) {
                    toast.error("Please fill in all required fields");
                    return;
                  }
                  setStep(2);
                }}
              >
                Continue to Trading Style
              </Button>
            </div>
          )}

          {/* Step 2: Trading Style */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Trading Style *</Label>
                <Select
                  value={form.trading_style}
                  onValueChange={(v) => setForm({ ...form, trading_style: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary style" />
                  </SelectTrigger>
                  <SelectContent>
                    {tradingStyles.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="avg_monthly_return">Avg Monthly Return (%)</Label>
                  <Input
                    id="avg_monthly_return"
                    type="number"
                    placeholder="e.g. 15"
                    value={form.avg_monthly_return}
                    onChange={(e) => setForm({ ...form, avg_monthly_return: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="risk_management">Max Drawdown (%)</Label>
                  <Input
                    id="risk_management"
                    type="number"
                    placeholder="e.g. 10"
                    value={form.risk_management}
                    onChange={(e) => setForm({ ...form, risk_management: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    if (!form.trading_style) {
                      toast.error("Please select a trading style");
                      return;
                    }
                    setStep(3);
                  }}
                >
                  Continue to Verification
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verification Process
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                    <span>Your application will be reviewed by our admin team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                    <span>We may request trading history or performance proof</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                    <span>Approval typically takes 24-48 hours</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="social_proof_url">Social Proof (Optional)</Label>
                <Input
                  id="social_proof_url"
                  placeholder="Link to your trading account, Telegram, or YouTube channel"
                  value={form.social_proof_url}
                  onChange={(e) => setForm({ ...form, social_proof_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Verified accounts with proof of performance are more likely to attract subscribers
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
                <Checkbox
                  id="terms"
                  checked={form.agree_terms}
                  onCheckedChange={(checked) => setForm({ ...form, agree_terms: checked as boolean })}
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  I agree to the Provider Terms of Service and understand that I am responsible for the signals I provide. I confirm that my trading history is accurate and I will trade ethically.
                </Label>
              </div>

              {/* Application Summary */}
              <div className="p-4 rounded-lg bg-card border">
                <h4 className="font-medium mb-3">Application Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Name:</div>
                  <div>{form.display_name}</div>
                  <div className="text-muted-foreground">Experience:</div>
                  <div>{form.experience_years} years</div>
                  <div className="text-muted-foreground">Style:</div>
                  <div className="capitalize">{form.trading_style?.replace("_", " ")}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting || !form.agree_terms}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* Benefits Preview */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-3">Provider Benefits</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Unlimited Subscribers</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-success" />
              <p className="text-xs text-muted-foreground">Performance Tracking</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Verified Badge</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
