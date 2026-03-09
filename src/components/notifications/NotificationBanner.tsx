import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, Check } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function NotificationBanner() {
  const { permission, requestPermission } = usePushNotifications();

  if (permission === "granted") {
    return (
      <Card className="border-success/30 bg-success/5 overflow-hidden">
        <CardContent className="py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <BellRing className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  🔔 Push Notifications Active
                  <Check className="h-5 w-5 text-success" />
                </h3>
                <p className="text-sm text-muted-foreground">You'll get instant alerts for new signals, trade executions, and market moves.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent overflow-hidden">
      <CardContent className="py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-warning flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg">🔔 Enable Push Notifications</h3>
              <p className="text-sm text-muted-foreground">Get instant alerts for new signals, trade executions, and market moves.</p>
            </div>
          </div>
          <Button variant="gold" onClick={requestPermission}>
            <Bell className="h-4 w-4 mr-2" /> Enable Alerts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
