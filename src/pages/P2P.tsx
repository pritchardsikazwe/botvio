import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeftRight, Users, Shield, Clock, 
  ArrowUp, ArrowDown, MessageSquare, Star,
  Wallet, TrendingUp, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface P2POffer {
  id: string;
  type: "buy" | "sell";
  trader: string;
  rating: number;
  trades: number;
  price: number;
  currency: string;
  minAmount: number;
  maxAmount: number;
  paymentMethods: string[];
  isOnline: boolean;
}

const mockOffers: P2POffer[] = [
  {
    id: "1",
    type: "buy",
    trader: "CryptoKing",
    rating: 4.9,
    trades: 256,
    price: 27.5,
    currency: "ZMW",
    minAmount: 100,
    maxAmount: 50000,
    paymentMethods: ["Mobile Money", "Bank Transfer"],
    isOnline: true,
  },
  {
    id: "2",
    type: "buy",
    trader: "FastTrader",
    rating: 4.7,
    trades: 189,
    price: 27.8,
    currency: "ZMW",
    minAmount: 50,
    maxAmount: 25000,
    paymentMethods: ["Mobile Money", "Airtel Money"],
    isOnline: true,
  },
  {
    id: "3",
    type: "sell",
    trader: "SafeExchange",
    rating: 4.8,
    trades: 412,
    price: 26.9,
    currency: "ZMW",
    minAmount: 200,
    maxAmount: 100000,
    paymentMethods: ["Bank Transfer", "FNB"],
    isOnline: false,
  },
];

const P2P = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("ZMW");

  const filteredOffers = mockOffers.filter(o => o.type === selectedTab);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access P2P Trading</h1>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ArrowLeftRight className="h-8 w-8 text-primary" />
            P2P Trading
          </h1>
          <p className="text-muted-foreground">
            Buy and sell Deriv account balance directly with other users. Fast, secure, and low fees.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-muted-foreground">Active Traders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-bold">$125K</p>
                  <p className="text-xs text-muted-foreground">24h Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">99.8%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">~5 min</p>
                  <p className="text-xs text-muted-foreground">Avg Trade Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Affiliate CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Need a Deriv Account?</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create your free Deriv account and start trading synthetic indices today!
                  </p>
                  <a
                    href="https://track.deriv.com/_h8e_odrKXNCTjSHedV4mENd7ZgqdRLk/1/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="gold" size="sm">
                      Create Deriv Account <ArrowRight className="ml-2 h-4 w-4" />
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
                  <Wallet className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Trade Forex? Try Exness</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ultra-tight spreads and instant withdrawals. Perfect for scalping!
                  </p>
                  <a
                    href="https://one.exnesstrack.org/a/up2tpvqknx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" className="bg-success hover:bg-success/90">
                      Create Exness Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <Card className="glass-card sticky top-4">
              <CardHeader>
                <CardTitle>Filter Offers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (USD)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZMW">ZMW (Zambian Kwacha)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="ZAR">ZAR (South African Rand)</SelectItem>
                      <SelectItem value="NGN">NGN (Nigerian Naira)</SelectItem>
                      <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="airtel_money">Airtel Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">Apply Filters</Button>
              </CardContent>
            </Card>
          </div>

          {/* Offers List */}
          <div className="lg:col-span-2">
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "buy" | "sell")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="buy" className="flex items-center gap-2">
                  <ArrowDown className="h-4 w-4" />
                  Buy USD
                </TabsTrigger>
                <TabsTrigger value="sell" className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4" />
                  Sell USD
                </TabsTrigger>
              </TabsList>

              <TabsContent value="buy" className="space-y-4">
                {filteredOffers.map((offer) => (
                  <Card key={offer.id} className="glass-card hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold">
                            {offer.trader.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{offer.trader}</span>
                              {offer.isOnline && (
                                <span className="w-2 h-2 rounded-full bg-success" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              <span>{offer.rating}</span>
                              <span>•</span>
                              <span>{offer.trades} trades</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {offer.paymentMethods.map((method) => (
                                <Badge key={method} variant="secondary" className="text-xs">
                                  {method}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-success">
                            {offer.price} {offer.currency}
                          </p>
                          <p className="text-xs text-muted-foreground">per USD</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Limit: {offer.minAmount} - {offer.maxAmount.toLocaleString()} {offer.currency}
                          </p>
                          <Button className="mt-3" size="sm">
                            Buy USD
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="sell" className="space-y-4">
                {filteredOffers.map((offer) => (
                  <Card key={offer.id} className="glass-card hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-success to-success/50 flex items-center justify-center text-white font-bold">
                            {offer.trader.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{offer.trader}</span>
                              {offer.isOnline && (
                                <span className="w-2 h-2 rounded-full bg-success" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              <span>{offer.rating}</span>
                              <span>•</span>
                              <span>{offer.trades} trades</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {offer.paymentMethods.map((method) => (
                                <Badge key={method} variant="secondary" className="text-xs">
                                  {method}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {offer.price} {offer.currency}
                          </p>
                          <p className="text-xs text-muted-foreground">per USD</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Limit: {offer.minAmount} - {offer.maxAmount.toLocaleString()} {offer.currency}
                          </p>
                          <Button variant="outline" className="mt-3" size="sm">
                            Sell USD
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            {/* Create Offer CTA */}
            <Card className="glass-card mt-6">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Want to post your own offer?</h3>
                <p className="text-muted-foreground mb-4">
                  Become a verified P2P trader and set your own rates
                </p>
                <Button>Create Offer</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <Card className="glass-card mt-8">
          <CardHeader>
            <CardTitle>How P2P Trading Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h4 className="font-medium mb-1">Find an Offer</h4>
                <p className="text-sm text-muted-foreground">
                  Browse buy/sell offers from verified traders
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h4 className="font-medium mb-1">Make Payment</h4>
                <p className="text-sm text-muted-foreground">
                  Send payment via your preferred method
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h4 className="font-medium mb-1">Confirm Receipt</h4>
                <p className="text-sm text-muted-foreground">
                  Seller confirms and releases funds
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-success">✓</span>
                </div>
                <h4 className="font-medium mb-1">Trade Complete</h4>
                <p className="text-sm text-muted-foreground">
                  Funds arrive in your Deriv account
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default P2P;
