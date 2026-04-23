import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  useChartLimitSettings,
  useUpdateChartLimitSettings,
  DEFAULT_CHART_LIMITS,
} from "@/hooks/useChartLimitSettings";

type FormState = {
  free_trial_days: number;
  free_daily_uploads: number;
  basic_uploads: number;
  basic_period_days: number;
  standard_uploads: number;
  standard_period_days: number;
  vip_daily_uploads: number;
};

export const AdminChartLimitsTab = () => {
  const { data, isLoading } = useChartLimitSettings();
  const update = useUpdateChartLimitSettings();
  const [form, setForm] = useState<FormState>({ ...DEFAULT_CHART_LIMITS });

  useEffect(() => {
    if (data) {
      setForm({
        free_trial_days: data.free_trial_days,
        free_daily_uploads: data.free_daily_uploads,
        basic_uploads: data.basic_uploads,
        basic_period_days: data.basic_period_days,
        standard_uploads: data.standard_uploads,
        standard_period_days: data.standard_period_days,
        vip_daily_uploads: data.vip_daily_uploads,
      });
    }
  }, [data]);

  const setField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    setForm((s) => ({ ...s, [key]: Number.isFinite(v) ? Math.max(0, v) : 0 }));
  };

  const handleSave = async () => {
    try {
      await update.mutateAsync(form);
      toast.success("Chart limits updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update limits");
    }
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_CHART_LIMITS });
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Chart Analysis Limits
            </CardTitle>
            <CardDescription>
              Override per-plan upload limits without redeploying. Changes apply
              immediately to all users.
            </CardDescription>
          </div>
          {data?.updated_at && (
            <Badge variant="outline" className="text-xs">
              Updated {new Date(data.updated_at).toLocaleString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Free trial */}
        <section className="rounded-lg border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold">Free trial (unsubscribed users)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Trial length (calendar days)</Label>
              <Input
                type="number"
                min={0}
                value={form.free_trial_days}
                onChange={setField("free_trial_days")}
              />
              <p className="text-xs text-muted-foreground">
                After this many days from signup, free users are blocked until they subscribe.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Uploads allowed per day</Label>
              <Input
                type="number"
                min={0}
                value={form.free_daily_uploads}
                onChange={setField("free_daily_uploads")}
              />
            </div>
          </div>
        </section>

        {/* Basic */}
        <section className="rounded-lg border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold">Basic plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Uploads per period</Label>
              <Input type="number" min={0} value={form.basic_uploads} onChange={setField("basic_uploads")} />
            </div>
            <div className="space-y-1.5">
              <Label>Period length (days)</Label>
              <Input type="number" min={1} value={form.basic_period_days} onChange={setField("basic_period_days")} />
            </div>
          </div>
        </section>

        {/* Standard */}
        <section className="rounded-lg border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold">Standard plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Uploads per period</Label>
              <Input type="number" min={0} value={form.standard_uploads} onChange={setField("standard_uploads")} />
            </div>
            <div className="space-y-1.5">
              <Label>Period length (days)</Label>
              <Input type="number" min={1} value={form.standard_period_days} onChange={setField("standard_period_days")} />
            </div>
          </div>
        </section>

        {/* VIP */}
        <section className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-amber-400">VIP plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Uploads per day</Label>
              <Input
                type="number"
                min={0}
                value={form.vip_daily_uploads}
                onChange={setField("vip_daily_uploads")}
              />
              <p className="text-xs text-muted-foreground">
                Set to a very large number for effectively unlimited.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={handleReset} disabled={update.isPending}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset to defaults
          </Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {update.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminChartLimitsTab;