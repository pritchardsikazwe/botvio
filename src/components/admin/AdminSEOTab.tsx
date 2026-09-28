import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/useSiteSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Globe, Search, Shield, FileText } from "lucide-react";
import { toast } from "sonner";

export const AdminSEOTab = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();

  const [form, setForm] = useState({
    site_name: "",
    site_url: "",
    meta_title_default: "",
    meta_description_default: "",
    og_image_url: "",
    logo_url: "",
    google_verification_code: "",
    bing_verification_code: "",
    robots_index: true,
    robots_follow: true,
    canonical_base_url: "",
    meta_keywords: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        site_name: settings.site_name || "",
        site_url: settings.site_url || "",
        meta_title_default: settings.meta_title_default || "",
        meta_description_default: settings.meta_description_default || "",
        og_image_url: settings.og_image_url || "",
        logo_url: settings.logo_url || "",
        google_verification_code: settings.google_verification_code || "",
        bing_verification_code: settings.bing_verification_code || "",
        robots_index: settings.robots_index,
        robots_follow: settings.robots_follow,
        canonical_base_url: settings.canonical_base_url || "",
        meta_keywords: settings.meta_keywords || "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form);
      toast.success("SEO settings saved successfully");
    } catch {
      toast.error("Failed to save SEO settings");
    }
  };

  if (isLoading) return <div className="text-center py-8">Loading SEO settings...</div>;

  return (
    <div className="space-y-6">
      {/* Site Identity */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Site Identity
          </CardTitle>
          <CardDescription>Basic site information used across all pages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Site URL</Label>
              <Input value={form.site_url} onChange={(e) => setForm({ ...form, site_url: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Default OG Image URL</Label>
              <Input value={form.og_image_url} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta Defaults */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Default Meta Tags
          </CardTitle>
          <CardDescription>Fallback meta tags for pages without custom SEO</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Page Title</Label>
            <Input value={form.meta_title_default} onChange={(e) => setForm({ ...form, meta_title_default: e.target.value })} placeholder="Under 60 characters" />
            <p className="text-xs text-muted-foreground">{form.meta_title_default.length}/60 characters</p>
          </div>
          <div className="space-y-2">
            <Label>Default Meta Description</Label>
            <Textarea value={form.meta_description_default} onChange={(e) => setForm({ ...form, meta_description_default: e.target.value })} placeholder="Under 160 characters" />
            <p className="text-xs text-muted-foreground">{form.meta_description_default.length}/160 characters</p>
          </div>
          <div className="space-y-2">
            <Label>Meta Keywords (comma-separated)</Label>
            <Input value={form.meta_keywords} onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })} placeholder="trading, bots, signals, forex" />
          </div>
          <div className="space-y-2">
            <Label>Canonical Base URL</Label>
            <Input value={form.canonical_base_url} onChange={(e) => setForm({ ...form, canonical_base_url: e.target.value })} placeholder="https://botvio.lovable.app" />
          </div>
        </CardContent>
      </Card>

      {/* Robots & Indexing */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Robots & Indexing
          </CardTitle>
          <CardDescription>Control how search engines crawl your site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Allow Indexing</p>
              <p className="text-sm text-muted-foreground">Let search engines index public pages</p>
            </div>
            <Switch checked={form.robots_index} onCheckedChange={(v) => setForm({ ...form, robots_index: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Allow Following Links</p>
              <p className="text-sm text-muted-foreground">Let search engines follow links on your pages</p>
            </div>
            <Switch checked={form.robots_follow} onCheckedChange={(v) => setForm({ ...form, robots_follow: v })} />
          </div>
          <Separator />
          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Blocked routes (always):</p>
            <code>/admin /dashboard /settings /auth /api</code>
          </div>
        </CardContent>
      </Card>

      {/* Search Console Verification */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Search Console Verification
          </CardTitle>
          <CardDescription>Verify your site with search engines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Google Search Console Verification Code</Label>
            <Input value={form.google_verification_code} onChange={(e) => setForm({ ...form, google_verification_code: e.target.value })} placeholder="Content value from meta tag" />
            <p className="text-xs text-muted-foreground">
              The content value from: &lt;meta name="google-site-verification" content="YOUR_CODE"&gt;
            </p>
          </div>
          <div className="space-y-2">
            <Label>Bing Webmaster Verification Code</Label>
            <Input value={form.bing_verification_code} onChange={(e) => setForm({ ...form, bing_verification_code: e.target.value })} placeholder="Content value from meta tag" />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-full" variant="gold">
        {updateSettings.isPending ? "Saving..." : "Save SEO Settings"}
      </Button>
    </div>
  );
};
