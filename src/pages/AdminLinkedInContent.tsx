import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Linkedin, RefreshCw, Sparkles, Send, CheckCircle2, XCircle, Pause, Play,
  Pencil, RotateCcw, Trash2, ExternalLink, AlertTriangle,
} from "lucide-react";

type ContentPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  keywords: string[];
  hashtags: string[];
  topic: string | null;
  cta_url: string;
  target: string;
  status: "draft" | "approved" | "scheduled" | "publishing" | "published" | "failed";
  scheduled_at: string | null;
  published_at: string | null;
  linkedin_post_id: string | null;
  error: string | null;
  attempts: number;
  generation_date: string | null;
  created_at: string;
};

type EngineStatus = { target: string; orgUrnConfigured: boolean; paused: boolean };

const statusVariant = (s: ContentPost["status"]) =>
  s === "published" ? "default" : s === "failed" ? "destructive" : s === "approved" || s === "scheduled" ? "secondary" : "outline";

export default function AdminLinkedInContent() {
  const db = supabase as any;
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState<EngineStatus | null>(null);
  const [orgUrn, setOrgUrn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [{ data, error }, { data: status }] = await Promise.all([
        db.from("linkedin_content_posts").select("*").order("scheduled_at", { ascending: false }).limit(40),
        supabase.functions.invoke("linkedin-content-engine", { body: { action: "status" } }),
      ]);
      if (error) throw error;
      setPosts((data || []) as ContentPost[]);
      if (status?.success) setEngine({ target: status.target, orgUrnConfigured: status.orgUrnConfigured, paused: status.paused });
    } catch (e: any) {
      toast.error(e?.message || "Could not load LinkedIn content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      today: posts.filter(p => p.generation_date === today).length,
      queued: posts.filter(p => p.status === "approved" || p.status === "scheduled").length,
      published: posts.filter(p => p.status === "published").length,
      failed: posts.filter(p => p.status === "failed").length,
    };
  }, [posts]);

  const saveSetting = async (key: string, value: string, label: string) => {
    const { error } = await supabase.rpc("admin_upsert_app_setting", {
      p_key: key, p_value: value, p_description: "LinkedIn content engine setting",
    });
    if (error) toast.error(error.message); else toast.success(`${label} saved`);
    return !error;
  };

  const invoke = async (body: Record<string, unknown>, okMessage: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("linkedin-content-engine", { body });
      if (error) throw error;
      if (!data?.success && !data?.created && data?.created !== 0) throw new Error(data?.error || data?.errors?.[0] || "Action failed");
      if (data?.errors?.length) toast.warning(data.errors[0]);
      else toast.success(okMessage);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally { setBusy(false); }
  };

  const updatePost = async (id: string, patch: Record<string, unknown>, label: string) => {
    const { error } = await db.from("linkedin_content_posts").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(label); load(); }
  };

  const removePost = async (id: string) => {
    const { error } = await db.from("linkedin_content_posts").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Post deleted"); load(); }
  };

  const startEdit = (p: ContentPost) => { setEditingId(p.id); setEditTitle(p.title); setEditBody(p.body); };
  const saveEdit = async () => {
    if (!editingId) return;
    await updatePost(editingId, { title: editTitle.trim(), body: editBody.trim() }, "Post updated");
    setEditingId(null);
  };

  const orgMissing = engine?.target === "organization" && !engine?.orgUrnConfigured;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Linkedin className="h-6 w-6" /> LinkedIn Content Engine</h1>
          <p className="text-sm text-muted-foreground">5 original Botvio articles generated and published daily at 06:00, 10:00, 14:00, 18:00 and 22:00 UTC.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => invoke({ action: "generate" }, "Today's articles generated")} disabled={busy}>
            <Sparkles className="h-4 w-4 mr-2" />Generate today's articles
          </Button>
          <Button onClick={() => invoke({ action: "publish" }, "Publisher run finished")} disabled={busy}>
            <Send className="h-4 w-4 mr-2" />Run publisher
          </Button>
        </div>
      </div>

      {orgMissing && (
        <Card className="border-destructive">
          <CardContent className="p-4 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Company Page publishing is not configured yet — nothing is being published.</p>
              <p className="text-muted-foreground mt-1">
                Add your LinkedIn organization URN below (find the organization ID in your Company Page URL: linkedin.com/company/<b>ID</b>, then enter <code>urn:li:organization:ID</code>).
                Your LinkedIn app also needs the <code>w_organization_social</code> permission, which LinkedIn grants after you request the "Share on LinkedIn" / Community Management product for your app and make yourself an admin of the page.
                Until then, posts are generated and queued but not published — or switch the target to your personal profile below.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <CompanyPageConnect />

      <Card>
        <CardHeader>
          <CardTitle>Publishing settings</CardTitle>
          <CardDescription>Credentials stay on the server through the secure LinkedIn connection — nothing is stored in the browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-2">Publish to</p>
              <Select
                value={engine?.target || "organization"}
                onValueChange={async (v) => { if (await saveSetting("linkedin_content_target", v, "Target")) load(); }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">Botvio Company Page</SelectItem>
                  <SelectItem value="member">Personal profile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border p-3 sm:col-span-2">
              <p className="text-sm font-medium mb-2">Company Page URN</p>
              <div className="flex gap-2">
                <Input value={orgUrn} onChange={e => setOrgUrn(e.target.value)} placeholder="urn:li:organization:12345678" />
                <Button variant="outline" onClick={async () => { if (await saveSetting("linkedin_org_urn", orgUrn.trim(), "Organization URN")) load(); }}>Save</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{engine?.orgUrnConfigured ? "A URN is saved. Enter a new one to replace it." : "Not set — required for Company Page posting."}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            {engine?.paused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span className="text-sm font-medium">Automatic publishing</span>
            <Switch
              checked={!engine?.paused}
              onCheckedChange={async (on) => { if (await saveSetting("linkedin_content_paused", on ? "false" : "true", on ? "Publishing resumed" : "Publishing paused")) load(); }}
            />
            <span className="text-xs text-muted-foreground ml-auto">{engine?.paused ? "Paused" : "Active"}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Article links carry tracking parameters (utm_source=linkedin) so website analytics show how many visitors and registrations come from LinkedIn. LinkedIn engagement metrics (likes, comments) need an extra LinkedIn permission and are not collected yet.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Generated today", value: stats.today },
          { label: "Queued", value: stats.queued },
          { label: "Published", value: stats.published },
          { label: "Failed", value: stats.failed },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4"><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article queue</CardTitle>
          <CardDescription>Failed posts are retried automatically up to 3 times. Published posts are never sent twice.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No articles yet. Tap "Generate today's articles" to create the first batch.</p>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={statusVariant(post.status)}>{post.status}</Badge>
                    {post.topic && <Badge variant="outline">{post.topic}</Badge>}
                    {post.attempts > 0 && post.status !== "published" && <Badge variant="outline">attempt {post.attempts}/3</Badge>}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {post.status === "published"
                        ? `Published ${post.published_at ? new Date(post.published_at).toLocaleString() : ""}`
                        : `Scheduled ${post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : ""}`}
                    </span>
                  </div>

                  {editingId === post.id ? (
                    <div className="space-y-2">
                      <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                      <Textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={10} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}>Save changes</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium">{post.title}</p>
                      {post.excerpt && <p className="text-sm text-muted-foreground">{post.excerpt}</p>}
                      <div className="flex flex-wrap gap-1">
                        {post.hashtags?.map(h => <span key={h} className="text-xs text-primary">#{h}</span>)
                        }
                      </div>
                      <a className="text-xs text-primary inline-flex items-center gap-1" href={post.cta_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3 w-3" />{post.cta_url}
                      </a>
                    </>
                  )}

                  {post.error && <p className="text-sm text-destructive">{post.error}</p>}

                  <div className="flex gap-2 flex-wrap">
                    {post.status !== "published" && editingId !== post.id && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(post)}><Pencil className="h-4 w-4 mr-1" />Edit</Button>
                        {post.status === "draft" && <Button size="sm" variant="outline" onClick={() => updatePost(post.id, { status: "approved" }, "Post approved")}><CheckCircle2 className="h-4 w-4 mr-1" />Approve</Button>}
                        <Button size="sm" variant="outline" onClick={() => invoke({ action: "regenerate", post_id: post.id }, "Article regenerated")} disabled={busy}><RotateCcw className="h-4 w-4 mr-1" />Regenerate</Button>
                        <Button size="sm" onClick={() => invoke({ action: "publish", post_id: post.id }, "Post published")} disabled={busy}><Send className="h-4 w-4 mr-1" />Publish now</Button>
                        <Button size="sm" variant="ghost" onClick={() => removePost(post.id)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
                      </>
                    )}
                    {post.status === "published" && (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Live on LinkedIn {post.linkedin_post_id ? `(${post.linkedin_post_id})` : ""}</span>
                    )}
                    {post.status === "failed" && post.attempts >= 3 && (
                      <span className="text-xs text-destructive inline-flex items-center gap-1"><XCircle className="h-3 w-3" />Retries exhausted — edit or regenerate, then publish manually</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CompanyPageConnect() {
  const [s, setS] = useState<{ credentialsConfigured: boolean; connected: boolean; orgName: string | null; orgUrn: string | null; expiresAt: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase.functions.invoke("linkedin-org-oauth", { body: { action: "status" } }).then(({ data }) => { if (data?.success) setS(data); });
  }, []);
  const connect = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("linkedin-org-oauth", { body: { action: "start", origin: window.location.origin } });
    setBusy(false);
    if (error || !data?.url) { toast.error(data?.error || "Could not start LinkedIn sign-in"); return; }
    window.location.href = data.url;
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Botvio Company Page</CardTitle>
        <CardDescription>
          {s?.connected
            ? `Connected to ${s.orgName || s.orgUrn}. The 5 daily article posts go to this page${s.expiresAt ? ` (sign-in valid until ${new Date(s.expiresAt).toLocaleDateString()})` : ""}.`
            : "Not connected — daily posts currently go to your personal profile."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {s && !s.credentialsConfigured ? (
          <p className="text-sm text-muted-foreground">Your LinkedIn Client ID and Secret are not saved yet.</p>
        ) : (
          <Button onClick={connect} disabled={busy || !s}><Linkedin className="h-4 w-4 mr-2" />{s?.connected ? "Reconnect Company Page" : "Connect Company Page"}</Button>
        )}
      </CardContent>
    </Card>
  );
}
