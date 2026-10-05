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
import { Linkedin, Facebook, Instagram, Send, Clock3, CheckCircle2, XCircle, RefreshCw, Bot, ExternalLink } from "lucide-react";

type Platform = "linkedin" | "facebook" | "instagram" | "x" | "tiktok";
type PostStatus = "draft" | "approved" | "scheduled" | "publishing" | "published" | "failed";

type SocialAccount = {
  id: string;
  platform: Platform;
  account_name: string | null;
  account_id: string | null;
  enabled: boolean;
  connected_at: string | null;
  token_expires_at: string | null;
};

type SocialPost = {
  id: string;
  platform: Platform;
  content: string;
  source_url: string | null;
  scheduled_at: string | null;
  status: PostStatus;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
};

const platforms: { id: Platform; label: string; icon: any }[] = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "x", label: "X", icon: Send },
  { id: "tiktok", label: "TikTok", icon: Send },
];

const statusVariant = (status: PostStatus) => status === "published" ? "default" : status === "failed" ? "destructive" : "secondary";

export default function AdminSocialWorker() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [mode, setMode] = useState<"draft" | "scheduled">("draft");
  const [schedule, setSchedule] = useState("");
  const [autoWorker, setAutoWorker] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [a, p] = await Promise.all([
        supabase.from("social_accounts").select("id,platform,account_name,account_id,enabled,connected_at,token_expires_at").order("platform"),
        supabase.from("social_posts").select("id,platform,content,source_url,scheduled_at,status,published_at,error_message,created_at").order("created_at", { ascending: false }).limit(30),
      ]);
      if (a.error) throw a.error;
      if (p.error) throw p.error;
      setAccounts((a.data || []) as SocialAccount[]);
      setPosts((p.data || []) as SocialPost[]);
    } catch (e: any) {
      toast.error(e?.message || "Social Worker data could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const connected = useMemo(() => new Set(accounts.filter(a => a.enabled).map(a => a.platform)), [accounts]);

  const connect = async (p: Platform) => {
    try {
      const { data, error } = await supabase.functions.invoke("social-oauth", { body: { action: "start", platform: p } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else toast.info(data?.message || "OAuth setup is not configured for this platform yet.");
    } catch (e: any) {
      toast.error(e?.message || "Could not start social connection");
    }
  };

  const createPost = async () => {
    if (!content.trim()) return toast.error("Write the post content first");
    if (mode === "scheduled" && !schedule) return toast.error("Choose a scheduled time");
    setBusy(true);
    try {
      const { error } = await supabase.from("social_posts").insert({
        platform,
        content: content.trim(),
        source_url: sourceUrl.trim() || null,
        status: mode === "scheduled" ? "scheduled" : "draft",
        scheduled_at: mode === "scheduled" ? new Date(schedule).toISOString() : null,
      });
      if (error) throw error;
      toast.success(mode === "scheduled" ? "Post scheduled" : "Draft saved");
      setContent(""); setSourceUrl(""); setSchedule(""); await load();
    } catch (e: any) {
      toast.error(e?.message || "Could not create social post");
    } finally { setBusy(false); }
  };

  const approve = async (id: string) => {
    const { error } = await supabase.from("social_posts").update({ status: "approved" }).eq("id", id).eq("status", "draft");
    if (error) toast.error(error.message); else { toast.success("Post approved for the worker"); load(); }
  };

  const publishNow = async (id: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("social-worker", { body: { action: "publish", post_id: id } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Publishing failed");
      toast.success("Post published");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Publishing failed");
    } finally { setBusy(false); }
  };

  const runWorker = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("social-worker", { body: { action: "run" } });
      if (error) throw error;
      toast.success(`Worker processed ${data?.processed ?? 0} queued post(s)`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Worker run failed");
    } finally { setBusy(false); }
  };

  const toggleWorker = async (enabled: boolean) => {
    setAutoWorker(enabled);
    toast.info(enabled ? "Automatic worker mode enabled in the dashboard. Schedule the backend worker after platform credentials are connected." : "Automatic worker mode disabled.");
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="h-6 w-6" /> Social Worker</h1>
          <p className="text-sm text-muted-foreground">Create, approve, schedule and publish Botvio content across social channels.</p>
        </div>
        <Button onClick={runWorker} disabled={busy}><RefreshCw className="h-4 w-4 mr-2" />Run worker</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {platforms.map(({ id, label, icon: Icon }) => {
          const account = accounts.find(a => a.platform === id);
          return (
            <Card key={id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3"><Icon className="h-5 w-5" /><span className="font-medium">{label}</span></div>
                <Badge variant={connected.has(id) ? "default" : "secondary"}>{connected.has(id) ? "Connected" : "Not connected"}</Badge>
                {account?.account_name && <p className="text-xs text-muted-foreground mt-2 truncate">{account.account_name}</p>}
                <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => connect(id)}>
                  {connected.has(id) ? "Reconnect" : "Connect"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create social post</CardTitle>
          <CardDescription>Approval-first publishing protects the trading platform from accidental or low-quality posts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{platforms.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={mode} onValueChange={(v) => setMode(v as "draft" | "scheduled")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="draft">Save as draft</SelectItem><SelectItem value="scheduled">Schedule</SelectItem></SelectContent>
            </Select>
            {mode === "scheduled" ? <Input type="datetime-local" value={schedule} onChange={e => setSchedule(e.target.value)} /> : <div />}
          </div>
          <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write or paste the platform-specific Botvio post..." rows={7} />
          <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="Botvio article / landing page URL (optional)" />
          <div className="flex items-center gap-3">
            <Button onClick={createPost} disabled={busy}><Clock3 className="h-4 w-4 mr-2" />{mode === "scheduled" ? "Schedule post" : "Save draft"}</Button>
            <div className="ml-auto flex items-center gap-2 text-sm"><Switch checked={autoWorker} onCheckedChange={toggleWorker} /> Auto worker</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Posting queue</CardTitle><CardDescription>Recent drafts, approvals, scheduled posts and publication results.</CardDescription></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading queue...</p> : posts.length === 0 ? <p className="text-sm text-muted-foreground">No social posts yet.</p> : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{post.platform}</Badge><Badge variant={statusVariant(post.status)}>{post.status}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(post.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                  {post.source_url && <a className="text-xs text-primary inline-flex items-center gap-1" href={post.source_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" />Source</a>}
                  {post.error_message && <p className="text-sm text-destructive">{post.error_message}</p>}
                  <div className="flex gap-2">
                    {post.status === "draft" && <Button size="sm" variant="outline" onClick={() => approve(post.id)}><CheckCircle2 className="h-4 w-4 mr-1" />Approve</Button>}
                    {(post.status === "approved" || post.status === "scheduled") && <Button size="sm" onClick={() => publishNow(post.id)} disabled={busy}><Send className="h-4 w-4 mr-1" />Publish now</Button>}
                    {post.status === "published" && <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Published {post.published_at ? new Date(post.published_at).toLocaleString() : ""}</span>}
                    {post.status === "failed" && <span className="text-xs text-destructive inline-flex items-center gap-1"><XCircle className="h-3 w-3" />Failed — reconnect the platform or retry</span>}
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
