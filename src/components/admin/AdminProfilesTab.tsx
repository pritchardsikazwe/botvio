import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Search, RefreshCw, Phone, Globe, Mail, Crown, Calendar } from "lucide-react";
import { toast } from "sonner";

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

interface PlanInfo {
  id: string;
  code: string;
  name: string;
}

interface SubscriptionInfo {
  id: string;
  user_id: string;
  pricing_plan_id: string;
  status: string;
  current_period_end: string | null;
}

export const AdminProfilesTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive
  const [planDialog, setPlanDialog] = useState<{ open: boolean; userId: string; userName: string; currentPlanId: string | null; subId: string | null }>({
    open: false, userId: "", userName: "", currentPlanId: null, subId: null,
  });
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

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

  const { data: plans } = useQuery({
    queryKey: ["admin-all-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing_plans").select("id, code, name").eq("is_active", true).order("price_usd", { ascending: true });
      if (error) throw error;
      return data as PlanInfo[];
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["admin-all-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_plan_subscriptions").select("id, user_id, pricing_plan_id, status, current_period_end");
      if (error) throw error;
      return data as SubscriptionInfo[];
    },
  });

  const changePlan = useMutation({
    mutationFn: async ({ userId, planId, subId, expires }: { userId: string; planId: string; subId: string | null; expires: string }) => {
      const periodEnd = expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      if (subId) {
        const { error } = await supabase
          .from("user_plan_subscriptions")
          .update({
            pricing_plan_id: planId,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_plan_subscriptions")
          .insert({
            user_id: userId,
            pricing_plan_id: planId,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd,
          });
        if (error) throw error;
      }

      // Notify user
      const plan = plans?.find(p => p.id === planId);
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "success",
        title: "Plan Updated!",
        message: `Your plan has been changed to ${plan?.name || "new plan"}. Enjoy your features!`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
      toast.success("User plan updated successfully!");
      setPlanDialog({ open: false, userId: "", userName: "", currentPlanId: null, subId: null });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update plan"),
  });

  const getUserSub = (userId: string) => subscriptions?.find(s => s.user_id === userId);
  const getUserPlan = (userId: string) => {
    const sub = getUserSub(userId);
    if (!sub) return null;
    return plans?.find(p => p.id === sub.pricing_plan_id) || null;
  };

  // Get unique countries for filter
  const countries = [...new Set(profiles?.map(p => p.country).filter(Boolean) as string[])].sort();

  const filtered = profiles?.filter(p => {
    if (search) {
      const s = search.toLowerCase();
      const matches = p.email?.toLowerCase().includes(s) ||
        p.display_name?.toLowerCase().includes(s) ||
        p.country?.toLowerCase().includes(s) ||
        p.whatsapp_number?.includes(s);
      if (!matches) return false;
    }
    if (countryFilter !== "all" && p.country !== countryFilter) return false;
    if (statusFilter === "active") {
      const sub = getUserSub(p.user_id);
      if (!sub || sub.status !== "active") return false;
    } else if (statusFilter === "inactive") {
      const sub = getUserSub(p.user_id);
      if (sub && sub.status === "active") return false;
    }
    return true;
  });

  const openPlanDialog = (profile: ProfileRow) => {
    const sub = getUserSub(profile.user_id);
    const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setSelectedPlanId(sub?.pricing_plan_id || "");
    setExpiresAt(sub?.current_period_end ? new Date(sub.current_period_end).toISOString().split("T")[0] : defaultExpiry);
    setPlanDialog({
      open: true,
      userId: profile.user_id,
      userName: profile.display_name || profile.email || "User",
      currentPlanId: sub?.pricing_plan_id || null,
      subId: sub?.id || null,
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> User Profiles
              {profiles && <Badge variant="secondary">{profiles.length} users</Badge>}
            </CardTitle>
            <CardDescription>Manage users, plans, and filter by country/status</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[160px]">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active Sub</SelectItem>
              <SelectItem value="inactive">No Active Sub</SelectItem>
            </SelectContent>
          </Select>
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
                  <TableHead>Current Plan</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const plan = getUserPlan(p.user_id);
                  const sub = getUserSub(p.user_id);
                  return (
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
                      <TableCell>
                        <Badge variant={plan ? "default" : "secondary"} className={plan?.code === "vip" ? "bg-amber-600" : plan?.code === "standard" ? "bg-blue-600" : ""}>
                          {plan?.name || "Free"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openPlanDialog(p)}>
                          <Crown className="h-4 w-4 mr-1" /> Change Plan
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {search || countryFilter !== "all" || statusFilter !== "all" ? "No profiles match your filters" : "No user profiles found"}
          </div>
        )}
      </CardContent>

      {/* Change Plan Dialog */}
      <Dialog open={planDialog.open} onOpenChange={(open) => setPlanDialog({ ...planDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" /> Change Plan
            </DialogTitle>
            <DialogDescription>
              Update subscription for <strong>{planDialog.userName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan..." />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Expiry Date
              </Label>
              <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog({ ...planDialog, open: false })}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedPlanId) { toast.error("Select a plan"); return; }
                changePlan.mutate({
                  userId: planDialog.userId,
                  planId: selectedPlanId,
                  subId: planDialog.subId,
                  expires: new Date(expiresAt).toISOString(),
                });
              }}
              disabled={changePlan.isPending || !selectedPlanId}
            >
              {changePlan.isPending ? "Updating..." : "Update Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
