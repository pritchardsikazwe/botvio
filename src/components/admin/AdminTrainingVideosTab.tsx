import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Video } from "lucide-react";

interface VideoForm {
  title: string;
  youtube_url: string;
  category: string;
  sort_order: number;
}

export const AdminTrainingVideosTab = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<VideoForm>({ title: "", youtube_url: "", category: "general", sort_order: 0 });

  const { data: videos, isLoading } = useQuery({
    queryKey: ["admin-training-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_videos")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (v: VideoForm) => {
      const { error } = await supabase.from("training_videos").insert({
        ...v,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Video added");
      qc.invalidateQueries({ queryKey: ["admin-training-videos"] });
      qc.invalidateQueries({ queryKey: ["training-videos-public"] });
      setOpen(false);
      setForm({ title: "", youtube_url: "", category: "general", sort_order: 0 });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("training_videos").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-training-videos"] });
      qc.invalidateQueries({ queryKey: ["training-videos-public"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-training-videos"] });
      qc.invalidateQueries({ queryKey: ["training-videos-public"] });
    },
  });

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" /> Training Videos
        </CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Video
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos?.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium text-sm max-w-[200px] truncate">
                    <a href={v.youtube_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      {v.title}
                    </a>
                  </TableCell>
                  <TableCell className="text-xs">{v.category}</TableCell>
                  <TableCell className="text-xs">{v.sort_order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={v.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: v.id, is_active: checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(v.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Training Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. How to Read Candlesticks" />
              </div>
              <div>
                <Label>YouTube URL</Label>
                <Input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Beginner, Strategy, Binance" />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => addMutation.mutate(form)} disabled={!form.title || !form.youtube_url}>
                Add Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
