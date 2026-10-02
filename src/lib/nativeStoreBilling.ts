import { Capacitor } from "@capacitor/core";

export type NativeStore = "android" | "ios" | null;

const ANDROID_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as string | undefined;
const IOS_KEY = import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string | undefined;

export const PREMIUM_ENTITLEMENT = "premium_signals";
export const VIP_ENTITLEMENT = "vip_signals";

export function getNativeStore(): NativeStore {
  if (!Capacitor.isNativePlatform()) return null;
  const platform = Capacitor.getPlatform();
  return platform === "android" || platform === "ios" ? platform : null;
}

export function getRevenueCatApiKey(store: NativeStore): string | null {
  if (store === "android") return ANDROID_KEY || null;
  if (store === "ios") return IOS_KEY || null;
  return null;
}

export async function configureNativeStoreBilling(userId?: string): Promise<boolean> {
  const store = getNativeStore();
  const apiKey = getRevenueCatApiKey(store);
  if (!store || !apiKey) return false;

  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const configured = await Purchases.isConfigured();
  if (!configured.isConfigured) {
    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });
  } else if (userId) {
    const current = await Purchases.getAppUserID();
    if (current.appUserID !== userId) {
      await Purchases.logIn({ appUserID: userId });
    }
  }
  return true;
}

export async function getNativeStoreCustomerInfo(userId?: string) {
  const configured = await configureNativeStoreBilling(userId);
  if (!configured) return null;
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const result = await Purchases.getCustomerInfo();
  return result.customerInfo;
}

export async function getNativeStoreOfferings(userId?: string) {
  const configured = await configureNativeStoreBilling(userId);
  if (!configured) return null;
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  return (await Purchases.getOfferings()).current;
}

export async function purchaseNativePackage(aPackage: unknown, userId?: string) {
  const configured = await configureNativeStoreBilling(userId);
  if (!configured) throw new Error("Native store billing is not configured yet.");
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  return Purchases.purchasePackage({ aPackage: aPackage as any });
}

export async function restoreNativePurchases(userId?: string) {
  const configured = await configureNativeStoreBilling(userId);
  if (!configured) throw new Error("Native store billing is not configured yet.");
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  return Purchases.restorePurchases();
}

export function hasNativeEntitlement(customerInfo: any, entitlement: string): boolean {
  return Boolean(customerInfo?.entitlements?.active?.[entitlement]);
}
