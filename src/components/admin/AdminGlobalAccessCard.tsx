import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Globe2 } from "lucide-react";
import { toast } from "sonner";
import { GLOBAL_ACCESS_KEY } from "@/hooks/useGlobalAccess";

/**
 * Admin switch for global access. When enabled, all visitors (signed in or
 * not) get full access to members-only pages without a subscription. Stored
 * in app_settings.global_access_open; read live by the access gates.
 */
export function AdminGlobalAccessCard() {
  const qc = useQueryClient();

  const { data: enabled, isLoading } = useQuery({
    queryKey: ["admin-global-access"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", GLOBAL_ACCESS_KEY)
        .maybeSingle();
      return !!(data?.value as { enabled?: boolean } | null)?.enabled;
    },
  });

  const toggle = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase.rpc("admin_upsert_app_setting", {
        p_key: GLOBAL_ACCESS_KEY,
        p_value: { enabled: next },
        p_description: "When enabled, all visitors get full access without a subscription",
      });
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      qc.invalidateQueries({ queryKey: ["admin-global-access"] });
      qc.invalidateQueries({ queryKey: ["global-access-setting"] });
      toast.success(next ? "Global access enabled — everyone has full access" : "Global access disabled — plan and trial rules apply");
    },
    onError: (e: Error) => toast.error(e.message || "Could not update global access"),
  });

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-amber-500" />
              Global Access
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Allow every visitor full access without a subscription. Turn off to require a paid plan or trial again.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <span className="text-xs font-medium">{enabled ? "Open to everyone" : "Restricted"}</span>
            <Switch
              checked={!!enabled}
              onCheckedChange={(v) => toggle.mutate(v)}
              disabled={isLoading || toggle.isPending}
              aria-label="Toggle global access"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 text-xs text-muted-foreground">
        Admins always keep full access regardless of this setting.
      </CardContent>
    </Card>
  );
}
