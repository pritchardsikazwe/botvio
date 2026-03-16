import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useStrategies, useMyStrategies, useCreateStrategy } from "@/hooks/useStrategies";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Download, Star, Share2, Filter, TrendingUp, DollarSign, Eye } from "lucide-react";
import { Header } from "@/components/trading/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { toast } from "sonner";

const Strategies = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [search, setSearch] = useState("");
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [pricingFilter, setPricingFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Form state for new strategy
  const [newStrategy, setNewStrategy] = useState({
    title: "",
    description: "",
    market: "deriv",
    pricing_type: "free" as "free" | "paid",
    price_usd: 0,
    symbols: [] as string[],
  });

  const { data: strategies = [], isLoading } = useStrategies({
    market: marketFilter === "all" ? undefined : marketFilter,
    pricingType: pricingFilter === "all" ? undefined : pricingFilter,
  });
  const { data: myStrategies = [] } = useMyStrategies();
  const createStrategy = useCreateStrategy();

  const filteredStrategies = strategies.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateStrategy = async () => {
    if (!newStrategy.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    try {
      await createStrategy.mutateAsync({
        ...newStrategy,
        is_public: true,
      });
      setCreateDialogOpen(false);
      setNewStrategy({
        title: "",
        description: "",
        market: "deriv",
        pricing_type: "free",
        price_usd: 0,
        symbols: [],
      });
    } catch (error) {
      toast.error("Failed to create strategy");
    }
  };

  const handleViewStrategy = (slug: string) => {
    // Preserve referral code if exists
    const referralData = localStorage.getItem("botvio_referral");
    const ref = referralData ? JSON.parse(referralData).code : null;
    navigate(`/s/${slug}${ref ? `?ref=${ref}` : ""}`);
  };

  const handleShare = async (strategy: { slug: string; title: string }) => {
    const shareUrl = `${window.location.origin}/s/${strategy.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: strategy.title,
          text: `Check out this trading strategy: ${strategy.title}`,
          url: shareUrl,
        });
      } catch {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied!");
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Strategy Marketplace — Forex & Gold Trading Strategies" description="Discover, share, and download profitable trading strategies for forex, gold, crypto, and synthetic indices. Community-built strategies with performance stats, risk profiles, and easy one-click deployment." />
      <Header />
      {/* Sub-Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{t("strategies.title", "Strategy Marketplace")}</h1>
              <p className="text-muted-foreground mt-1">
                {t("strategies.subtitle", "Discover and share profitable trading strategies")}
              </p>
            </div>
            
            {user && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("strategies.create", "Create Strategy")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{t("strategies.createTitle", "Create New Strategy")}</DialogTitle>
                    <DialogDescription>
                      {t("strategies.createDescription", "Share your trading strategy with the community")}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">{t("strategies.strategyTitle", "Title")}</Label>
                      <Input
                        id="title"
                        value={newStrategy.title}
                        onChange={(e) => setNewStrategy(s => ({ ...s, title: e.target.value }))}
                        placeholder="e.g., V75 Scalping Master"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">{t("common.description", "Description")}</Label>
                      <Textarea
                        id="description"
                        value={newStrategy.description}
                        onChange={(e) => setNewStrategy(s => ({ ...s, description: e.target.value }))}
                        placeholder="Describe your strategy..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("strategies.market", "Market")}</Label>
                        <Select 
                          value={newStrategy.market}
                          onValueChange={(v) => setNewStrategy(s => ({ ...s, market: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deriv">Deriv</SelectItem>
                            <SelectItem value="binance">Binance</SelectItem>
                            <SelectItem value="mt5">MT5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{t("strategies.pricing", "Pricing")}</Label>
                        <Select
                          value={newStrategy.pricing_type}
                          onValueChange={(v) => setNewStrategy(s => ({ ...s, pricing_type: v as "free" | "paid" }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">{t("strategies.free", "Free")}</SelectItem>
                            <SelectItem value="paid">{t("strategies.paid", "Paid")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {newStrategy.pricing_type === "paid" && (
                      <div className="space-y-2">
                        <Label htmlFor="price">{t("strategies.price", "Price")} (USD)</Label>
                        <Input
                          id="price"
                          type="number"
                          min="1"
                          value={newStrategy.price_usd}
                          onChange={(e) => setNewStrategy(s => ({ ...s, price_usd: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      {t("common.cancel", "Cancel")}
                    </Button>
                    <Button onClick={handleCreateStrategy} disabled={createStrategy.isPending}>
                      {createStrategy.isPending ? t("common.creating", "Creating...") : t("common.create", "Create")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="explore" className="space-y-6">
          <TabsList>
            <TabsTrigger value="explore">{t("strategies.explore", "Explore")}</TabsTrigger>
            {user && <TabsTrigger value="my-strategies">{t("strategies.myStrategies", "My Strategies")}</TabsTrigger>}
          </TabsList>

          <TabsContent value="explore" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("strategies.searchPlaceholder", "Search strategies...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={marketFilter} onValueChange={setMarketFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t("strategies.allMarkets", "All Markets")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("strategies.allMarkets", "All Markets")}</SelectItem>
                  <SelectItem value="deriv">Deriv</SelectItem>
                  <SelectItem value="binance">Binance</SelectItem>
                  <SelectItem value="mt5">MT5</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={pricingFilter} onValueChange={setPricingFilter}>
                <SelectTrigger className="w-[150px]">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t("strategies.allPricing", "All Pricing")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("strategies.allPricing", "All Pricing")}</SelectItem>
                  <SelectItem value="free">{t("strategies.free", "Free")}</SelectItem>
                  <SelectItem value="paid">{t("strategies.paid", "Paid")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Strategy Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredStrategies.length === 0 ? (
              <Card className="p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{t("strategies.noStrategies", "No strategies found")}</h3>
                <p className="text-muted-foreground mt-1">
                  {t("strategies.beFirst", "Be the first to share a strategy!")}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStrategies.map((strategy) => (
                  <Card key={strategy.id} className="group hover:shadow-lg transition-shadow border-border/60">
                    {strategy.cover_image_url && (
                      <div className="h-40 overflow-hidden rounded-t-lg">
                        <img
                          src={strategy.cover_image_url}
                          alt={strategy.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="line-clamp-1">{strategy.title}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{strategy.market}</Badge>
                            <Badge variant={strategy.pricing_type === "free" ? "secondary" : "default"}>
                              {strategy.pricing_type === "free" 
                                ? t("strategies.free", "Free") 
                                : `$${strategy.price_usd || 10}`}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-2">
                        {strategy.description || t("strategies.noDescription", "No description provided")}
                      </CardDescription>
                      
                      {/* Symbols */}
                      {strategy.symbols && strategy.symbols.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {strategy.symbols.slice(0, 4).map((sym: string) => (
                            <Badge key={sym} variant="outline" className="text-[10px] px-1.5 py-0">
                              {sym}
                            </Badge>
                          ))}
                          {strategy.symbols.length > 4 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              +{strategy.symbols.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {strategy.downloads || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500" />
                          {strategy.rating?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewStrategy(strategy.slug)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t("common.view", "View")}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleShare(strategy)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-strategies" className="space-y-6">
            {myStrategies.length === 0 ? (
              <Card className="p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{t("strategies.noOwnStrategies", "You haven't created any strategies yet")}</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  {t("strategies.createFirst", "Share your trading knowledge with the community")}
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("strategies.create", "Create Strategy")}
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myStrategies.map((strategy) => (
                  <Card key={strategy.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="line-clamp-1">{strategy.title}</CardTitle>
                        <Badge variant={strategy.is_public ? "default" : "secondary"}>
                          {strategy.is_public ? t("common.public", "Public") : t("common.private", "Private")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{strategy.market}</Badge>
                        <Badge variant={strategy.pricing_type === "free" ? "secondary" : "default"}>
                          {strategy.pricing_type === "free" 
                            ? t("strategies.free", "Free") 
                            : `$${strategy.price_usd}`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-2">
                        {strategy.description || t("strategies.noDescription", "No description provided")}
                      </CardDescription>
                      
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {strategy.downloads || 0}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/s/${strategy.slug}`)}
                      >
                        {t("common.edit", "Edit")}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleShare(strategy)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Strategies;
