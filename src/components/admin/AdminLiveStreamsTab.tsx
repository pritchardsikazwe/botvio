import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Video, VideoOff, RefreshCw, AlertTriangle, Radio } from "lucide-react";
import { toast } from "sonner";

export const AdminLiveStreamsTab = () => {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { data: streams = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-live-streams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_streams")
        .select("id, title, status, creator_id, created_at, started_at, ended_at, viewers_peak, total_unique_viewers, livekit_room_name")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const liveCount = streams.filter((s) => s.status === "live").length;
  const endedCount = streams.filter((s) => s.status === "ended").length;

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("live_streams").delete().eq("id", id);
      if (error) throw error;
      toast.success("Stream deleted");
      setDeleteId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete stream");
    }
  };

  const handleEndStream = async (id: string) => {
    try {
      const { error } = await supabase
        .from("live_streams")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Stream ended");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to end stream");
    }
  };

  const handleBulkDeleteEnded = async () => {
    setBulkDeleting(true);
    try {
      const { error } = await supabase.from("live_streams").delete().eq("status", "ended");
      if (error) throw error;
      toast.success(`Deleted all ended streams`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to bulk delete");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkDeleteAll = async () => {
    setBulkDeleting(true);
    try {
      const { error } = await supabase.from("live_streams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("All streams deleted");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete all");
    } finally {
      setBulkDeleting(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Live Streams Management
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              <Video className="h-3 w-3 mr-1 text-emerald-400" /> {liveCount} Live
            </Badge>
            <Badge variant="outline" className="text-xs">
              <VideoOff className="h-3 w-3 mr-1" /> {endedCount} Ended
            </Badge>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bulk Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDeleteEnded}
            disabled={bulkDeleting || endedCount === 0}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Delete All Ended ({endedCount})
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDeleteAll}
            disabled={bulkDeleting || streams.length === 0}
          >
            <AlertTriangle className="h-3 w-3 mr-1" /> Delete All Streams ({streams.length})
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading streams...</p>
        ) : streams.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No live streams found. Start a new stream from the Live Feed page.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Viewers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streams.map((stream) => (
                  <TableRow key={stream.id}>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">
                      {stream.title || "Untitled"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={stream.status === "live" ? "default" : "secondary"}
                        className={stream.status === "live" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
                      >
                        {stream.status === "live" ? "🔴 Live" : stream.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(stream.created_at)}
                    </TableCell>
                    <TableCell className="text-xs">
                      Peak: {stream.viewers_peak || 0} • Unique: {stream.total_unique_viewers || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {stream.status === "live" && (
                          <Button size="sm" variant="outline" onClick={() => handleEndStream(stream.id)}>
                            <VideoOff className="h-3 w-3 mr-1" /> End
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => setDeleteId(stream.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stream</DialogTitle>
            <DialogDescription>
              This will permanently delete this stream and all associated comments and reactions. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
