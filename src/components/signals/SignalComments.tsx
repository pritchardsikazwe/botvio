import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface SignalComment {
  id: string;
  signal_id: string;
  user_id: string;
  content: string;
  is_approved: boolean;
  created_at: string;
}

interface SignalCommentsProps {
  signalId: string;
  isAdmin?: boolean;
}

export const SignalComments = ({ signalId, isAdmin }: SignalCommentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["signal-comments", signalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signal_comments")
        .select("*")
        .eq("signal_id", signalId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as SignalComment[];
    },
  });

  const postComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("signal_comments")
        .insert({ signal_id: signalId, user_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["signal-comments", signalId] });
      toast.success("Comment submitted for approval");
    },
    onError: () => toast.error("Failed to post comment"),
  });

  const approveComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("signal_comments")
        .update({ is_approved: true })
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal-comments", signalId] });
      toast.success("Comment approved");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("signal_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal-comments", signalId] });
      toast.success("Comment deleted");
    },
  });

  const visibleComments = comments?.filter(c => c.is_approved || c.user_id === user?.id || isAdmin) || [];

  return (
    <div className="space-y-3 mt-3 border-t border-border/50 pt-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        Comments ({comments?.filter(c => c.is_approved).length || 0})
      </div>

      {/* Comment list */}
      {visibleComments.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {visibleComments.map(c => (
            <div key={c.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                  {!c.is_approved && (
                    <Badge variant="outline" className="text-[9px] text-warning border-warning/30">Pending</Badge>
                  )}
                </div>
                <p className="text-xs mt-0.5">{c.content}</p>
              </div>
              {isAdmin && (
                <div className="flex gap-1 shrink-0">
                  {!c.is_approved && (
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => approveComment.mutate(c.id)}>
                      <Check className="h-3 w-3 text-success" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteComment.mutate(c.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Post comment */}
      {user ? (
        <div className="flex gap-2">
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[36px] h-9 text-xs resize-none"
          />
          <Button
            size="sm"
            disabled={!comment.trim() || postComment.isPending}
            onClick={() => postComment.mutate(comment.trim())}
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sign in to comment</p>
      )}
    </div>
  );
};
