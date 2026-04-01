import React, { useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStrategy, useHasPurchasedStrategy, useIncrementDownload } from "@/hooks/useStrategies";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Star, Share2, Copy, ShoppingCart, CheckCircle, TrendingUp, AlertTriangle, ExternalLink, BarChart3, Clock, Target, Layers } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

const REFERRAL_STORAGE_KEY = "botvio_referral";

const BROKER_LINKS: Record<string, { name: string; url: string }> = {
  deriv: { name: "Deriv", url: "https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827" },
  exness: { name: "Exness", url: "https://one.exness-track.com/a/ts1kvs1k" },
  mt5: { name: "Exness MT5", url: "https://one.exness-track.com/a/ts1kvs1k" },
  binance: { name: "Binance", url: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU" },
};

/* ── AdSense slot ── */
const StrategyAdSlot = ({ slot }: { slot: string }) => {
  const adRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      if (adRef.current) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {}
  }, []);
  return (
    <div className="my-6 text-center" ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-8741937856196827"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

/* ── Convert markdown-like text to HTML ── */
const formatDescription = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/^✅ (.+)$/gm, '<li>✅ $1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="list-disc pl-5 space-y-1">$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>').replace(/$/, '</p>');
};

const StrategyDetail = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: strategy, isLoading } = useStrategy(slug || "");
  const { data: hasPurchased } = useHasPurchasedStrategy(strategy?.id || "");
  const incrementDownload = useIncrementDownload();

  // Capture referral from URL
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      const referralData = {
        code: refCode,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(referralData));
    }
  }, [searchParams]);

  const handleShare = async () => {
    if (!strategy) return;
    
    // Include user's affiliate code if they have one
    const referralData = localStorage.getItem("botvio_referral");
    const ref = referralData ? JSON.parse(referralData).code : null;
    const shareUrl = `${window.location.origin}/s/${strategy.slug}${ref ? `?ref=${ref}` : ""}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: strategy.title,
          text: `Check out this trading strategy: ${strategy.title}`,
          url: shareUrl,
        });
      } catch {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t("common.linkCopied", "Link copied!"));
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("common.linkCopied", "Link copied!"));
    }
  };

  const handleCopyStrategy = async () => {
    if (!strategy) return;
    
    // Check if paid and not purchased
    if (strategy.pricing_type === "paid" && !hasPurchased) {
      toast.error(t("strategies.purchaseRequired", "Please purchase this strategy first"));
      return;
    }
    
    // Increment download count
    await incrementDownload.mutateAsync(strategy.id);
    
    // Copy config to clipboard
    if (strategy.config_json) {
      await navigator.clipboard.writeText(JSON.stringify(strategy.config_json, null, 2));
      toast.success(t("strategies.configCopied", "Strategy configuration copied to clipboard!"));
    } else {
      toast.info(t("strategies.noConfig", "This strategy has no configuration to copy"));
    }
  };

  const handlePurchase = () => {
    if (!user) {
      toast.error(t("auth.loginRequired", "Please login to purchase"));
      return;
    }
    
    // Navigate to checkout (placeholder)
    toast.info(t("strategies.checkoutComingSoon", "Checkout coming soon!"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-4 bg-muted rounded w-48" />
        </div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">{t("strategies.notFound", "Strategy not found")}</h3>
          <Button className="mt-4" onClick={() => navigate("/strategies")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("strategies.backToMarketplace", "Back to Marketplace")}
          </Button>
        </Card>
      </div>
    );
  }

  const ogImageUrl = strategy.cover_image_url || `${window.location.origin}/placeholder.svg`;
  const ogDescription = strategy.description || `Trading strategy for ${strategy.market}`;

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{strategy.title} | Botvio Strategy Marketplace</title>
        <meta name="description" content={ogDescription} />
        
        {/* Open Graph */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={strategy.title} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:url" content={`${window.location.origin}/s/${strategy.slug}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={strategy.title} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        {/* Strategy Detail Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
          <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" onClick={() => navigate("/strategies")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("strategies.backToMarketplace", "Back to Marketplace")}
            </Button>
            
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cover Image */}
              {strategy.cover_image_url && (
                <div className="lg:w-1/3">
                  <img
                    src={strategy.cover_image_url}
                    alt={strategy.title}
                    className="w-full h-64 lg:h-80 object-cover rounded-lg shadow-lg"
                  />
                </div>
              )}
              
              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{strategy.market}</Badge>
                    <Badge variant={strategy.pricing_type === "free" ? "secondary" : "default"}>
                      {strategy.pricing_type === "free" 
                        ? t("strategies.free", "Free") 
                        : `$${strategy.price_usd}`}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold">{strategy.title}</h1>
                </div>
                
                <p className="text-muted-foreground text-lg">{strategy.description}</p>
                
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {strategy.downloads || 0} {t("strategies.downloads", "downloads")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {strategy.rating?.toFixed(1) || "N/A"}
                  </span>
                </div>

                {strategy.symbols && strategy.symbols.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {strategy.symbols.map((symbol) => (
                      <Badge key={symbol} variant="outline">{symbol}</Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-3 pt-4">
                  {strategy.pricing_type === "paid" && !hasPurchased ? (
                    <Button size="lg" onClick={handlePurchase}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {t("strategies.purchase", "Purchase")} - ${strategy.price_usd}
                    </Button>
                  ) : (
                    <Button size="lg" onClick={handleCopyStrategy}>
                      {hasPurchased ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {t("strategies.copyStrategy", "Copy Strategy")}
                    </Button>
                  )}
                  
                  <Button variant="outline" size="lg" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    {t("common.share", "Share")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("strategies.about", "About This Strategy")}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                  {strategy.description ? (
                    <p>{strategy.description}</p>
                  ) : (
                    <p className="text-muted-foreground">{t("strategies.noDescription", "No description provided")}</p>
                  )}
                </CardContent>
              </Card>

              {/* Strategy Configuration */}
              {strategy.config_json && typeof strategy.config_json === "object" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" />
                      Strategy Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(strategy.config_json as Record<string, unknown>).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start gap-4">
                        <span className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="text-sm font-medium text-right">
                          {Array.isArray(value) ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {(value as string[]).map((v, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{String(v)}</Badge>
                              ))}
                            </div>
                          ) : String(value)}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Broker CTA */}
              {(() => {
                const broker = BROKER_LINKS[strategy.market] || BROKER_LINKS.deriv;
                return (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-lg mb-2">Trade this strategy on {broker.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Open a free {broker.name} account and start using this strategy with a demo account first.
                      </p>
                      <a href={broker.url} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full gap-2">
                          Open {broker.name} Account <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <p className="text-xs text-muted-foreground mt-3">
                        ⚠️ Trading involves risk. Start with a demo account.
                      </p>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Disclaimer */}
              <Card className="border-warning/50 bg-warning/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-5 w-5" />
                    {t("strategies.disclaimer", "Disclaimer")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {t("strategies.disclaimerText", "Trading involves substantial risk and is not suitable for all investors. Past performance is not indicative of future results. Always do your own research before copying any strategy.")}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("strategies.details", "Strategy Details")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("strategies.market", "Market")}</span>
                    <span className="font-medium capitalize">{strategy.market}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("strategies.pricing", "Pricing")}</span>
                    <span className="font-medium">
                      {strategy.pricing_type === "free" ? t("strategies.free", "Free") : `$${strategy.price_usd}`}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("strategies.downloads", "Downloads")}</span>
                    <span className="font-medium">{strategy.downloads || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("strategies.rating", "Rating")}</span>
                    <span className="font-medium flex items-center gap-1">
                      <Star className="h-4 w-4 text-primary" />
                      {strategy.rating?.toFixed(1) || "N/A"}
                    </span>
                  </div>
                  {strategy.contract_family && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contract Type</span>
                        <Badge variant="outline" className="text-xs">{strategy.contract_family}</Badge>
                      </div>
                    </>
                  )}
                  {strategy.market_type && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Market Type</span>
                        <Badge variant="outline" className="text-xs">{strategy.market_type.replace(/_/g, " ")}</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <Button className="w-full gap-2" onClick={handleCopyStrategy}>
                    <Copy className="h-4 w-4" /> Copy Strategy Config
                  </Button>
                  <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
                    <Share2 className="h-4 w-4" /> Share Strategy
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StrategyDetail;
