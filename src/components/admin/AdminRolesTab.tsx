import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Shield, Search, RefreshCw, Settings, UserCog, Key } from "lucide-react";
import { toast } from "sonner";

const ALL_PERMISSIONS = [
  { key: "manage_signals", label: "Manage Signals", description: "Post and manage trading signals" },
  { key: "manage_subscriptions", label: "Manage Subscriptions", description: "Update user plans and subscriptions" },
  { key: "manage_providers", label: "Manage Providers", description: "Approve/reject signal providers" },
  { key: "manage_billing", label: "Manage Billing", description: "Process payment requests" },
  { key: "manage_users", label: "Manage Users", description: "View and manage user profiles" },
  { key: "manage_seo", label: "Manage SEO", description: "Edit SEO settings and pages" },
  { key: "manage_products", label: "Manage Products", description: "Create and manage marketplace products" },
  { key: "manage_news", label: "Manage News", description: "Create and manage news events" },
  { key: "manage_live", label: "Manage Live", description: "Manage and delete live streams" },
  { key: "reset_passwords", label: "Reset Passwords", description: "Reset user passwords via support" },
];

interface AdminUser {
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: string;
}

export const AdminRolesTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [permDialog, setPermDialog] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());

  const { data: adminUsers, isLoading, refetch } = useQuery({
    queryKey: ["admin-roles-users"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "super_admin"]);
      if (error) throw error;

      const userIds = roles?.map(r => r.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", userIds);

      return roles?.map(r => ({
        ...r,
        email: profiles?.find(p => p.user_id === r.user_id)?.email || null,
        display_name: profiles?.find(p => p.user_id === r.user_id)?.display_name || null,
      })) as AdminUser[];
    },
  });

  const { data: allPermissions } = useQuery({
    queryKey: ["admin-all-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_permissions").select("*");
      if (error) throw error;
      return data;
    },
  });

  const getUserPermissions = (userId: string) =>
    allPermissions?.filter(p => p.user_id === userId).map(p => p.permission) || [];

  const savePermissions = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      // Delete existing
      await supabase.from("admin_permissions").delete().eq("user_id", userId);
      // Insert new
      if (permissions.length > 0) {
        const { error } = await supabase.from("admin_permissions").insert(
          permissions.map(p => ({ user_id: userId, permission: p, granted_by: userId }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-permissions"] });
      toast.success("Admin permissions updated!");
      setPermDialog({ open: false, user: null });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openPermDialog = (user: AdminUser) => {
    const existing = getUserPermissions(user.user_id);
    setSelectedPerms(new Set(existing));
    setPermDialog({ open: true, user });
  };

  const togglePerm = (key: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filtered = adminUsers?.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.email?.toLowerCase().includes(s) || u.display_name?.toLowerCase().includes(s);
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Admin Role Management
            </CardTitle>
            <CardDescription>Control what each admin can access and manage</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search admins..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading admins...</p>
        ) : filtered && filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => {
                const perms = getUserPermissions(u.user_id);
                return (
                  <TableRow key={u.user_id}>
                    <TableCell>
                      <p className="font-medium">{u.display_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "super_admin" ? "default" : "secondary"}>
                        {u.role === "super_admin" ? "Super Admin" : "Admin"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.role === "super_admin" ? (
                        <Badge className="bg-primary/20 text-primary">All Access</Badge>
                      ) : perms.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {perms.slice(0, 3).map(p => (
                            <Badge key={p} variant="outline" className="text-[10px]">{p.replace("manage_", "")}</Badge>
                          ))}
                          {perms.length > 3 && <Badge variant="outline" className="text-[10px]">+{perms.length - 3}</Badge>}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No specific permissions</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.role !== "super_admin" && (
                        <Button size="sm" variant="outline" onClick={() => openPermDialog(u)}>
                          <Key className="h-4 w-4 mr-1" /> Permissions
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center py-8 text-muted-foreground">No admin users found</p>
        )}
      </CardContent>

      <Dialog open={permDialog.open} onOpenChange={open => setPermDialog({ ...permDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" /> Manage Permissions
            </DialogTitle>
            <DialogDescription>
              Set permissions for <strong>{permDialog.user?.display_name || permDialog.user?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            {ALL_PERMISSIONS.map(p => (
              <label key={p.key} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 cursor-pointer">
                <Checkbox
                  checked={selectedPerms.has(p.key)}
                  onCheckedChange={() => togglePerm(p.key)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermDialog({ open: false, user: null })}>Cancel</Button>
            <Button
              onClick={() => {
                if (permDialog.user) {
                  savePermissions.mutate({ userId: permDialog.user.user_id, permissions: Array.from(selectedPerms) });
                }
              }}
              disabled={savePermissions.isPending}
            >
              {savePermissions.isPending ? "Saving..." : "Save Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
