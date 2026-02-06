import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTradingAccounts, useAddTradingAccount, useDeleteTradingAccount } from "@/hooks/useBotvio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/trading/Header";
import { useNavigate } from "react-router-dom";
import { Wallet, Plus, Trash2, CheckCircle, XCircle, Eye, EyeOff, ExternalLink, Gift, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


// Affiliate links
const AFFILIATE_LINKS = {
  deriv: "https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827",
  exness: "https://one.exness-track.com/a/ts1kvs1k",
  binance: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU",
};

const COMMUNITY_LINKS = {
  whatsapp: "https://chat.whatsapp.com/KInahrKam85BTyFbIgC3zJ",
  telegram: "https://t.me/+AZjYpDncHEA5OTM0",
};

const Accounts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: accounts, isLoading } = useTradingAccounts();
  const addAccount = useAddTradingAccount();
  const deleteAccount = useDeleteTradingAccount();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [formData, setFormData] = useState({
    broker: "deriv" as "deriv" | "binance" | "exness",
    label: "",
    api_key: "",
    api_secret: "",
    login_id: "",
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to manage accounts</h1>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label || !formData.api_key) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      await addAccount.mutateAsync({
        broker: formData.broker === "exness" ? "deriv" : formData.broker, // Map exness to deriv for now
        label: formData.label,
        api_key: formData.api_key,
        api_secret: formData.broker === "binance" ? formData.api_secret : undefined,
        login_id: formData.login_id || undefined,
      });
      
      toast.success("Account connected successfully!");
      setIsDialogOpen(false);
      setFormData({
        broker: "deriv",
        label: "",
        api_key: "",
        api_secret: "",
        login_id: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to connect account");
    }
  };

  const handleDelete = async (accountId: string, label: string) => {
    if (!confirm(`Are you sure you want to remove "${label}"?`)) return;
    
    try {
      await deleteAccount.mutateAsync(accountId);
      toast.success("Account removed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove account");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trading Accounts</h1>
            <p className="text-muted-foreground">
              Connect your broker accounts to enable automated trading
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Connect Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Connect Trading Account</DialogTitle>
                <DialogDescription>
                  Add your broker API credentials to enable trading
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Broker</Label>
                  <Select
                    value={formData.broker}
                    onValueChange={(v: "deriv" | "binance" | "exness") => setFormData({ ...formData, broker: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deriv">Deriv</SelectItem>
                      <SelectItem value="exness">Exness</SelectItem>
                      <SelectItem value="binance" disabled>Binance (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Account Label *</Label>
                  <Input
                    id="label"
                    placeholder="e.g., My Trading Account"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_key">
                    {formData.broker === "deriv" ? "API Token *" : "API Key *"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="api_key"
                      type={showToken ? "text" : "password"}
                      placeholder={formData.broker === "deriv" ? "Your Deriv API token" : "Your API key"}
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {formData.broker === "binance" && (
                  <div className="space-y-2">
                    <Label htmlFor="api_secret">API Secret *</Label>
                    <Input
                      id="api_secret"
                      type="password"
                      placeholder="Your API secret"
                      value={formData.api_secret}
                      onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login_id">Login ID (Optional)</Label>
                  <Input
                    id="login_id"
                    placeholder="e.g., CR1234567"
                    value={formData.login_id}
                    onChange={(e) => setFormData({ ...formData, login_id: e.target.value })}
                  />
                </div>

                {formData.broker === "deriv" && (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium mb-2">How to get your Deriv API Token:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Log in to Deriv.com</li>
                      <li>Go to Settings → API Token</li>
                      <li>Create a token with <strong>Trade</strong> permission</li>
                      <li>Copy and paste the token above</li>
                    </ol>
                    <a
                      href="https://app.deriv.com/account/api-token"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary mt-2 hover:underline"
                    >
                      Open Deriv API Token page <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {formData.broker === "exness" && (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium mb-2">How to get your Exness API Key:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Log in to your Exness Personal Area</li>
                      <li>Go to Settings → API Keys</li>
                      <li>Create an API key with trading permissions</li>
                      <li>Copy and paste the key above</li>
                    </ol>
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addAccount.isPending}>
                    {addAccount.isPending ? "Connecting..." : "Connect Account"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Affiliate Signup Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Don't have a Deriv account?</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sign up now and get access to Volatility Indices, Boom/Crash, and more. Trade 24/7 with as low as $1!
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Welcome Bonus
                    </Badge>
                    <Badge variant="secondary" className="text-xs">24/7 Trading</Badge>
                    <Badge variant="secondary" className="text-xs">Low Minimums</Badge>
                  </div>
                  <a
                    href={AFFILIATE_LINKS.deriv}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="gold" className="mt-4 w-full sm:w-auto">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Create Deriv Account
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-success/30 bg-gradient-to-br from-success/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Gift className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Trade Forex with Exness</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ultra-tight spreads, instant withdrawals, and professional trading conditions. Perfect for scalping!
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Tight Spreads
                    </Badge>
                    <Badge variant="secondary" className="text-xs">Instant Withdrawals</Badge>
                    <Badge variant="secondary" className="text-xs">MT4/MT5</Badge>
                  </div>
                  <a
                    href={AFFILIATE_LINKS.exness}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="mt-4 w-full sm:w-auto bg-success hover:bg-success/90">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Create Exness Account
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Binance Card */}
          <Card className="glass-card border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Gift className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Trade Crypto on Binance</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    World's largest crypto exchange. Trade spot, futures, and earn with staking.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Low Fees
                    </Badge>
                    <Badge variant="secondary" className="text-xs">500+ Coins</Badge>
                    <Badge variant="secondary" className="text-xs">Futures</Badge>
                  </div>
                  <a
                    href={AFFILIATE_LINKS.binance}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="mt-4 w-full sm:w-auto bg-warning hover:bg-warning/90 text-warning-foreground">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Create Binance Account
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Community Links */}
        <Card className="glass-card mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">Join our trading community for signals and support:</p>
              <div className="flex gap-3">
                <a href={COMMUNITY_LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="border-green-500 text-green-500 hover:bg-green-500/10">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    WhatsApp Group
                  </Button>
                </a>
                <a href={COMMUNITY_LINKS.telegram} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-500/10">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Telegram Group
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{account.label}</CardTitle>
                        <CardDescription className="capitalize">{account.broker}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={account.is_active ? "default" : "secondary"}>
                      {account.is_active ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {account.login_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Login ID:</span>
                        <span className="font-mono">{account.login_id}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token:</span>
                      <span className="font-mono">••••••••{account.api_key_encrypted.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connected:</span>
                      <span>{new Date(account.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Test Connection
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(account.id, account.label)}
                      disabled={deleteAccount.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No accounts connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect your Deriv or Exness account to start automated trading
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Existing Account
                </Button>
                <a href={AFFILIATE_LINKS.deriv} target="_blank" rel="noopener noreferrer">
                  <Button variant="gold">
                    <Gift className="mr-2 h-4 w-4" />
                    Create Deriv Account
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Accounts;