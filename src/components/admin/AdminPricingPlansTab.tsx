import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface PricingPlan {
  id: string;
  code: string;
  name: string;
  price_usd: number | null;
  price_zmw: number | null;
  max_accounts: number | null;
  max_bot_instances: number | null;
  allow_copy_trading: boolean | null;
  allow_premium_bots: boolean | null;
  allow_provider_listing: boolean | null;
  allow_premium_signals: boolean | null;
  allow_sports_betting: boolean | null;
  allow_all_courses: boolean | null;
  is_active: boolean | null;
  created_at: string;
}

export const AdminPricingPlansTab = () => {
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState<{ open: boolean; plan: PricingPlan | null }>({
    open: false,
    plan: null,
  });
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    price_usd: 0,
    price_zmw: 0,
    max_accounts: 1,
    max_bot_instances: 2,
    allow_copy_trading: false,
    allow_premium_bots: false,
    allow_provider_listing: false,
    allow_premium_signals: false,
    allow_sports_betting: false,
    allow_all_courses: false,
    is_active: true,
  });

  // Fetch all plans (including inactive for admin)
  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin-pricing-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("*")
        .order("price_usd", { ascending: true });
      if (error) throw error;
      return data as PricingPlan[];
    },
  });

  // Create plan mutation
  const createPlan = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("pricing_plans").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-plans"] });
      queryClient.invalidateQueries({ queryKey: ["pricing-plans"] });
      toast.success("Plan created successfully");
      setEditDialog({ open: false, plan: null });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create plan: ${error.message}`);
    },
  });

  // Update plan mutation
  const updatePlan = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & typeof formData) => {
      const { error } = await supabase
        .from("pricing_plans")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-plans"] });
      queryClient.invalidateQueries({ queryKey: ["pricing-plans"] });
      toast.success("Plan updated successfully");
      setEditDialog({ open: false, plan: null });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update plan: ${error.message}`);
    },
  });

  // Toggle plan active status
  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("pricing_plans")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-plans"] });
      queryClient.invalidateQueries({ queryKey: ["pricing-plans"] });
      toast.success("Plan status updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update plan: ${error.message}`);
    },
  });

  const openCreateDialog = () => {
    setFormData({
      code: "",
      name: "",
      price_usd: 0,
      price_zmw: 0,
      max_accounts: 1,
      max_bot_instances: 2,
      allow_copy_trading: false,
      allow_premium_bots: false,
      allow_provider_listing: false,
      allow_premium_signals: false,
      allow_sports_betting: false,
      allow_all_courses: false,
      is_active: true,
    });
    setEditDialog({ open: true, plan: null });
  };

  const openEditDialog = (plan: PricingPlan) => {
    setFormData({
      code: plan.code,
      name: plan.name,
      price_usd: plan.price_usd || 0,
      price_zmw: plan.price_zmw || 0,
      max_accounts: plan.max_accounts || 1,
      max_bot_instances: plan.max_bot_instances || 2,
      allow_copy_trading: plan.allow_copy_trading || false,
      allow_premium_bots: plan.allow_premium_bots || false,
      allow_provider_listing: plan.allow_provider_listing || false,
      allow_premium_signals: plan.allow_premium_signals || false,
      allow_sports_betting: plan.allow_sports_betting || false,
      allow_all_courses: plan.allow_all_courses || false,
      is_active: plan.is_active !== false,
    });
    setEditDialog({ open: true, plan });
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.name) {
      toast.error("Code and Name are required");
      return;
    }

    if (editDialog.plan) {
      updatePlan.mutate({ id: editDialog.plan.id, ...formData });
    } else {
      createPlan.mutate(formData);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Pricing Plans Management
            </CardTitle>
            <CardDescription>
              Create, edit, and manage subscription plans
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading plans...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price (USD)</TableHead>
                <TableHead>Price (ZMW)</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No pricing plans configured
                  </TableCell>
                </TableRow>
              ) : (
                plans?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-mono">{plan.code}</TableCell>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>${plan.price_usd || 0}</TableCell>
                    <TableCell>K{plan.price_zmw || 0}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{plan.max_accounts || 1} accounts</div>
                        <div>{plan.max_bot_instances || 2} bots</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {plan.allow_copy_trading && (
                          <Badge variant="outline" className="text-xs">Copy</Badge>
                        )}
                        {plan.allow_premium_bots && (
                          <Badge variant="outline" className="text-xs">Premium</Badge>
                        )}
                        {plan.allow_provider_listing && (
                          <Badge variant="outline" className="text-xs">Provider</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={plan.is_active !== false}
                        onCheckedChange={(checked) =>
                          toggleActive.mutate({ id: plan.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editDialog.plan ? "Edit Plan" : "Create New Plan"}
            </DialogTitle>
            <DialogDescription>
              {editDialog.plan
                ? "Update the pricing plan details"
                : "Add a new subscription plan to the platform"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Plan Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., pro, elite"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  disabled={!!editDialog.plan} // Can't change code after creation
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Pro Plan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_usd">Price (USD)</Label>
                <Input
                  id="price_usd"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_usd}
                  onChange={(e) => setFormData({ ...formData, price_usd: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_zmw">Price (ZMW)</Label>
                <Input
                  id="price_zmw"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.price_zmw}
                  onChange={(e) => setFormData({ ...formData, price_zmw: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_accounts">Max Accounts</Label>
                <Input
                  id="max_accounts"
                  type="number"
                  min="1"
                  value={formData.max_accounts}
                  onChange={(e) => setFormData({ ...formData, max_accounts: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_bot_instances">Max Bot Instances</Label>
                <Input
                  id="max_bot_instances"
                  type="number"
                  min="1"
                  value={formData.max_bot_instances}
                  onChange={(e) => setFormData({ ...formData, max_bot_instances: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Features</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_copy_trading" className="font-normal">
                    Allow Copy Trading
                  </Label>
                  <Switch
                    id="allow_copy_trading"
                    checked={formData.allow_copy_trading}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allow_copy_trading: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_premium_bots" className="font-normal">
                    Allow Premium Bots
                  </Label>
                  <Switch
                    id="allow_premium_bots"
                    checked={formData.allow_premium_bots}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allow_premium_bots: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_provider_listing" className="font-normal">
                    Allow Provider Listing
                  </Label>
                  <Switch
                    id="allow_provider_listing"
                    checked={formData.allow_provider_listing}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allow_provider_listing: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active" className="font-normal">
                    Plan Active
                  </Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, plan: null })}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createPlan.isPending || updatePlan.isPending}
            >
              {createPlan.isPending || updatePlan.isPending
                ? "Saving..."
                : editDialog.plan
                ? "Update Plan"
                : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
