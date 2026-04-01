import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Shield, Search, RefreshCw, UserCog, Key, UserPlus, Trash2, ArrowUpCircle } from "lucide-react";
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
  { key: "manage_adverts", label: "Manage Adverts", description: "Create and manage advert banners" },
  { key: "manage_sports", label: "Manage Sports", description: "Manage sports betting access" },
  { key: "reset_passwords", label: "Reset Passwords", description: "Reset user passwords via support" },
];

interface AdminUser {
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: string;
}

export const AdminRolesTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [permDialog, setPermDialog] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [addDialog, setAddDialog] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<"admin" | "super_admin">("admin");

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
      await supabase.from("admin_permissions").delete().eq("user_id", userId);
      if (permissions.length > 0) {
        const { error } = await supabase.from("admin_permissions").insert(
          permissions.map(p => ({ user_id: userId, permission: p, granted_by: user?.id || userId }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-permissions"] });
      toast.success("Permissions updated!");
      setPermDialog({ open: false, user: null });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addAdmin = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: "admin" | "super_admin" }) => {
      // Find user by email
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();
      if (profileErr) throw profileErr;
      if (!profile) throw new Error("No user found with that email");

      // Check if already has this role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("role", role)
        .maybeSingle();
      if (existing) throw new Error(`User already has ${role} role`);

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: profile.user_id, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles-users"] });
      toast.success("Admin added!");
      setAddDialog(false);
      setAddEmail("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, currentRole, newRole }: { userId: string; currentRole: string; newRole: "admin" | "super_admin" }) => {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", currentRole as any);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles-users"] });
      toast.success("Role updated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeAdmin = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      if (userId === user?.id) throw new Error("Cannot remove your own admin role");
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
      await supabase.from("admin_permissions").delete().eq("user_id", userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-permissions"] });
      toast.success("Admin removed!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openPermDialog = (adminUser: AdminUser) => {
    const existing = getUserPermissions(adminUser.user_id);
    setSelectedPerms(new Set(existing));
    setPermDialog({ open: true, user: adminUser });
  };

  const togglePerm = (key: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAllPerms = () => setSelectedPerms(new Set(ALL_PERMISSIONS.map(p => p.key)));
  const clearAllPerms = () => setSelectedPerms(new Set());

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
            <CardDescription>Add admins, assign roles, and control permissions</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => setAddDialog(true)}>
              <UserPlus className="w-4 h-4 mr-1" /> Add Admin
            </Button>
          </div>
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
                const isSelf = u.user_id === user?.id;
                return (
                  <TableRow key={u.user_id}>
                    <TableCell>
                      <p className="font-medium text-sm">{u.display_name || "—"}</p>
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
                        <span className="text-xs text-muted-foreground">No permissions</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {u.role !== "super_admin" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openPermDialog(u)} title="Manage permissions">
                              <Key className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => changeRole.mutate({ userId: u.user_id, currentRole: u.role, newRole: "super_admin" })}
                              title="Promote to Super Admin"
                              className="text-primary hover:text-primary"
                            >
                              <ArrowUpCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {u.role === "super_admin" && !isSelf && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => changeRole.mutate({ userId: u.user_id, currentRole: u.role, newRole: "admin" })}
                            title="Demote to Admin"
                          >
                            Demote
                          </Button>
                        )}
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeAdmin.mutate({ userId: u.user_id, role: u.role })}
                            title="Remove admin"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
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

      {/* Add Admin Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Add New Admin
            </DialogTitle>
            <DialogDescription>Enter the email of the user you want to make an admin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">User Email</Label>
              <Input
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                placeholder="user@example.com"
                type="email"
              />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={addRole} onValueChange={v => setAddRole(v as "admin" | "super_admin")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — Limited access with permissions</SelectItem>
                  <SelectItem value="super_admin">Super Admin — Full access to everything</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button
              onClick={() => addAdmin.mutate({ email: addEmail, role: addRole })}
              disabled={!addEmail.trim() || addAdmin.isPending}
            >
              {addAdmin.isPending ? "Adding..." : "Add Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
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
          <div className="flex gap-2 mb-2">
            <Button variant="outline" size="sm" onClick={selectAllPerms} className="text-xs">Select All</Button>
            <Button variant="outline" size="sm" onClick={clearAllPerms} className="text-xs">Clear All</Button>
          </div>
          <div className="space-y-2 max-h-[55vh] overflow-y-auto">
            {ALL_PERMISSIONS.map(p => (
              <label key={p.key} className="flex items-start gap-3 p-2.5 rounded-lg border border-border hover:border-primary/30 cursor-pointer">
                <Checkbox
                  checked={selectedPerms.has(p.key)}
                  onCheckedChange={() => togglePerm(p.key)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-[11px] text-muted-foreground">{p.description}</p>
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
