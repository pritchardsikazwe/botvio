import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Bell, TrendingUp, Bot, Users, AlertCircle } from "lucide-react";

export interface RealtimeNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, any> | null;
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      const mapped = data.map(n => ({
        ...n,
        is_read: n.is_read ?? false,
        metadata: (typeof n.metadata === 'object' && n.metadata !== null) ? n.metadata as Record<string, any> : undefined
      }));
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.is_read).length);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, [user]);

  // Show toast for new notification
  const showNotificationToast = useCallback((notification: RealtimeNotification) => {
    const getIcon = (type: string) => {
      switch (type) {
        case "trade":
          return "📈";
        case "bot":
          return "🤖";
        case "copy":
          return "👥";
        case "error":
          return "⚠️";
        case "success":
          return "✅";
        default:
          return "🔔";
      }
    };

    toast(notification.title, {
      description: notification.message,
      icon: getIcon(notification.type),
      duration: 5000,
    });
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as RealtimeNotification;
          setNotifications(prev => [newNotification, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
          showNotificationToast(newNotification);
        }
      )
      .subscribe();

    // Subscribe to bot trades for real-time updates
    const botTradesChannel = supabase
      .channel(`bot_trades:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bot_trades",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const trade = payload.new as any;
            toast.success(`Bot Trade Opened: ${trade.symbol}`, {
              description: `${trade.side.toUpperCase()} - Stake: $${trade.stake}`,
            });
          } else if (payload.eventType === "UPDATE" && payload.new.status === "closed") {
            const trade = payload.new as any;
            const pnl = trade.pnl || 0;
            toast(pnl >= 0 ? "Bot Trade Won! 🎉" : "Bot Trade Lost", {
              description: `${trade.symbol}: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to copied trades
    const copiedTradesChannel = supabase
      .channel(`copied_trades:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "copied_trades",
          filter: `subscriber_user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const trade = payload.new as any;
            toast.info(`Trade Copied: ${trade.symbol}`, {
              description: `${trade.direction} - Stake: $${trade.stake}`,
            });
          } else if (payload.eventType === "UPDATE" && payload.new.status === "closed") {
            const trade = payload.new as any;
            const pnl = trade.profit_loss || 0;
            toast(pnl >= 0 ? "Copied Trade Won! 🎉" : "Copied Trade Lost", {
              description: `${trade.symbol}: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to bot instance status changes
    const botInstancesChannel = supabase
      .channel(`bot_instances:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bot_instances",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const instance = payload.new as any;
          const oldInstance = payload.old as any;
          
          if (instance.status !== oldInstance?.status) {
            toast.info(`Bot Status Changed`, {
              description: `${instance.name} is now ${instance.status}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(botTradesChannel);
      supabase.removeChannel(copiedTradesChannel);
      supabase.removeChannel(botInstancesChannel);
    };
  }, [user, fetchNotifications, showNotificationToast]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
