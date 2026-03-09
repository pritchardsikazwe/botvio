import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook that listens for new trading signals via Supabase realtime
 * and sends browser push notifications (Notification API).
 * Works for all visitors — no auth required.
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [enabled, setEnabled] = useState(false);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") {
      toast.error("Your browser doesn't support notifications");
      return false;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      setEnabled(true);
      toast.success("🔔 Notifications enabled! You'll get alerts for new signals.");
      return true;
    } else {
      toast.error("Notification permission denied. Enable it in browser settings.");
      return false;
    }
  }, []);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      try {
        // Use service worker registration if available (works in background for PWA)
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              icon: "/icon-192.png",
              badge: "/favicon.png",
              vibrate: [200, 100, 200],
              ...options,
            });
          });
        } else {
          new Notification(title, {
            icon: "/icon-192.png",
            ...options,
          });
        }
      } catch {
        // Fallback: silent fail
      }
    },
    []
  );

  // Listen for new signals globally (no auth needed)
  useEffect(() => {
    if (permission !== "granted") return;

    const channel = supabase
      .channel("public-signal-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trading_signals",
        },
        (payload) => {
          const sig = payload.new as any;
          const direction = sig.direction?.toUpperCase() || "SIGNAL";
          const symbol = sig.symbol || "Unknown";
          const entry = sig.entry_price ? ` @ ${sig.entry_price}` : "";

          sendNotification(`${direction} ${symbol}${entry}`, {
            body: `New ${direction} signal on ${symbol}. ${sig.timeframe || ""} timeframe. Confidence: ${sig.confidence || "N/A"}%`,
            tag: `signal-${sig.id}`,
            data: { url: "/signals" },
          });

          // Also show in-app toast
          toast(`📊 New Signal: ${direction} ${symbol}`, {
            description: `Entry: ${sig.entry_price || "—"} | TP: ${sig.take_profit || "—"} | SL: ${sig.stop_loss || "—"}`,
            duration: 8000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [permission, sendNotification]);

  return {
    permission,
    enabled: permission === "granted",
    requestPermission,
    sendNotification,
  };
}
