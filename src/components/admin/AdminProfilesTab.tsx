import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, RefreshCw, Phone, Globe, Mail } from "lucide-react";

interface ProfileRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  country: string | null;
  whatsapp_number: string | null;
  onboarding_complete: boolean | null;
  created_at: string;
  language: string | null;
}

export const AdminProfilesTab = () => {
  const [search, setSearch] = useState("");

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, display_name, country, whatsapp_number, onboarding_complete, created_at, language")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProfileRow[];
    },
  });

  const filtered = profiles?.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.email?.toLowerCase().includes(s) ||
      p.display_name?.toLowerCase().includes(s) ||
      p.country?.toLowerCase().includes(s) ||
      p.whatsapp_number?.includes(s)
    );
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> User Profiles
              {profiles && <Badge variant="secondary">{profiles.length} users</Badge>}
            </CardTitle>
            <CardDescription>View all user profiles with WhatsApp, country, and onboarding status</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead><Phone className="h-3 w-3 inline mr-1" />WhatsApp</TableHead>
                  <TableHead><Globe className="h-3 w-3 inline mr-1" />Country</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.display_name || "—"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {p.email || "No email"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.whatsapp_number ? (
                        <a href={`https://wa.me/${p.whatsapp_number.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline text-sm font-mono">
                          {p.whatsapp_number}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.country ? (
                        <Badge variant="outline" className="text-xs">{p.country}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{p.language || "en"}</TableCell>
                    <TableCell>
                      <Badge variant={p.onboarding_complete ? "default" : "outline"} className={p.onboarding_complete ? "bg-emerald-600" : "text-muted-foreground"}>
                        {p.onboarding_complete ? "Complete" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {search ? "No profiles match your search" : "No user profiles found"}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
