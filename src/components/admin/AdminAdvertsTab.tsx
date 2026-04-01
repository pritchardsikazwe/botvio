import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Megaphone, GripVertical, Pencil } from "lucide-react";

interface AdvertSlot {
  id: string;
  title: string;
  description: string | null;
  link_url: string | null;
  badge_text: string | null;
  badge_color: string | null;
  icon_emoji: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export const AdminAdvertsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    link_url: "",
    badge_text: "",
    icon_emoji: "📢",
  });

  const { data: adverts, isLoading } = useQuery({
    queryKey: ["admin-adverts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advert_slots")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as AdvertSlot[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Title required");
      const { error } = await supabase.from("advert_slots").insert({
        title: form.title,
        description: form.description || null,
        link_url: form.link_url || null,
        badge_text: form.badge_text || null,
        icon_emoji: form.icon_emoji || "📢",
        sort_order: (adverts?.length || 0) + 1,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Advert added!");
      setForm({ title: "", description: "", link_url: "", badge_text: "", icon_emoji: "📢" });
      queryClient.invalidateQueries({ queryKey: ["admin-adverts"] });
      queryClient.invalidateQueries({ queryKey: ["advert-slots"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase.from("advert_slots").update({
        title: form.title,
        description: form.description || null,
        link_url: form.link_url || null,
        badge_text: form.badge_text || null,
        icon_emoji: form.icon_emoji || "📢",
      }).eq("id", editing);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Advert updated!");
      setEditing(null);
      setForm({ title: "", description: "", link_url: "", badge_text: "", icon_emoji: "📢" });
      queryClient.invalidateQueries({ queryKey: ["admin-adverts"] });
      queryClient.invalidateQueries({ queryKey: ["advert-slots"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("advert_slots").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-adverts"] });
      queryClient.invalidateQueries({ queryKey: ["advert-slots"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("advert_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Advert deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-adverts"] });
      queryClient.invalidateQueries({ queryKey: ["advert-slots"] });
    },
  });

  const startEdit = (ad: AdvertSlot) => {
    setEditing(ad.id);
    setForm({
      title: ad.title,
      description: ad.description || "",
      link_url: ad.link_url || "",
      badge_text: ad.badge_text || "",
      icon_emoji: ad.icon_emoji || "📢",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-5 w-5 text-primary" />
            {editing ? "Edit Advert" : "Add New Advert"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Emoji Icon</Label>
              <Input
                value={form.icon_emoji}
                onChange={(e) => setForm((f) => ({ ...f, icon_emoji: e.target.value }))}
                placeholder="📢"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Badge Text</Label>
              <Input
                value={form.badge_text}
                onChange={(e) => setForm((f) => ({ ...f, badge_text: e.target.value }))}
                placeholder="NEW, HOT, etc."
                className="h-9"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Advert title"
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description"
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Link URL</Label>
            <Input
              value={form.link_url}
              onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
              placeholder="https://..."
              className="h-9"
            />
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                  Save Changes
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setEditing(null);
                  setForm({ title: "", description: "", link_url: "", badge_text: "", icon_emoji: "📢" });
                }}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
                <Plus className="h-4 w-4 mr-1" /> Add Advert
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Adverts ({adverts?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : adverts && adverts.length > 0 ? (
            <div className="space-y-2">
              {adverts.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-lg shrink-0">{ad.icon_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{ad.title}</p>
                      {ad.badge_text && <Badge variant="secondary" className="text-[9px]">{ad.badge_text}</Badge>}
                    </div>
                    {ad.description && <p className="text-xs text-muted-foreground truncate">{ad.description}</p>}
                  </div>
                  <Switch
                    checked={ad.is_active}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: ad.id, is_active: checked })}
                  />
                  <Button variant="ghost" size="sm" onClick={() => startEdit(ad)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate(ad.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No adverts yet. Add one above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
