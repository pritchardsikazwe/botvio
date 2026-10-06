import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { useMarketplaceProducts, useMarketplaceTestMode, usePurchaseProduct, useSubmitPaymentRequest, MarketplaceProduct } from "@/hooks/useMarketplace";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Header } from "@/components/trading/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentMethodSelector } from "@/components/billing/PaymentMethodSelector";
import { Activity, ArrowRight, Check, Crown, ExternalLink, Lock, Radio, Rocket, ShoppingCart, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

const PRODUCT_ORDER = ["mt5-direct", "gold-robot", "synthetic-robot", "synthetic-hub", "weltrade-hub"];

const PRODUCT_CONFIG: Record<string, { category: string; tagline: string; description: string; features: string[]; icon: typeof Crown; accent: string; route?: string }> = {
  "mt5-direct": { category: "MT5 EXECUTION", tagline: "Send Botvio signals directly to your own MT5.", description: "Connect an MT5 account, subscribe, and receive Botvio signals directly on that account. LIVE execution stays behind a confirmation gate.", features: ["Use your own MT5 account", "DEMO or LIVE with safety controls", "Direct Botvio signal delivery"], icon: Activity, accent: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  "gold-robot": { category: "AUTOMATION", tagline: "Automated Gold trading with Botvio.", description: "A Botvio trading robot built for Gold workflows and MT5 execution.", features: ["MT5 automation", "Botvio Gold strategy", "Risk controls before LIVE"], icon: Crown, accent: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  "synthetic-robot": { category: "AUTOMATION", tagline: "Automated Synthetic Index trading.", description: "Botvio automation for supported synthetic-index workflows and MT5 execution.", features: ["Synthetic Index automation", "MT5 execution workflow", "Risk controls before LIVE"], icon: Rocket, accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  "synthetic-hub": { category: "MARKET HUB", tagline: "Live Synthetic Index signals, charts and analysis.", description: "Access the Botvio Synthetic Hub for verified Deriv synthetic markets, live charts, signals and trading intelligence.", features: ["Boom, Crash, Volatility & Step", "Live charts and signals", "Send signals to MT5"], icon: Zap, accent: "text-violet-400 border-violet-500/30 bg-violet-500/10", route: "/synthetic-hub" },
  "weltrade-hub": { category: "MARKET HUB", tagline: "Weltrade SyntX charts, signals and analysis.", description: "Access the Botvio Weltrade Hub for SyntX market intelligence, charts, signals and MT5 workflows.", features: ["SyntX market coverage", "Charts and signals", "MT5 workflow support"], icon: Activity, accent: "text-orange-400 border-orange-500/30 bg-orange-500/10", route: "/weltrade" },
};

const Marketplace = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: products, isLoading } = useMarketplaceProducts();
  const { data: entitlements } = useEntitlements();
  const purchaseMutation = usePurchaseProduct();
  const paymentRequestMutation = useSubmitPaymentRequest();
  const { data: marketplaceTestMode, isLoading: testModeLoading } = useMarketplaceTestMode();
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const accountId = searchParams.get("account_id") || undefined;

  const visibleProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => PRODUCT_ORDER.includes(p.slug)).sort((a, b) => PRODUCT_ORDER.indexOf(a.slug) - PRODUCT_ORDER.indexOf(b.slug));
  }, [products]);

  const isOwned = (productId: string) => entitlements?.some((e) => e.product_id === productId && e.status === "active" && (!e.ends_at || new Date(e.ends_at).getTime() > Date.now())) ?? false;

  useEffect(() => {
    const slug = searchParams.get("product");
    if (!slug) return;
    const target = visibleProducts.find((p) => p.slug === slug);
    if (target) {
      setSelectedProduct(target);
      if (target.price_usd > 0 && user) setShowCheckout(true);
    }
  }, [searchParams, visibleProducts, user]);

  const handleBuy = (product: MarketplaceProduct) => {
    if (!user) { toast.error("Please sign in to continue"); return; }
    if (isOwned(product.id)) { toast.info("This access is already active"); return; }
    purchaseMutation.mutate({ product, affiliateCode: (() => { try { const r = JSON.parse(localStorage.getItem("botvio_referral") || "null"); return r?.expiresAt > Date.now() ? r.code : undefined; } catch { return undefined; } })() });
  };

  const handleOpen = (product: MarketplaceProduct) => {
    const route = PRODUCT_CONFIG[product.slug]?.route;
    if (route) window.location.href = route;
    else toast.info("Your access is active. Open your MT5 or Robot controls from your dashboard.");
  };

  const handleCheckout = async () => {
    if (!selectedProduct || !paymentMethod || !user) { toast.error("Select a payment method"); return; }
    if (!proofFile) { toast.error("Attach your payment proof screenshot"); return; }
    const ext = proofFile.name.split(".").pop() || "png";
    const path = "proofs/" + user.id + "/" + Date.now() + "." + ext;
    const { error: uploadErr } = await supabase.storage.from("charts").upload(path, proofFile);
    if (uploadErr) { toast.error("Payment proof upload failed"); return; }
    const { data: urlData } = supabase.storage.from("charts").getPublicUrl(path);
    const storedRef = localStorage.getItem("botvio_referral");
    let affiliateCode: string | undefined;
    if (storedRef) { try { const parsed = JSON.parse(storedRef); if (parsed.expiresAt > Date.now()) affiliateCode = parsed.code; } catch {} }
    paymentRequestMutation.mutate({ product: selectedProduct, paymentMethod, proofUrl: urlData.publicUrl, affiliateCode, accountId });
    setShowCheckout(false); setSelectedProduct(null); setPaymentMethod(""); setProofFile(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead seoKey="marketplace" title="Botvio Store — MT5 Signals, Trading Robots & Market Hubs" description="Choose Botvio MT5 direct signals, trading robots, Synthetic Hub or Weltrade Hub. Subscribe only to the tools you need." />
      <Header />
      <main className="container mx-auto px-4 py-6 md:py-8 space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-warning/5 p-7 md:p-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-warning/10 blur-3xl" />
          <div className="relative z-10 max-w-3xl">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10 border border-primary/20"><ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> BOTVIO STORE</Badge>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Choose what you want to unlock.</h1>
            <p className="mt-4 max-w-2xl text-base md:text-lg text-muted-foreground leading-7">Botvio is built around market hubs, automated robots and direct MT5 execution. Subscribe only to the tools you need — no confusing provider or TradeCopy setup required.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-success/30 text-success"><Check className="mr-1 h-3 w-3" /> Simple subscriptions</Badge>
              <Badge variant="outline" className="border-primary/30 text-primary"><Check className="mr-1 h-3 w-3" /> Your MT5 account</Badge>
              <Badge variant="outline" className="border-warning/30 text-warning"><Check className="mr-1 h-3 w-3" /> LIVE safety controls</Badge>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? [1,2,3,4,5].map((i) => <div key={i} className="h-[390px] rounded-2xl border border-border/50 bg-card/60 animate-pulse" />) : visibleProducts.map((product) => {
            const cfg = PRODUCT_CONFIG[product.slug];
            if (!cfg) return null;
            const Icon = cfg.icon;
            const owned = isOwned(product.id);
            return <Card key={product.id} className="group relative overflow-hidden border-border/60 bg-card/80 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl">
              {product.is_featured && <div className="bg-primary/10 border-b border-primary/10 px-4 py-2 text-center text-[10px] font-black tracking-widest text-primary">RECOMMENDED</div>}
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className={"flex h-12 w-12 items-center justify-center rounded-2xl border " + cfg.accent}><Icon className="h-6 w-6" /></div>
                  {owned ? <Badge className="border border-success/30 bg-success/10 text-success"><Check className="mr-1 h-3 w-3" /> Active</Badge> : <Badge variant="outline" className="text-[10px] tracking-wider">{cfg.category}</Badge>}
                </div>
                <h2 className="mt-5 text-xl font-black">{product.name}</h2>
                <p className="mt-2 text-sm font-semibold text-foreground/90">{cfg.tagline}</p>
                <p className="mt-2 min-h-[72px] text-sm leading-6 text-muted-foreground">{product.short_description || cfg.description}</p>
                <div className="my-5 space-y-2.5">{cfg.features.map((feature) => <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 shrink-0 text-success" /> {feature}</div>)}</div>
                <div className="flex items-end justify-between border-t border-border/50 pt-4">
                  <div>
                    <span className="text-2xl font-black text-success">{owned ? "ACTIVE" : marketplaceTestMode ? "FREE TEST ACCESS" : `${product.price_usd}/month`}</span>
                    {!owned && marketplaceTestMode && <span className="ml-2 text-xs text-muted-foreground line-through">${product.price_usd}/month</span>}
                  </div>
                  {marketplaceTestMode && <Badge variant="outline" className="text-[10px] border-success/30 text-success">TEST MODE</Badge>}
                </div>
                <Button className="mt-5 w-full font-bold" variant={owned ? "outline" : "default"} onClick={() => owned ? handleOpen(product) : marketplaceTestMode ? handleBuy(product) : (setSelectedProduct(product), setShowCheckout(true))} disabled={purchaseMutation.isPending || paymentRequestMutation.isPending || testModeLoading}>{owned ? <><ExternalLink className="mr-2 h-4 w-4" /> Open</> : <><Zap className="mr-2 h-4 w-4" /> {marketplaceTestMode ? "Activate Free Access" : "Subscribe"}</>}</Button>
                {product.slug === "mt5-direct" && <p className="mt-3 text-center text-[10px] text-muted-foreground">Connect your MT5 account first, then activate Direct Signals.</p>}
              </CardContent>
            </Card>;
          })}
        </section>

        {!isLoading && visibleProducts.length === 0 && <Card className="border-dashed"><CardContent className="py-14 text-center"><Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h2 className="font-bold">Botvio products are being configured</h2><p className="mt-1 text-sm text-muted-foreground">Please check back shortly.</p></CardContent></Card>}

        {marketplaceTestMode && <section className="rounded-2xl border border-success/20 bg-success/5 p-4 text-center">
          <p className="text-sm font-bold text-success">BOTVIO TEST ACCESS IS OPEN</p>
          <p className="mt-1 text-xs text-muted-foreground">All active products can be activated free while we test the platform. No payment proof is required in this test mode.</p>
        </section>}

        <section className="grid gap-4 md:grid-cols-3">{[
          { icon: Radio, title: "1. Choose", text: "Pick a hub, robot or direct MT5 execution service." },
          { icon: ShoppingCart, title: "2. Subscribe", text: "Submit payment and proof. Admin approval activates your access." },
          { icon: Sparkles, title: "3. Trade", text: "Open your hub, connect MT5 or use your activated robot." },
        ].map(({ icon: Icon, title, text: body }) => <Card key={title} className="border-border/50 bg-card/50"><CardContent className="p-5"><Icon className="h-5 w-5 text-primary" /><h3 className="mt-3 font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p></CardContent></Card>)}</section>

        <Card className="border-warning/20 bg-warning/5"><CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div><h3 className="font-bold">Need help choosing?</h3><p className="mt-1 text-xs text-muted-foreground">Start with a Hub if you want signals and analysis. Choose MT5 Direct if you want Botvio signals delivered to your own connected MT5. Choose a Robot for automation.</p></div><Button asChild variant="outline"><Link to="/dashboard">Open Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent></Card>
      </main>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedProduct?.name} subscription</DialogTitle><DialogDescription>{selectedProduct && <>Activate <strong>{selectedProduct.name}</strong> for <strong>${selectedProduct.price_usd}/{selectedProduct.billing_interval || "month"}</strong>. Payment is reviewed by Botvio before access is activated.</>}</DialogDescription></DialogHeader>
          <PaymentMethodSelector planCode={selectedProduct?.slug || "product"} planName={selectedProduct?.name || "Product"} amount={selectedProduct?.price_usd || 0} embedded onPaymentInitiated={setPaymentMethod} onMethodChange={setPaymentMethod} onProofFileChange={setProofFile} />
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground">After submitting your proof, an admin confirms the payment and activates your subscription. For MT5 Direct, the selected connected account is linked to the entitlement.</div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCheckout(false)}>Cancel</Button><Button onClick={handleCheckout} disabled={!paymentMethod || !proofFile || paymentRequestMutation.isPending}>{paymentRequestMutation.isPending ? "Submitting..." : "Submit Subscription"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;