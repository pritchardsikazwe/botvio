import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Clock, Trophy, Image } from "lucide-react";
import { toast } from "sonner";

export const AdminSignalHistoryTab = () => {
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ["admin-signals-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals_history")
        .select("*")
        .order("date_posted", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const updateResult = useMutation({
    mutationFn: async ({ id, result, profit_pips }: { id: string; result: string; profit_pips?: number }) => {
      const updates: any = { result };
      if (result !== "RUNNING") updates.date_closed = new Date().toISOString();
      if (profit_pips !== undefined) updates.profit_pips = profit_pips;
      const { error } = await supabase.from("signals_history").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-signals-history"] });
      queryClient.invalidateQueries({ queryKey: ["signals-history-public"] });
      toast.success("Signal result updated");
    },
  });

  // Pending comments
  const { data: pendingComments } = useQuery({
    queryKey: ["admin-pending-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signal_comments")
        .select("*")
        .eq("is_approved", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const approveComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("signal_comments").update({ is_approved: true }).eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-comments"] });
      toast.success("Comment approved");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("signal_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-comments"] });
      toast.success("Comment deleted");
    },
  });

  return (
    <div className="space-y-6">
      {/* Pending Comments */}
      {pendingComments && pendingComments.length > 0 && (
        <Card className="glass-card border-warning/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Pending Comments ({pendingComments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingComments.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                <p className="text-xs flex-1 mr-2">{c.content}</p>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => approveComment.mutate(c.id)}>
                    <Check className="h-3.5 w-3.5 text-success" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteComment.mutate(c.id)}>
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Signal History Management */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Signal History Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Pair</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Entry</TableHead>
                  <TableHead className="text-xs">Result</TableHead>
                  <TableHead className="text-xs">Pips</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(history || []).map((s: any) => (
                  <SignalHistoryRow key={s.id} signal={s} onUpdate={updateResult.mutate} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function SignalHistoryRow({ signal, onUpdate }: { signal: any; onUpdate: (p: any) => void }) {
  const [pips, setPips] = useState(signal.profit_pips?.toString() || "");

  return (
    <TableRow>
      <TableCell className="text-xs font-medium">{signal.pair}</TableCell>
      <TableCell>
        <Badge variant={signal.signal_type === "BUY" ? "default" : "destructive"} className="text-[10px]">
          {signal.signal_type}
        </Badge>
      </TableCell>
      <TableCell className="text-xs">{signal.entry_price}</TableCell>
      <TableCell>
        <Select
          value={signal.result}
          onValueChange={val => onUpdate({ id: signal.id, result: val, profit_pips: pips ? parseFloat(pips) : undefined })}
        >
          <SelectTrigger className="h-7 text-xs w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WIN">✅ WIN</SelectItem>
            <SelectItem value="LOSS">❌ LOSS</SelectItem>
            <SelectItem value="RUNNING">⏳ RUNNING</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={pips}
          onChange={e => setPips(e.target.value)}
          className="h-7 w-16 text-xs"
          placeholder="Pips"
          type="number"
          onBlur={() => {
            if (pips !== (signal.profit_pips?.toString() || "")) {
              onUpdate({ id: signal.id, result: signal.result, profit_pips: pips ? parseFloat(pips) : undefined });
            }
          }}
        />
      </TableCell>
      <TableCell>
        {signal.screenshot_url && (
          <a href={signal.screenshot_url} target="_blank" rel="noopener noreferrer">
            <Image className="h-4 w-4 text-primary" />
          </a>
        )}
      </TableCell>
    </TableRow>
  );
}
