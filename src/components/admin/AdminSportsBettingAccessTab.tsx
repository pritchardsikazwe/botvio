import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Plus, Trash2, Search, Loader2 } from "lucide-react";

export function AdminSportsBettingAccessTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");

  const { data: accessList, isLoading } = useQuery({
    queryKey: ["admin-sports-access"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sports_betting_access")
        .select("*, profiles:user_id(email, display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const grantMutation = useMutation({
    mutationFn: async () => {
      // Find user by email
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();
      if (profileErr) throw profileErr;
      if (!profile) throw new Error("User not found with that email");

      const { error } = await supabase.from("sports_betting_access").insert({
        user_id: profile.user_id,
        granted_by: user!.id,
        reason: reason || null,
      });
      if (error) {
        if (error.code === "23505") throw new Error("User already has access");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Access granted");
      setEmail("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-sports-access"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sports_betting_access")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Access revoked");
      queryClient.invalidateQueries({ queryKey: ["admin-sports-access"] });
    },
    onError: () => toast.error("Failed to revoke access"),
  });

  const filtered = accessList?.filter((a: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.profiles?.email?.toLowerCase().includes(s) ||
      a.profiles?.display_name?.toLowerCase().includes(s)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Sports Betting Access Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grant access form */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="User email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => grantMutation.mutate()}
            disabled={!email.trim() || grantMutation.isPending}
          >
            {grantMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Grant Access
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No manual access grants yet
                  </TableCell>
                </TableRow>
              )}
              {filtered?.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{a.profiles?.display_name || "—"}</p>
                      <p className="text-sm text-muted-foreground">{a.profiles?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{a.reason || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={a.is_active ? "default" : "secondary"}>
                      {a.is_active ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {a.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeMutation.mutate(a.id)}
                        disabled={revokeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
