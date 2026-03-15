import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  Bot, GraduationCap, ShoppingCart, Check, Crown, 
  Package, Star, Zap, Lock, Upload
} from "lucide-react";
import { toast } from "sonner";

const PRODUCT_TABS = [
  { value: "all", label: "All", icon: Package },
  { value: "course", label: "Courses", icon: GraduationCap },
  { value: "strategy", label: "Strategies", icon: Zap },
  { value: "bot", label: "Bots", icon: Bot },
];

// Sort priority: course first, then strategy, bot
const TYPE_ORDER: Record<string, number> = {
  course: 0,
  strategy: 1,
  bot: 2,
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  course: {
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/40",
    gradient: "from-blue-500/20 to-indigo-500/10",
  },
  strategy: {
    bg: "bg-violet-500/15",
    text: "text-violet-400",
    border: "border-violet-500/40",
    gradient: "from-violet-500/20 to-purple-500/10",
  },
  bot: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/40",
    gradient: "from-amber-500/20 to-orange-500/10",
  },
};

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

  // Sort products by type priority then featured, exclude signal_packs
  const sortedProducts = products
    ? [...products]
        .filter((p) => p.type !== "signal_pack")
        .sort((a, b) => {
          const aOrder = TYPE_ORDER[a.type] ?? 99;
          const bOrder = TYPE_ORDER[b.type] ?? 99;
          if (aOrder !== bOrder) return aOrder - bOrder;
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
          return 0;
        })
    : [];

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
      purchaseMutation.mutate({ product, paymentMethod: "free" });
      return;
    }
    setSelectedProduct(product);
    setShowCheckout(true);
  };

  const handleCheckout = async () => {
    if (!selectedProduct || !paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!proofFile) {
      toast.error("Please attach your payment proof screenshot");
      return;
    }

    // Upload proof
    let proofUrl: string | undefined;
    if (user && proofFile) {
      const ext = proofFile.name.split(".").pop();
      const path = `proofs/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("charts")
        .upload(path, proofFile);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("charts").getPublicUrl(path);
        proofUrl = urlData.publicUrl;
      }
    }

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
      proofUrl,
      affiliateCode,
    });
    setShowCheckout(false);
    setSelectedProduct(null);
    setPaymentMethod("");
    setProofFile(null);
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case "bot": return <Bot className="h-6 w-6" />;
      case "course": return <GraduationCap className="h-6 w-6" />;
      case "strategy": return <Zap className="h-6 w-6" />;
      default: return <Package className="h-6 w-6" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "bot": return "Trading Bot";
      case "course": return "Course";
      case "strategy": return "Strategy";
      default: return type;
    }
  };

  const colors = (type: string) => TYPE_COLORS[type] || TYPE_COLORS.bot;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Marketplace — Trading Bots, Courses & Strategies" description="Browse and purchase premium trading bots, strategy templates, and forex mentorship courses. Find tools for gold scalping, Deriv automation, Exness copy trading, and crypto strategies." />
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-warning/10 p-8 md:p-12 mb-8">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-warning/5 blur-3xl" />
          <div className="relative z-10 text-center">
            <Badge variant="outline" className="mb-4 border-primary/40 text-primary bg-primary/10 px-4 py-1">
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              Botvio Marketplace
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Trading Tools & Education
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Subscribe to signals, access premium courses, and supercharge your trading with bots & strategies.
            </p>
          </div>
        </div>

        {/* Product Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto h-12 bg-muted/50 border border-border/50 rounded-xl p-1">
            {PRODUCT_TABS.map((tab) => {
              const Icon = tab.icon;
              const c = colors(tab.value);
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((product) => {
              const owned = isOwned(product.id);
              const c = colors(product.type);
              return (
                <Card
                  key={product.id}
                  className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border ${c.border} bg-gradient-to-br ${c.gradient} ${
                    product.is_featured ? "ring-2 ring-warning/40 shadow-warning/10 shadow-lg" : ""
                  }`}
                >
                  {product.is_featured && (
                    <div className="bg-gradient-to-r from-warning to-amber-500 text-white text-xs px-3 py-1.5 text-center font-semibold tracking-wide">
                      ⭐ Featured Product
                    </div>
                  )}
                  {product.type === "course" && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-3 py-1.5 text-center font-medium flex items-center justify-center gap-1">
                      🎓 Coming Soon — Lessons Being Prepared
                    </div>
                  )}

                  {product.cover_image_url && (
                    <div className="h-44 bg-muted overflow-hidden">
                      <img
                        src={product.cover_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center ${c.text} ring-1 ring-white/10`}>
                          {getProductIcon(product.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                          <Badge variant="outline" className={`text-xs capitalize mt-1.5 ${c.border} ${c.text} bg-transparent`}>
                            {getTypeLabel(product.type)}
                          </Badge>
                        </div>
                      </div>
                      {owned && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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
                        <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                          {product.price_usd === 0 ? "Free" : `$${product.price_usd}`}
                        </span>
                        {product.billing_type === "recurring" && product.price_usd > 0 && (
                          <span className="text-sm text-muted-foreground ml-0.5">
                            /{product.billing_interval || "month"}
                          </span>
                        )}
                      </div>
                      {product.billing_type === "one_time" && product.price_usd > 0 && (
                        <Badge variant="secondary" className="text-xs">One-time</Badge>
                      )}
                    </div>

                    {owned ? (
                      <Button className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" variant="outline">
                        <Check className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    ) : (
                      <Button
                        className={`w-full font-semibold transition-all ${
                          product.price_usd === 0
                            ? "border-primary/30 hover:bg-primary/10"
                            : product.type === "signal_pack"
                              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                              : ""
                        }`}
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
          <Card className="glass-card border-dashed">
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
        <Card className="mt-8 border-primary/30 bg-gradient-to-r from-primary/5 via-background to-warning/5 overflow-hidden">
          <CardContent className="py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-warning/20 ring-1 ring-primary/20">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Earn Commissions</h3>
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

          <PaymentMethodSelector
            planCode={selectedProduct?.slug || "product"}
            planName={selectedProduct?.name || "Product"}
            amount={selectedProduct?.price_usd || 0}
            embedded
            onPaymentInitiated={(method) => setPaymentMethod(method)}
            onMethodChange={(method) => setPaymentMethod(method)}
            onProofFileChange={(file) => setProofFile(file)}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={!paymentMethod || !proofFile || purchaseMutation.isPending}>
              {purchaseMutation.isPending ? "Processing..." : "Complete Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;
