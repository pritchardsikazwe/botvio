import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Radio, Clock, TrendingUp } from "lucide-react";
import type { LiveStream } from "@/hooks/useLiveFeed";
import { formatDistanceToNow } from "date-fns";

interface LiveStreamCardProps {
  stream: LiveStream;
  onClick?: () => void;
}

export function LiveStreamCard({ stream, onClick }: LiveStreamCardProps) {
  const creatorName = stream.profiles?.display_name || stream.profiles?.email?.split("@")[0] || "Trader";
  const isLive = stream.status === "live";
  const startedAgo = stream.started_at
    ? formatDistanceToNow(new Date(stream.started_at), { addSuffix: true })
    : "";

  return (
    <Card
      className="bg-card border-border hover:border-primary/40 transition-all duration-300 cursor-pointer group overflow-hidden"
      onClick={onClick}
    >
      {/* Thumbnail / Preview Area */}
      <div className="relative aspect-video bg-secondary flex items-center justify-center overflow-hidden">
        {stream.thumbnail_url ? (
          <img
            src={stream.thumbnail_url}
            alt={stream.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Radio className="w-8 h-8 animate-pulse text-destructive" />
            <span className="text-xs">Live Stream</span>
          </div>
        )}

        {/* Live badge overlay */}
        {isLive && (
          <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground border-none gap-1 animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full" />
            LIVE
          </Badge>
        )}

        {!isLive && (
          <Badge className="absolute top-3 left-3 bg-muted text-muted-foreground border-none">
            Ended
          </Badge>
        )}

        {/* Viewer count overlay */}
        <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
          <Eye className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium text-foreground">
            {stream.viewers_current || 0}
          </span>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Creator info */}
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 border-2 border-primary/30">
            <AvatarImage src={stream.profiles?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {creatorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{creatorName}</p>
            <p className="text-xs text-muted-foreground">{startedAgo}</p>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">
          {stream.title}
        </h3>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5">
          {stream.instrument && (
            <Badge variant="outline" className="text-xs border-primary/30 text-primary gap-1">
              <TrendingUp className="w-3 h-3" />
              {stream.instrument}
            </Badge>
          )}
          {stream.broker_name && (
            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
              {stream.broker_name}
            </Badge>
          )}
          {stream.timeframe && (
            <Badge variant="outline" className="text-xs border-border text-muted-foreground gap-1">
              <Clock className="w-3 h-3" />
              {stream.timeframe}
            </Badge>
          )}
          {stream.strategy_tag && (
            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
              {stream.strategy_tag}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
