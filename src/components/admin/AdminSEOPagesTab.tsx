import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Plus, Pencil, Trash2, Search, Link2, Bot, Signal, MapPin, FileText, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { seoTrafficPages, signalPairPages, botPages, countryTrafficSlugs, AFFILIATE_LINKS } from "@/content/seoTrafficPages";

interface SEOPage {
  id: string;
  slug: string;
  page_type: string;
  meta_title: string;
  meta_description: string;
  h1: string;
  content_json: any[];
  faqs_json: any[];
  keywords: string[];
  broker_cta: string;
  is_active: boolean;
  country: string | null;
  country_flag: string | null;
  market: string | null;
  strategy: string | null;
  created_at: string;
  updated_at: string;
}

interface AffiliateLink {
  id: string;
  broker_key: string;
  url: string;
  label: string;
  is_active: boolean;
  updated_at: string;
}

const defaultPage: Partial<SEOPage> = {
  slug: "",
  page_type: "seo_traffic",
  meta_title: "",
  meta_description: "",
  h1: "",
  content_json: [],
  faqs_json: [],
  keywords: [],
  broker_cta: "exness",
  is_active: true,
  country: null,
  country_flag: null,
  market: null,
  strategy: null,
};

export const AdminSEOPagesTab = () => {
  const [pages, setPages] = useState<SEOPage[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [editDialog, setEditDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<SEOPage> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [pagesRes, linksRes] = await Promise.all([
      supabase.from("seo_pages").select("*").order("page_type").order("slug"),
      supabase.from("seo_affiliate_links").select("*").order("broker_key"),
    ]);
    if (pagesRes.data) setPages(pagesRes.data as SEOPage[]);
    if (linksRes.data) setAffiliateLinks(linksRes.data as AffiliateLink[]);
    setLoading(false);
  };

  // Sync hardcoded pages to DB
  const syncFromCode = async () => {
    setSyncing(true);
    try {
      const existingSlugs = new Set(pages.map(p => p.slug));
      const inserts: any[] = [];

      // SEO Traffic Pages
      Object.entries(seoTrafficPages).forEach(([slug, page]) => {
        if (!existingSlugs.has(slug)) {
          inserts.push({
            slug,
            page_type: "seo_traffic",
            meta_title: page.metaTitle,
            meta_description: page.metaDescription,
            h1: page.h1,
            content_json: page.sections,
            faqs_json: page.faqs,
            keywords: page.keywords,
            broker_cta: "exness",
            is_active: true,
          });
        }
      });

      // Signal Pair Pages
      Object.entries(signalPairPages).forEach(([slug, page]) => {
          const fullSlug = `signals/${slug}`;
        if (!existingSlugs.has(fullSlug)) {
          inserts.push({
            slug: fullSlug,
            page_type: "signal_pair",
            meta_title: `${page.displayName} Signals — Free AI Trading Analysis`,
            meta_description: `Get free ${page.displayName} trading signals with AI analysis. Entry, SL & TP levels.`,
            h1: `${page.displayName} Trading Signals`,
            content_json: [{ heading: "Analysis", content: page.description }],
            faqs_json: [],
            keywords: [page.pair, `${page.pair} signals`],
            broker_cta: page.brokerCTA,
            market: page.pair,
            is_active: true,
          });
        }
      });

      // Bot Pages
      Object.entries(botPages).forEach(([slug, page]) => {
        const fullSlug = `bots/${slug}`;
        if (!existingSlugs.has(fullSlug)) {
          inserts.push({
            slug: fullSlug,
            page_type: "bot",
            meta_title: `${page.name} — AI Trading Bot`,
            meta_description: page.description,
            h1: page.name,
            content_json: [{ heading: "Strategy", content: page.strategy }],
            faqs_json: [],
            keywords: [page.name, page.market],
            broker_cta: page.brokerCTA,
            market: page.market,
            strategy: page.strategy,
            is_active: true,
          });
        }
      });

      // Country Traffic Pages
      countryTrafficSlugs.forEach((c) => {
        ["forex-trading", "exness", "gold-trading"].forEach((prefix) => {
          const slug = `${prefix}-${c.slug}`;
          if (!existingSlugs.has(slug)) {
            inserts.push({
              slug,
              page_type: "country_traffic",
              meta_title: c.metaTitle,
              meta_description: c.metaDescription,
              h1: `${prefix === "forex-trading" ? "Forex Trading" : prefix === "exness" ? "Exness" : "Gold Trading"} in ${c.country}`,
              content_json: [],
              faqs_json: [],
              keywords: [`forex ${c.country}`, `trading ${c.country}`],
              broker_cta: "exness",
              country: c.country,
              country_flag: c.flag,
              is_active: true,
            });
          }
        });
      });

      if (inserts.length > 0) {
        // Insert in batches of 50
        for (let i = 0; i < inserts.length; i += 50) {
          const batch = inserts.slice(i, i + 50);
          const { error } = await supabase.from("seo_pages").insert(batch);
          if (error) {
            console.error("Sync batch error:", error);
            toast.error(`Sync error: ${error.message}`);
            break;
          }
        }
        toast.success(`Synced ${inserts.length} pages to database`);
        await fetchData();
      } else {
        toast.info("All pages already synced");
      }
    } catch (err: any) {
      toast.error(`Sync failed: ${err.message}`);
    }
    setSyncing(false);
  };

  const togglePageActive = async (page: SEOPage) => {
    const { error } = await supabase
      .from("seo_pages")
      .update({ is_active: !page.is_active })
      .eq("id", page.id);
    if (error) {
      toast.error("Failed to update page");
      return;
    }
    toast.success(`Page ${!page.is_active ? "enabled" : "disabled"}`);
    setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_active: !p.is_active } : p));
  };

  const openEdit = (page?: SEOPage) => {
    if (page) {
      setEditingPage({ ...page });
      setIsNew(false);
    } else {
      setEditingPage({ ...defaultPage });
      setIsNew(true);
    }
    setEditDialog(true);
  };

  const savePage = async () => {
    if (!editingPage) return;
    const { id, created_at, updated_at, ...data } = editingPage as any;

    if (isNew) {
      const { error } = await supabase.from("seo_pages").insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success("Page created");
    } else {
      const { error } = await supabase.from("seo_pages").update(data).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Page updated");
    }
    setEditDialog(false);
    setEditingPage(null);
    await fetchData();
  };

  const deletePage = async (id: string) => {
    if (!confirm("Delete this SEO page?")) return;
    const { error } = await supabase.from("seo_pages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Page deleted");
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const updateAffiliateLink = async (link: AffiliateLink, newUrl: string) => {
    const { error } = await supabase
      .from("seo_affiliate_links")
      .update({ url: newUrl })
      .eq("id", link.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${link.broker_key} link updated`);
    setAffiliateLinks(prev => prev.map(l => l.id === link.id ? { ...l, url: newUrl } : l));
  };

  const filteredPages = pages.filter(p => {
    const matchesSearch = !search || p.slug.includes(search.toLowerCase()) || p.meta_title.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || p.page_type === filterType;
    return matchesSearch && matchesType;
  });

  const pageTypeCounts = {
    all: pages.length,
    seo_traffic: pages.filter(p => p.page_type === "seo_traffic").length,
    signal_pair: pages.filter(p => p.page_type === "signal_pair").length,
    bot: pages.filter(p => p.page_type === "bot").length,
    country_traffic: pages.filter(p => p.page_type === "country_traffic").length,
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "seo_traffic": return <FileText className="w-3 h-3" />;
      case "signal_pair": return <Signal className="w-3 h-3" />;
      case "bot": return <Bot className="w-3 h-3" />;
      case "country_traffic": return <MapPin className="w-3 h-3" />;
      default: return <Globe className="w-3 h-3" />;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "seo_traffic": return "SEO Traffic";
      case "signal_pair": return "Signal";
      case "bot": return "Bot";
      case "country_traffic": return "Country";
      default: return type;
    }
  };

  if (loading) return <div className="text-center py-8">Loading SEO pages...</div>;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Pages", count: pageTypeCounts.all, icon: Globe },
          { label: "SEO Traffic", count: pageTypeCounts.seo_traffic, icon: FileText },
          { label: "Signal Pages", count: pageTypeCounts.signal_pair, icon: Signal },
          { label: "Bot Pages", count: pageTypeCounts.bot, icon: Bot },
          { label: "Country Pages", count: pageTypeCounts.country_traffic, icon: MapPin },
        ].map(s => (
          <Card key={s.label} className="glass-card">
            <CardContent className="p-3 text-center">
              <s.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pages">
        <TabsList className="glass-card p-1">
          <TabsTrigger value="pages">SEO Pages</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliate Links</TabsTrigger>
        </TabsList>

        {/* SEO Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          {/* Actions Bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types ({pageTypeCounts.all})</SelectItem>
                <SelectItem value="seo_traffic">SEO Traffic ({pageTypeCounts.seo_traffic})</SelectItem>
                <SelectItem value="signal_pair">Signal Pages ({pageTypeCounts.signal_pair})</SelectItem>
                <SelectItem value="bot">Bot Pages ({pageTypeCounts.bot})</SelectItem>
                <SelectItem value="country_traffic">Country ({pageTypeCounts.country_traffic})</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={syncFromCode} disabled={syncing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              Sync from Code
            </Button>
            <Button onClick={() => openEdit()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Page
            </Button>
          </div>

          {/* Pages Table */}
          <Card className="glass-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Broker</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {pages.length === 0
                          ? 'No SEO pages yet. Click "Sync from Code" to import hardcoded pages.'
                          : "No pages match your search."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPages.slice(0, 100).map(page => (
                      <TableRow key={page.id} className={!page.is_active ? "opacity-50" : ""}>
                        <TableCell>
                          <button onClick={() => togglePageActive(page)} className="cursor-pointer">
                            {page.is_active
                              ? <Eye className="w-4 h-4 text-success" />
                              : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {typeIcon(page.page_type)}
                            {typeLabel(page.page_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate">
                          /{page.slug}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate text-sm">
                          {page.country_flag && `${page.country_flag} `}
                          {page.meta_title || page.h1}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {page.broker_cta}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(page)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePage(page.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {filteredPages.length > 100 && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  Showing 100 of {filteredPages.length} pages. Use search to filter.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Affiliate Links Tab */}
        <TabsContent value="affiliates">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Affiliate Links
              </CardTitle>
              <CardDescription>Manage broker affiliate URLs used across all SEO pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {affiliateLinks.map(link => (
                <div key={link.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 rounded-lg bg-muted/30">
                  <Badge className="capitalize min-w-[80px] justify-center">{link.broker_key}</Badge>
                  <Input
                    defaultValue={link.url}
                    className="flex-1 font-mono text-xs"
                    onBlur={e => {
                      if (e.target.value !== link.url) {
                        updateAffiliateLink(link, e.target.value);
                      }
                    }}
                  />
                  <Switch
                    checked={link.is_active}
                    onCheckedChange={async (v) => {
                      await supabase.from("seo_affiliate_links").update({ is_active: v }).eq("id", link.id);
                      setAffiliateLinks(prev => prev.map(l => l.id === link.id ? { ...l, is_active: v } : l));
                    }}
                  />
                </div>
              ))}

              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium mb-1">Currently hardcoded in code:</p>
                {Object.entries(AFFILIATE_LINKS).map(([k, v]) => (
                  <p key={k} className="font-mono text-xs truncate">{k}: {v}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Create SEO Page" : "Edit SEO Page"}</DialogTitle>
            <DialogDescription>Configure the SEO page content and metadata</DialogDescription>
          </DialogHeader>

          {editingPage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={editingPage.slug || ""}
                    onChange={e => setEditingPage({ ...editingPage, slug: e.target.value })}
                    placeholder="exness-trading-signals"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Page Type</Label>
                  <Select
                    value={editingPage.page_type || "seo_traffic"}
                    onValueChange={v => setEditingPage({ ...editingPage, page_type: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seo_traffic">SEO Traffic</SelectItem>
                      <SelectItem value="signal_pair">Signal Pair</SelectItem>
                      <SelectItem value="bot">Bot</SelectItem>
                      <SelectItem value="country_traffic">Country Traffic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={editingPage.meta_title || ""}
                  onChange={e => setEditingPage({ ...editingPage, meta_title: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">{(editingPage.meta_title || "").length}/60</p>
              </div>

              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={editingPage.meta_description || ""}
                  onChange={e => setEditingPage({ ...editingPage, meta_description: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">{(editingPage.meta_description || "").length}/160</p>
              </div>

              <div className="space-y-2">
                <Label>H1 Heading</Label>
                <Input
                  value={editingPage.h1 || ""}
                  onChange={e => setEditingPage({ ...editingPage, h1: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Broker CTA</Label>
                  <Select
                    value={editingPage.broker_cta || "exness"}
                    onValueChange={v => setEditingPage({ ...editingPage, broker_cta: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exness">Exness</SelectItem>
                      <SelectItem value="deriv">Deriv</SelectItem>
                      <SelectItem value="binance">Binance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Market</Label>
                  <Input
                    value={editingPage.market || ""}
                    onChange={e => setEditingPage({ ...editingPage, market: e.target.value })}
                    placeholder="XAUUSD, EUR/USD..."
                  />
                </div>
              </div>

              {editingPage.page_type === "country_traffic" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={editingPage.country || ""}
                      onChange={e => setEditingPage({ ...editingPage, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Flag Emoji</Label>
                    <Input
                      value={editingPage.country_flag || ""}
                      onChange={e => setEditingPage({ ...editingPage, country_flag: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Keywords (comma-separated)</Label>
                <Input
                  value={(editingPage.keywords || []).join(", ")}
                  onChange={e => setEditingPage({ ...editingPage, keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Strategy (for bot pages)</Label>
                <Textarea
                  value={editingPage.strategy || ""}
                  onChange={e => setEditingPage({ ...editingPage, strategy: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingPage.is_active ?? true}
                  onCheckedChange={v => setEditingPage({ ...editingPage, is_active: v })}
                />
                <Label>Page Active (visible to public)</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={savePage}>
              {isNew ? "Create Page" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
