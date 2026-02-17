import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, UserMinus, Users, Search } from "lucide-react";
import { toast } from "sonner";

interface SignalManager {
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    email: string | null;
    display_name: string | null;
  };
}

export const SignalManagersTab = () => {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState("");

  // Fetch users with signal_manager role
  const { data: managers, isLoading } = useQuery({
    queryKey: ["signal-managers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .eq("role", "signal_manager");

      if (error) throw error;

      // Fetch profiles for these users
      if (data && data.length > 0) {
        const userIds = data.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email, display_name")
          .in("user_id", userIds);

        return data.map((r) => ({
          ...r,
          profile: profiles?.find((p) => p.user_id === r.user_id) || null,
        })) as SignalManager[];
      }
      return [] as SignalManager[];
    },
  });

  // Search user by email
  const { data: searchResults } = useQuery({
    queryKey: ["search-user-email", searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 3) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .ilike("email", `%${searchEmail}%`)
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: searchEmail.length >= 3,
  });

  // Add signal_manager role
  const addManager = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "signal_manager" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Signal manager role granted");
      queryClient.invalidateQueries({ queryKey: ["signal-managers"] });
      setSearchEmail("");
    },
    onError: (error: Error) => {
      toast.error(error.message.includes("duplicate")
        ? "User already has signal manager role"
        : `Failed: ${error.message}`);
    },
  });

  // Remove signal_manager role
  const removeManager = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "signal_manager");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Signal manager role removed");
      queryClient.invalidateQueries({ queryKey: ["signal-managers"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  const isAlreadyManager = (userId: string) =>
    managers?.some((m) => m.user_id === userId);

  return (
    <div className="space-y-6">
      {/* Add new signal manager */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Signal Manager
          </CardTitle>
          <CardDescription>
            Search for a user by email to grant them permission to post manual signals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="search-email" className="sr-only">Search by email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-email"
                  placeholder="Search user by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {searchResults && searchResults.length > 0 && (
            <div className="border rounded-lg divide-y divide-border">
              {searchResults.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium text-sm">{user.display_name || "No name"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={isAlreadyManager(user.user_id) || addManager.isPending}
                    onClick={() => addManager.mutate(user.user_id)}
                  >
                    {isAlreadyManager(user.user_id) ? (
                      "Already Manager"
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Grant Role
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchEmail.length >= 3 && searchResults?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-3">
              No users found matching "{searchEmail}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current signal managers */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Signal Managers
            {managers && managers.length > 0 && (
              <Badge variant="secondary">{managers.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Users who can post manual trading signals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : managers && managers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Granted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((mgr) => (
                  <TableRow key={mgr.user_id}>
                    <TableCell className="font-medium">
                      {mgr.profile?.display_name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {mgr.profile?.email || mgr.user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(mgr.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeManager.mutate(mgr.user_id)}
                        disabled={removeManager.isPending}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No signal managers added yet</p>
              <p className="text-xs mt-1">Search for a user above to grant them signal posting permission</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
