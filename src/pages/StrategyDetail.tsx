import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStrategy, useHasPurchasedStrategy, useIncrementDownload } from "@/hooks/useStrategies";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Star, Share2, Copy, ShoppingCart, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

const REFERRAL_STORAGE_KEY = "botvio_referral";

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
        {/* Header */}
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
