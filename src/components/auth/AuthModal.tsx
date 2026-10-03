import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Globe, Phone, Crown, Zap, Star, Gift } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { lovable } from "@/integrations/lovable/index";

const PLANS = [
  { code: "free", name: "Free Trial", price: "$0/mo", icon: Gift, description: "5 chart analyses/day" },
  { code: "basic", name: "Basic", price: "$10/mo", icon: Star, description: "50 analyses/week + signals" },
  { code: "standard", name: "Standard", price: "$25/mo", icon: Zap, description: "100 analyses/month + copy trade" },
  { code: "vip", name: "VIP", price: "$49/mo", icon: Crown, description: "Unlimited + all strategies" },
];

const COUNTRIES = [
  { code: "ZM", name: "Zambia" }, { code: "KE", name: "Kenya" }, { code: "NG", name: "Nigeria" },
  { code: "ZA", name: "South Africa" }, { code: "GH", name: "Ghana" }, { code: "TZ", name: "Tanzania" },
  { code: "UG", name: "Uganda" }, { code: "RW", name: "Rwanda" }, { code: "MW", name: "Malawi" },
  { code: "ZW", name: "Zimbabwe" }, { code: "BW", name: "Botswana" }, { code: "MZ", name: "Mozambique" },
  { code: "ET", name: "Ethiopia" }, { code: "CD", name: "DR Congo" }, { code: "CM", name: "Cameroon" },
  { code: "SN", name: "Senegal" }, { code: "CI", name: "Côte d'Ivoire" },
  { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" }, { code: "AU", name: "Australia" },
  { code: "IN", name: "India" }, { code: "PK", name: "Pakistan" }, { code: "BD", name: "Bangladesh" },
  { code: "MY", name: "Malaysia" }, { code: "ID", name: "Indonesia" }, { code: "PH", name: "Philippines" },
  { code: "AE", name: "UAE" }, { code: "SA", name: "Saudi Arabia" },
  { code: "BR", name: "Brazil" }, { code: "MX", name: "Mexico" }, { code: "CO", name: "Colombia" },
  { code: "FR", name: "France" }, { code: "DE", name: "Germany" }, { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" }, { code: "PT", name: "Portugal" }, { code: "NL", name: "Netherlands" },
  { code: "JP", name: "Japan" }, { code: "CN", name: "China" }, { code: "RU", name: "Russia" },
].sort((a, b) => a.name.localeCompare(b.name));

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Google sign-in failed", description: err?.message || "Unknown error", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!", description: "You have been signed in successfully." });
      onOpenChange(false);
      setEmail(""); setPassword("");
      navigate("/deriv-app");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast({ title: "Name required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    if (!whatsapp.trim()) {
      toast({ title: "WhatsApp required", description: "Please enter your WhatsApp number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, country, whatsapp, selectedPlan, displayName.trim());
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Please check your email to verify your account." });
      onOpenChange(false);
      setEmail(""); setPassword(""); setCountry(""); setWhatsapp(""); setDisplayName("");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Botvio Account
          </DialogTitle>
        </DialogHeader>

        {/* Google OAuth Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </Button>

        <div className="relative my-2">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input id="signin-email" type="email" placeholder="trader@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password
                </Label>
                <Input id="signin-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-secondary/50" />
              </div>
              <Button
                type="button"
                variant="link"
                className="px-0 text-xs text-primary h-auto"
                onClick={async () => {
                  if (!email.trim()) {
                    toast({ title: "Enter your email first", variant: "destructive" });
                    return;
                  }
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) {
                    toast({ title: "Failed to send reset email", description: error.message, variant: "destructive" });
                  } else {
                    toast({ title: "Reset email sent!", description: "Check your inbox for a password reset link." });
                  }
                }}
              >
                Forgot password?
              </Button>
              <Button type="submit" disabled={loading} className="w-full" variant="gold">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in...</> : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
              <User className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">Create your Botvio account</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign up on the dedicated account page. Your full profile, WhatsApp number and starting plan are completed there.
              </p>
              <Button type="button" variant="gold" className="mt-4 w-full" onClick={() => { onOpenChange(false); navigate("/signup"); }}>
                Open Sign Up Page
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};