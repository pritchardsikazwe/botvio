import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBotInstances, useUpdateBotInstance } from "@/hooks/useBotvio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Play, Pause, Square, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export const ActiveBotsWidget = () => {
  const { user } = useAuth();
  const { data: instances, isLoading } = useBotInstances();
  const updateInstance = useUpdateBotInstance();

  if (!user) {
    return null;
  }

  const handleToggleInstance = async (instanceId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    
    try {
      await updateInstance.mutateAsync({
        id: instanceId,
        status: newStatus,
      });
      toast.success(`Bot ${newStatus === "active" ? "started" : "paused"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update bot");
    }
  };

  const handleStopInstance = async (instanceId: string) => {
    try {
      await updateInstance.mutateAsync({
        id: instanceId,
        status: "stopped",
      });
      toast.success("Bot stopped");
    } catch (error: any) {
      toast.error(error.message || "Failed to stop bot");
    }
  };

  const activeInstances = instances?.filter(i => i.status !== "stopped") || [];

  if (isLoading) {
    return (
      <Card className="glass-card animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 bg-secondary rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-16 bg-secondary/50 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (activeInstances.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            Active Bots
          </CardTitle>
          <CardDescription>No active bots running</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/bots">
              <Bot className="h-4 w-4 mr-2" />
              Activate a Bot
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            Active Bots ({activeInstances.length})
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/bots">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeInstances.slice(0, 3).map((instance) => (
          <div key={instance.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                instance.status === "active" ? "bg-success animate-pulse" :
                instance.status === "paused" ? "bg-warning" :
                "bg-muted-foreground"
              }`} />
              <div>
                <p className="font-medium text-sm">{instance.name}</p>
                <p className="text-xs text-muted-foreground">
                  {instance.bot?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={instance.status === "active" ? "default" : "secondary"} className="text-xs">
                {instance.status}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleToggleInstance(instance.id, instance.status)}
                >
                  {instance.status === "active" ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleStopInstance(instance.id)}
                  disabled={instance.status === "stopped"}
                >
                  <Square className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
