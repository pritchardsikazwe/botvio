import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Search, RefreshCw, Download, Phone, Globe, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

interface NewsletterSubscriber {
  id: string;
  email: string;
  display_name: string | null;
  whatsapp_number: string | null;
  country: string | null;
  source: string | null;
  is_active: boolean;
  subscribed_at: string;
}

export const AdminNewsletterTab = () => {
  const [search, setSearch] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: subscribers, isLoading, refetch } = useQuery({
    queryKey: ["admin_newsletter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data as NewsletterSubscriber[];
    },
  });

  const addSubscriber = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email, source: "admin_manual" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_newsletter"] });
      toast.success("Subscriber added");
      setNewEmail("");
    },
    onError: (e: any) => toast.error(e.message || "Failed to add subscriber"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ 
          is_active: active, 
          unsubscribed_at: active ? null : new Date().toISOString() 
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_newsletter"] });
      toast.success("Updated");
    },
  });

  const activeCount = subscribers?.filter(s => s.is_active).length || 0;

  const filtered = subscribers?.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.email.toLowerCase().includes(q) || s.display_name?.toLowerCase().includes(q) || s.country?.toLowerCase().includes(q);
  });

  const exportCSV = () => {
    if (!subscribers) return;
    const active = subscribers.filter(s => s.is_active);
    const headers = ["Email", "Name", "WhatsApp", "Country", "Source", "Subscribed At"];
    const rows = active.map(s => [
      s.email,
      s.display_name || "",
      s.whatsapp_number || "",
      s.country || "",
      s.source || "",
      new Date(s.subscribed_at).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${active.length} active subscribers`);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Subscribers</p>
              <p className="text-2xl font-bold">{subscribers?.length || 0}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
            </div>
            <Mail className="h-8 w-8 text-emerald-400" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">With WhatsApp</p>
              <p className="text-2xl font-bold text-emerald-400">
                {subscribers?.filter(s => s.whatsapp_number).length || 0}
              </p>
            </div>
            <Phone className="h-8 w-8 text-emerald-400" />
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" /> Newsletter Subscribers
              </CardTitle>
              <CardDescription>Manage subscribers for email marketing campaigns</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={!subscribers?.length}>
                <Download className="w-4 h-4 mr-1" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick add */}
          <div className="flex gap-2">
            <Input
              placeholder="Add subscriber email..."
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && newEmail && addSubscriber.mutate(newEmail)}
              className="max-w-xs"
            />
            <Button size="sm" onClick={() => newEmail && addSubscriber.mutate(newEmail)} disabled={!newEmail || addSubscriber.isPending}>
              <UserPlus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered && filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead><Phone className="h-3 w-3 inline mr-1" />WhatsApp</TableHead>
                    <TableHead><Globe className="h-3 w-3 inline mr-1" />Country</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.email}</TableCell>
                      <TableCell>{s.display_name || "—"}</TableCell>
                      <TableCell>
                        {s.whatsapp_number ? (
                          <span className="text-emerald-400 font-mono text-sm">{s.whatsapp_number}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {s.country ? <Badge variant="outline" className="text-xs">{s.country}</Badge> : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{s.source || "signup"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.is_active ? "default" : "destructive"} className={s.is_active ? "bg-emerald-600" : ""}>
                          {s.is_active ? "Active" : "Unsubscribed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(s.subscribed_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className={s.is_active ? "border-destructive text-destructive" : "border-emerald-500 text-emerald-400"}
                          onClick={() => toggleActive.mutate({ id: s.id, active: !s.is_active })}
                        >
                          {s.is_active ? "Unsub" : "Reactivate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No subscribers match your search" : "No newsletter subscribers yet. Users are auto-added on signup."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
