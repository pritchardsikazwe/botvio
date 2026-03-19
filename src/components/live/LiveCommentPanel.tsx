import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useLiveComments } from "@/hooks/useLiveComments";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface LiveCommentPanelProps {
  streamId: string;
}

export function LiveCommentPanel({ streamId }: LiveCommentPanelProps) {
  const { comments, isLoading } = useLiveComments(streamId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("post-live-comment", {
        body: { stream_id: streamId, body: text.trim() },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error);
      setText("");
    } catch (err: any) {
      toast({ title: err.message || "Failed to send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 p-3">
        {isLoading && (
          <p className="text-xs text-muted-foreground text-center">Loading comments...</p>
        )}
        {comments.map((c) => {
          const name = c.profiles?.display_name || "User";
          return (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src={c.profiles?.avatar_url || ""} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-primary mr-1">{name}</span>
                <span className="text-xs text-foreground">{c.body}</span>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {user && (
        <div className="border-t border-border p-2 flex gap-2">
          <Input
            placeholder="Say something..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="bg-secondary border-border text-sm h-8"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="bg-primary text-primary-foreground h-8 px-3"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
