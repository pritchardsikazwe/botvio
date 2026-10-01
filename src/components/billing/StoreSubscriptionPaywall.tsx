import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNativeStore,
  getRevenueCatApiKey,
  getNativeStoreOfferings,
  purchaseNativePackage,
  restoreNativePurchases,
} from "@/lib/nativeStoreBilling";

export function StoreSubscriptionPaywall() {
  const { user } = useAuth();
  const store = getNativeStore();
  const apiKey = getRevenueCatApiKey(store);
  const [offering, setOffering] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform() || !apiKey) return;
    let active = true;
    setLoading(true);
    getNativeStoreOfferings(user.id)
      .then((result) => { if (active) setOffering(result); })
      .catch(() => { if (active) setOffering(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, apiKey]);

  if (!Capacitor.isNativePlatform()) return null;
  if (!apiKey) {
    return (
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" />Botvio App Subscriptions</CardTitle>
          <CardDescription>Store billing is being prepared for this app build.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Android uses Google Play Billing. iPhone uses Apple In-App Purchase. Store products and prices will be loaded directly from the relevant store.
        </CardContent>
      </Card>
    );
  }

  const packages = offering?.availablePackages || [];

  const buy = async (pkg: any) => {
    setLoading(true);
    try {
      await purchaseNativePackage(pkg, user?.id);
      toast.success("Subscription activated.");
    } catch (error: any) {
      if (!error?.userCancelled) toast.error(error?.message || "Purchase could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  const restore = async () => {
    setLoading(true);
    try {
      await restoreNativePurchases(user?.id);
      toast.success("Purchases restored.");
    } catch (error: any) {
      toast.error(error?.message || "Could not restore purchases.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Botvio Store Subscription</CardTitle>
        <CardDescription>
          {store === "android" ? "Secure checkout through Google Play" : "Secure checkout through Apple"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && !packages.length ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading store products…</div>
        ) : packages.length ? (
          packages.map((pkg: any) => (
            <div key={pkg.identifier} className="flex items-center justify-between gap-3 rounded-xl border p-4">
              <div>
                <div className="font-semibold">{pkg.product.title}</div>
                <div className="text-xs text-muted-foreground">{pkg.product.description}</div>
                <Badge variant="outline" className="mt-2">{pkg.product.priceString}</Badge>
              </div>
              <Button onClick={() => buy(pkg)} disabled={loading}>Subscribe</Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No store products are available yet. Configure the Botvio monthly subscriptions in Google Play Console and App Store Connect, then connect them to RevenueCat.</p>
        )}
        <Button variant="outline" className="w-full" onClick={restore} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />Restore Purchases
        </Button>
        <p className="text-xs text-muted-foreground text-center">Subscriptions are processed by the platform store. Prices and billing terms shown above come from the store.</p>
      </CardContent>
    </Card>
  );
}
