import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { blogContent } from "@/content/blogPosts";
import { FileText, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";

interface Correction {
  id: string;
  article_slug: string;
  article_title: string;
  correction_type: string;
  original_text: string | null;
  corrected_text: string;
  reason: string;
  status: string;
  corrected_at: string;
}

const countWords = (s: string) => (s || "").trim().split(/\s+/).filter(Boolean).length;

export function AdminEditorialTab() {
  const [rows, setRows] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    article_slug: "",
    article_title: "",
    correction_type: "factual",
    original_text: "",
    corrected_text: "",
    reason: "",
    status: "published",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("editorial_corrections")
      .select("*")
      .order("corrected_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data as Correction[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const audit = Object.entries(blogContent).map(([slug, p]) => {
    const wc = countWords(p.content.replace(/<[^>]+>/g, " "));
    return { slug, title: p.title, wordCount: wc, thin: wc < 600 };
  });
  const thin = audit.filter((a) => a.thin);
  const avg = Math.round(audit.reduce((s, a) => s + a.wordCount, 0) / Math.max(1, audit.length));

  const submit = async () => {
    if (!form.article_slug || !form.article_title || !form.corrected_text || !form.reason) {
      toast.error("Fill slug, title, corrected text and reason");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("editorial_corrections").insert({
      ...form,
      submitted_by: userData.user?.id,
      reviewed_by: userData.user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Correction logged");
    setOpen(false);
    setForm({ article_slug: "", article_title: "", correction_type: "factual", original_text: "", corrected_text: "", reason: "", status: "published" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this correction entry?")) return;
    const { error } = await supabase.from("editorial_corrections").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggleStatus = async (row: Correction) => {
    const next = row.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("editorial_corrections").update({ status: next }).eq("id", row.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardDescription>Articles</CardDescription><CardTitle className="text-3xl">{audit.length}</CardTitle></CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardDescription>Avg word count</CardDescription><CardTitle className="text-3xl">{avg}</CardTitle></CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardDescription>Thin (&lt;600w)</CardDescription><CardTitle className="text-3xl text-yellow-500">{thin.length}</CardTitle></CardHeader>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardDescription>Corrections logged</CardDescription><CardTitle className="text-3xl">{rows.length}</CardTitle></CardHeader>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Corrections Log</CardTitle>
            <CardDescription>Public corrections shown to readers when status is <em>published</em>.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Log correction</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Log a correction</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Article slug</Label>
                    <Input value={form.article_slug} onChange={(e) => setForm({ ...form, article_slug: e.target.value })} placeholder="xauusd-smart-money-gold-strategy" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={form.correction_type} onValueChange={(v) => setForm({ ...form, correction_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="factual">Factual</SelectItem>
                        <SelectItem value="update">Update</SelectItem>
                        <SelectItem value="clarification">Clarification</SelectItem>
                        <SelectItem value="retraction">Retraction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Article title</Label>
                  <Input value={form.article_title} onChange={(e) => setForm({ ...form, article_title: e.target.value })} />
                </div>
                <div>
                  <Label>Original text (optional)</Label>
                  <Textarea rows={2} value={form.original_text} onChange={(e) => setForm({ ...form, original_text: e.target.value })} />
                </div>
                <div>
                  <Label>Corrected text</Label>
                  <Textarea rows={2} value={form.corrected_text} onChange={(e) => setForm({ ...form, corrected_text: e.target.value })} />
                </div>
                <div>
                  <Label>Reason / source</Label>
                  <Textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
              </div>
              <DialogFooter><Button onClick={submit}>Publish correction</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No corrections logged yet.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Article</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.corrected_at).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-xs truncate"><a href={`/blog/${r.article_slug}`} className="text-primary underline">{r.article_title}</a></TableCell>
                    <TableCell><Badge variant="outline">{r.correction_type}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant={r.status === "published" ? "default" : "outline"} onClick={() => toggleStatus(r)}>{r.status}</Button>
                    </TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" /> Thin content audit</CardTitle>
          <CardDescription>Articles under the 600-word editorial minimum. Expand these first.</CardDescription>
        </CardHeader>
        <CardContent>
          {thin.length === 0 ? (
            <p className="text-sm text-emerald-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> All {audit.length} articles meet the 600-word minimum.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Article</TableHead><TableHead>Words</TableHead></TableRow></TableHeader>
              <TableBody>
                {thin.map((a) => (
                  <TableRow key={a.slug}>
                    <TableCell><a href={`/blog/${a.slug}`} className="text-primary underline">{a.title}</a></TableCell>
                    <TableCell className="font-mono">{a.wordCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
