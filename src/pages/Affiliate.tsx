import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useAffiliateProfile, 
  useCreateAffiliateProfile, 
  useAffiliateLinks,
  useReferralClicks,
  useReferrals,
  useAffiliateEarnings,
  useEarningsSummary,
  usePayoutMethods,
  usePayoutRequests,
  useAddPayoutMethod,
  useRequestPayout,
  useCreateAffiliateLink
} from "@/hooks/useAffiliate";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Share2, Copy, Users, MousePointerClick, DollarSign, 
  TrendingUp, Wallet, Plus, ExternalLink, CheckCircle,
  Gift, ArrowRight, MessageCircle, Send, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Partner affiliate links
const PARTNER_LINKS = {
  deriv: "https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827",
  exness: "https://one.exness-track.com/a/ts1kvs1k",
  binance: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU",
};

const COMMUNITY_LINKS = {
  whatsapp: "https://chat.whatsapp.com/KInahrKam85BTyFbIgC3zJ",
  telegram: "https://t.me/+AZjYpDncHEA5OTM0",
};

const Affiliate = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useAffiliateProfile();
  const createProfile = useCreateAffiliateProfile();
  const { data: links } = useAffiliateLinks();
  const { data: clicks } = useReferralClicks();
  const { data: referrals } = useReferrals();
  const { data: earnings } = useAffiliateEarnings();
  const summary = useEarningsSummary();
  const { data: payoutMethods } = usePayoutMethods();
  const { data: payoutRequests } = usePayoutRequests();
  const addPayoutMethod = useAddPayoutMethod();
  const requestPayout = useRequestPayout();
  const createLink = useCreateAffiliateLink();

  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [methodForm, setMethodForm] = useState({
    type: "crypto" as "crypto" | "mobile_money",
    crypto_network: "",
    crypto_address: "",
    mobile_network: "",
    mobile_number: "",
  });

  const baseUrl = window.location.origin;
  const affiliateLink = profile ? `${baseUrl}/r/${profile.affiliate_code}` : "";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("common.copied"));
  };

  const shareOnPlatform = (platform: string) => {
    const text = "Join Botvio and start automated trading! 🤖📈";
    const url = affiliateLink;
    
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    };

    window.open(urls[platform], "_blank");
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < 2) {
      toast.error(t("affiliate.minPayout"));
      return;
    }
    if (!selectedMethod) {
      toast.error("Please select a payout method");
      return;
    }

    await requestPayout.mutateAsync({ amount_usd: amount, method_id: selectedMethod });
    setShowPayoutDialog(false);
    setPayoutAmount("");
  };

  const handleAddMethod = async () => {
    if (methodForm.type === "crypto" && (!methodForm.crypto_network || !methodForm.crypto_address)) {
      toast.error("Please fill in network and address");
      return;
    }
    if (methodForm.type === "mobile_money" && (!methodForm.mobile_network || !methodForm.mobile_number)) {
      toast.error("Please fill in network and phone number");
      return;
    }

    await addPayoutMethod.mutateAsync(methodForm);
    setShowMethodDialog(false);
    setMethodForm({ type: "crypto", crypto_network: "", crypto_address: "", mobile_network: "", mobile_number: "" });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">{t("auth.signIn")} to access the affiliate program</h1>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  // Not yet an affiliate - show join page
  if (!profileLoading && !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Gift className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4">{t("affiliate.title")}</h1>
              <p className="text-xl text-muted-foreground">{t("affiliate.subtitle")}</p>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="glass-card text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Share2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{t("affiliate.step1Title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("affiliate.step1Desc")}</p>
                </CardContent>
              </Card>
              <Card className="glass-card text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{t("affiliate.step2Title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("affiliate.step2Desc")}</p>
                </CardContent>
              </Card>
              <Card className="glass-card text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-6 w-6 text-success" />
                  </div>
                  <h3 className="font-semibold mb-2">{t("affiliate.step3Title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("affiliate.step3Desc")}</p>
                </CardContent>
              </Card>
            </div>

            {/* Commission rates */}
            <Card className="glass-card mb-8">
              <CardHeader>
                <CardTitle>{t("affiliate.commissionRate")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-success">$2</p>
                    <p className="text-sm text-muted-foreground">Per signup bonus</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-success">20%</p>
                    <p className="text-sm text-muted-foreground">On all purchases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button size="lg" variant="gold" onClick={() => createProfile.mutate()} disabled={createProfile.isPending}>
                {createProfile.isPending ? "Joining..." : t("affiliate.joinProgram")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("affiliate.dashboard")}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t("affiliate.yourCode")}: {profile?.affiliate_code}</Badge>
              {profile?.status === "active" && <Badge className="bg-success">Active</Badge>}
            </div>
          </div>
        </div>

        {/* Share Link Card */}
        <Card className="glass-card mb-8">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <Label className="text-sm text-muted-foreground mb-2 block">Your Affiliate Link</Label>
                <div className="flex gap-2">
                  <Input value={affiliateLink} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={() => copyToClipboard(affiliateLink)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => shareOnPlatform("whatsapp")} title="WhatsApp">
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => shareOnPlatform("telegram")} title="Telegram">
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => shareOnPlatform("twitter")} title="X/Twitter">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <MousePointerClick className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{clicks?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">{t("affiliate.clicks")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{referrals?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">{t("affiliate.signups")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-bold text-success">${summary.total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{t("affiliate.totalEarnings")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">${summary.available.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{t("affiliate.availableToWithdraw")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Partner Brokers Section */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Partner Brokers
            </CardTitle>
            <CardDescription>
              Sign up through our partner links and earn bonuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href={PARTNER_LINKS.deriv} target="_blank" rel="noopener noreferrer">
                <Card className="glass-card hover:border-primary/50 transition-all cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <p className="font-bold text-lg">Deriv</p>
                    <p className="text-xs text-muted-foreground mb-2">Synthetic Indices, Forex</p>
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Sign Up
                    </Button>
                  </CardContent>
                </Card>
              </a>
              <a href={PARTNER_LINKS.exness} target="_blank" rel="noopener noreferrer">
                <Card className="glass-card hover:border-primary/50 transition-all cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <p className="font-bold text-lg">Exness</p>
                    <p className="text-xs text-muted-foreground mb-2">Forex, Gold, Crypto</p>
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Sign Up
                    </Button>
                  </CardContent>
                </Card>
              </a>
              <a href={PARTNER_LINKS.binance} target="_blank" rel="noopener noreferrer">
                <Card className="glass-card hover:border-primary/50 transition-all cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <p className="font-bold text-lg">Binance</p>
                    <p className="text-xs text-muted-foreground mb-2">Crypto Spot & Futures</p>
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Sign Up
                    </Button>
                  </CardContent>
                </Card>
              </a>
            </div>
            
            {/* Community Links */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Join our community:</p>
              <div className="flex gap-3">
                <a href={COMMUNITY_LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </a>
                <a href={COMMUNITY_LINKS.telegram} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Telegram
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="earnings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="earnings">{t("affiliate.earnings")}</TabsTrigger>
            <TabsTrigger value="referrals">{t("affiliate.referredUsers")}</TabsTrigger>
            <TabsTrigger value="payouts">{t("payout.title")}</TabsTrigger>
          </TabsList>

          <TabsContent value="earnings">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("affiliate.earningsHistory")}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">Pending: ${summary.pending.toFixed(2)}</Badge>
                    <Badge variant="secondary">Approved: ${summary.approved.toFixed(2)}</Badge>
                    <Badge className="bg-success">Paid: ${summary.paid.toFixed(2)}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No earnings yet. Start sharing your link!
                        </TableCell>
                      </TableRow>
                    )}
                    {earnings?.map((earning: any) => (
                      <TableRow key={earning.id}>
                        <TableCell>{new Date(earning.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{earning.earning_type}</TableCell>
                        <TableCell className="text-success">${Number(earning.amount_usd).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            earning.status === "paid" ? "default" :
                            earning.status === "approved" ? "secondary" :
                            earning.status === "rejected" ? "destructive" : "outline"
                          }>
                            {earning.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{t("affiliate.referredUsers")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No referrals yet
                        </TableCell>
                      </TableRow>
                    )}
                    {referrals?.map((ref: any) => (
                      <TableRow key={ref.id}>
                        <TableCell>{new Date(ref.attributed_at).toLocaleDateString()}</TableCell>
                        <TableCell>{ref.affiliate_code}</TableCell>
                        <TableCell>
                          <Badge variant={ref.status === "approved" ? "default" : "outline"}>
                            {ref.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payout Methods */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t("affiliate.payoutMethods")}</CardTitle>
                    <Dialog open={showMethodDialog} onOpenChange={setShowMethodDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          {t("affiliate.addPayoutMethod")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t("affiliate.addPayoutMethod")}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={methodForm.type}
                              onValueChange={(v) => setMethodForm({ ...methodForm, type: v as any })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="crypto">{t("affiliate.crypto")}</SelectItem>
                                <SelectItem value="mobile_money">{t("affiliate.mobileMoney")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {methodForm.type === "crypto" && (
                            <>
                              <div className="space-y-2">
                                <Label>{t("affiliate.cryptoNetwork")}</Label>
                                <Select
                                  value={methodForm.crypto_network}
                                  onValueChange={(v) => setMethodForm({ ...methodForm, crypto_network: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("affiliate.selectNetwork")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="TRC20">USDT (TRC20)</SelectItem>
                                    <SelectItem value="ERC20">USDT (ERC20)</SelectItem>
                                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>{t("affiliate.cryptoAddress")}</Label>
                                <Input
                                  placeholder="Wallet address"
                                  value={methodForm.crypto_address}
                                  onChange={(e) => setMethodForm({ ...methodForm, crypto_address: e.target.value })}
                                />
                              </div>
                            </>
                          )}

                          {methodForm.type === "mobile_money" && (
                            <>
                              <div className="space-y-2">
                                <Label>{t("affiliate.mobileNetwork")}</Label>
                                <Select
                                  value={methodForm.mobile_network}
                                  onValueChange={(v) => setMethodForm({ ...methodForm, mobile_network: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("affiliate.selectNetwork")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                                    <SelectItem value="Airtel">Airtel Money</SelectItem>
                                    <SelectItem value="Zamtel">Zamtel Money</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>{t("affiliate.mobileNumber")}</Label>
                                <Input
                                  placeholder="+260..."
                                  value={methodForm.mobile_number}
                                  onChange={(e) => setMethodForm({ ...methodForm, mobile_number: e.target.value })}
                                />
                              </div>
                            </>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowMethodDialog(false)}>
                            {t("common.cancel")}
                          </Button>
                          <Button onClick={handleAddMethod} disabled={addPayoutMethod.isPending}>
                            {addPayoutMethod.isPending ? "Adding..." : t("common.save")}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {payoutMethods?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No payout methods added yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {payoutMethods?.map((method: any) => (
                        <div key={method.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Wallet className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium capitalize">{method.type.replace("_", " ")}</p>
                              <p className="text-sm text-muted-foreground">
                                {method.type === "crypto" 
                                  ? `${method.crypto_network}: ${method.crypto_address?.slice(0, 10)}...`
                                  : `${method.mobile_network}: ${method.mobile_number}`
                                }
                              </p>
                            </div>
                          </div>
                          {method.is_default && <Badge>Default</Badge>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Request Payout */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>{t("affiliate.requestPayout")}</CardTitle>
                  <CardDescription>{t("affiliate.minPayout")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-3xl font-bold text-success">${summary.available.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{t("affiliate.availableToWithdraw")}</p>
                    </div>

                    <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full" disabled={summary.available < 2 || !payoutMethods?.length}>
                          {t("affiliate.requestPayout")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t("affiliate.requestPayout")}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>{t("payout.amount")}</Label>
                            <Input
                              type="number"
                              min="2"
                              max={summary.available}
                              value={payoutAmount}
                              onChange={(e) => setPayoutAmount(e.target.value)}
                              placeholder="Enter amount"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("payout.method")}</Label>
                            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                {payoutMethods?.map((method: any) => (
                                  <SelectItem key={method.id} value={method.id}>
                                    {method.type === "crypto" 
                                      ? `${method.crypto_network}: ${method.crypto_address?.slice(0, 10)}...`
                                      : `${method.mobile_network}: ${method.mobile_number}`
                                    }
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                            {t("common.cancel")}
                          </Button>
                          <Button onClick={handleRequestPayout} disabled={requestPayout.isPending}>
                            {requestPayout.isPending ? "Requesting..." : t("common.submit")}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Payout History */}
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">{t("payout.history")}</h4>
                      {payoutRequests?.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">No payout requests yet</p>
                      ) : (
                        <div className="space-y-2">
                          {payoutRequests?.slice(0, 5).map((req: any) => (
                            <div key={req.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                              <div>
                                <p className="font-medium">${Number(req.amount_usd).toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(req.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant={
                                req.status === "paid" ? "default" :
                                req.status === "processing" ? "secondary" :
                                req.status === "rejected" ? "destructive" : "outline"
                              }>
                                {req.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Affiliate;
