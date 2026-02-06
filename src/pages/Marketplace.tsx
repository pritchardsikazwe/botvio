import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/seo/SEOHead";
import { useMarketplaceProducts, usePurchaseProduct, MarketplaceProduct } from "@/hooks/useMarketplace";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentMethodSelector } from "@/components/billing/PaymentMethodSelector";
import { 
  Bot, Signal, GraduationCap, ShoppingCart, Check, Crown, 
  Package, Star, Zap, Lock, Upload
} from "lucide-react";
import { toast } from "sonner";

const PRODUCT_TABS = [
  { value: "all", label: "All", icon: Package },
  { value: "bot", label: "Bots", icon: Bot },
  { value: "signal_pack", label: "Signals", icon: Signal },
  { value: "course", label: "Courses", icon: GraduationCap },
  { value: "strategy", label: "Strategies", icon: Zap },
];

const Marketplace = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const { data: products, isLoading } = useMarketplaceProducts(activeTab === "all" ? undefined : activeTab);
  const { data: entitlements } = useEntitlements();
  const purchaseMutation = usePurchaseProduct();

  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const isOwned = (productId: string) =>
    entitlements?.some((e) => e.product_id === productId && e.status === "active") ?? false;

  const handleBuy = (product: MarketplaceProduct) => {
    if (!user) {
      toast.error("Please sign in to purchase");
      return;
    }
    if (isOwned(product.id)) {
      toast.info("You already own this product");
      return;
    }
    if (product.price_usd === 0) {
      // Free product — claim immediately
      purchaseMutation.mutate({ product, paymentMethod: "free" });
      return;
    }
    setSelectedProduct(product);
    setShowCheckout(true);
  };

  const handleCheckout = () => {
    if (!selectedProduct || !paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    // Get stored referral code
    const storedRef = localStorage.getItem("botvio_referral");
    let affiliateCode: string | undefined;
    if (storedRef) {
      try {
        const parsed = JSON.parse(storedRef);
        if (parsed.expiresAt > Date.now()) {
          affiliateCode = parsed.code;
        }
      } catch {}
    }

    purchaseMutation.mutate({
      product: selectedProduct,
      paymentMethod,
      affiliateCode,
    });
    setShowCheckout(false);
    setSelectedProduct(null);
    setPaymentMethod("");
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case "bot": return <Bot className="h-6 w-6" />;
      case "signal_pack": return <Signal className="h-6 w-6" />;
      case "course": return <GraduationCap className="h-6 w-6" />;
      case "strategy": return <Zap className="h-6 w-6" />;
      default: return <Package className="h-6 w-6" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "bot": return "Trading Bot";
      case "signal_pack": return "Signal Pack";
      case "course": return "Course";
      case "strategy": return "Strategy";
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Marketplace" description="Browse trading bots, signal packs, strategies, and courses" />
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Hero */}
        <div className="glass-card p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-warning/10" />
          <div className="relative z-10 text-center">
            <Badge variant="outline" className="mb-4 border-primary text-primary">
              <ShoppingCart className="w-3 h-3 mr-1" />
              Botvio Marketplace
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Trading Tools & Education
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Buy bots, subscribe to signals, and access premium courses. 
              Everything you need to trade smarter.
            </p>
          </div>
        </div>

        {/* Product Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-5 w-full max-w-xl mx-auto">
            {PRODUCT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const owned = isOwned(product.id);
              return (
                <Card
                  key={product.id}
                  className={`glass-card overflow-hidden transition-all hover:border-primary/50 ${
                    product.is_featured ? "ring-2 ring-warning/30" : ""
                  }`}
                >
                  {product.is_featured && (
                    <div className="bg-gradient-to-r from-warning to-amber-500 text-white text-xs px-3 py-1 text-center font-medium">
                      ⭐ Featured
                    </div>
                  )}
                  {product.type === "course" && (
                    <div className="bg-gradient-to-r from-primary to-blue-500 text-white text-xs px-3 py-1 text-center font-medium flex items-center justify-center gap-1">
                      🎓 Coming Soon — Lessons Being Prepared
                    </div>
                  )}

                  {product.cover_image_url && (
                    <div className="h-40 bg-muted overflow-hidden">
                      <img
                        src={product.cover_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {getProductIcon(product.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <Badge variant="outline" className="text-xs capitalize mt-1">
                            {getTypeLabel(product.type)}
                          </Badge>
                        </div>
                      </div>
                      {owned && (
                        <Badge className="bg-success text-success-foreground">
                          <Check className="h-3 w-3 mr-1" />
                          Owned
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {product.short_description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {product.short_description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold">
                          {product.price_usd === 0 ? "Free" : `$${product.price_usd}`}
                        </span>
                        {product.billing_type === "recurring" && product.price_usd > 0 && (
                          <span className="text-sm text-muted-foreground">
                            /{product.billing_interval || "month"}
                          </span>
                        )}
                      </div>
                      {product.billing_type === "one_time" && product.price_usd > 0 && (
                        <Badge variant="secondary">One-time</Badge>
                      )}
                    </div>

                    {owned ? (
                      <Button className="w-full" variant="outline">
                        <Check className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={product.price_usd === 0 ? "outline" : "default"}
                        onClick={() => handleBuy(product)}
                        disabled={purchaseMutation.isPending}
                      >
                        {product.price_usd === 0 ? (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Get Free
                          </>
                        ) : product.billing_type === "recurring" ? (
                          <>
                            <Crown className="h-4 w-4 mr-2" />
                            Subscribe
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Buy Now
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
              <p className="text-muted-foreground">
                Products will appear here once they're added by the admin.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Affiliate CTA */}
        <Card className="glass-card mt-8 border-primary/30">
          <CardContent className="py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Earn Commissions</h3>
                  <p className="text-sm text-muted-foreground">
                    Refer products and earn up to 20% on every sale
                  </p>
                </div>
              </div>
              <Button variant="gold" asChild>
                <a href="/affiliate">Join Affiliate Program</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              {selectedProduct && (
                <span>
                  Purchase <strong>{selectedProduct.name}</strong> for{" "}
                  <strong>${selectedProduct.price_usd}</strong>
                  {selectedProduct.billing_type === "recurring"
                    ? `/${selectedProduct.billing_interval || "month"}`
                    : " (one-time)"}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <PaymentMethodSelector
              planCode={selectedProduct?.slug || "product"}
              planName={selectedProduct?.name || "Product"}
              amount={selectedProduct?.price_usd || 0}
              onPaymentInitiated={(method, details) => {
                setPaymentMethod(method);
              }}
            />

            <div className="space-y-2">
              <Label>Payment Proof (optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={!paymentMethod || purchaseMutation.isPending}>
              {purchaseMutation.isPending ? "Processing..." : "Complete Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;
