import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, RefreshCw, MessageCircle, PhoneMissed, Globe2, Download } from "lucide-react";

interface UserRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  country: string | null;
  whatsapp_number: string | null;
  created_at: string | null;
}

const waLink = (n: string) =>
  `https://wa.me/${encodeURIComponent(n.replace(/[^0-9]/g, ""))}?text=${encodeURIComponent("Hi from Botvio!")}`;

/** Admin page: full registered-user list with WhatsApp numbers and tap-to-chat links. */
export default function AdminUserContacts() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "has" | "missing">("all");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-user-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-list-users", { body: {} });
      if (error) throw new Error(error.message || "Could not load registered users");
      if (data?.error) throw new Error(data.error);
      if (!Array.isArray(data?.users)) throw new Error("Admin users endpoint returned an invalid response");
      return data.users as UserRow[];
    },
  });

  const users = useMemo(() => data ?? [], [data]);
  const withWhatsApp = users.filter((u) => u.whatsapp_number?.trim());
  const missing = users.length - withWhatsApp.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "has" && !u.whatsapp_number?.trim()) return false;
      if (filter === "missing" && u.whatsapp_number?.trim()) return false;
      if (!q) return true;
      return [u.display_name, u.email, u.whatsapp_number, u.country]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [users, search, filter]);

  const exportCsv = () => {
    const rows = [["Name", "Email", "WhatsApp", "Country", "Joined"]];
    for (const u of filtered) {
      rows.push([
        u.display_name ?? "",
        u.email ?? "",
        u.whatsapp_number ?? "",
        u.country ?? "",
        u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : "",
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `botvio-user-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-4 px-4 py-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> User contacts
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Every registered user with their WhatsApp number. Tap a number to open a WhatsApp chat.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {isLoading ? (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : isError ? (
            <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <p className="font-medium text-destructive">Could not load users: {(error as Error)?.message}</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{users.length} users</Badge>
                <Badge className="bg-primary/15 text-primary">{withWhatsApp.length} with WhatsApp</Badge>
                <Badge variant="destructive">{missing} missing</Badge>
                <div className="ml-auto flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={exportCsv} disabled={!filtered.length}>
                    <Download className="mr-1 h-4 w-4" /> CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
                    <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search name, email, number or country…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-1">
                  {(["all", "has", "missing"] as const).map((f) => (
                    <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                      {f === "all" ? "All" : f === "has" ? "Has WhatsApp" : "Missing"}
                    </Button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Showing {filtered.length} of {users.length}</p>

              <div className="divide-y rounded-md border">
                {filtered.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No users match this filter.</p>
                ) : (
                  filtered.map((u) => (
                    <div key={u.user_id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{u.display_name || u.email || "User"}</div>
                        <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe2 className="h-3 w-3" /> {u.country || "No country"}
                          </span>
                          {u.created_at && <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.whatsapp_number?.trim() ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={waLink(u.whatsapp_number)} target="_blank" rel="noreferrer">
                              <MessageCircle className="mr-1 h-4 w-4" /> {u.whatsapp_number}
                            </a>
                          </Button>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <PhoneMissed className="h-3.5 w-3.5" /> No WhatsApp
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
