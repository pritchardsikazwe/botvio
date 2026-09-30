import { Capacitor } from "@capacitor/core";

export const isNativeMobile = () => Capacitor.isNativePlatform();
export const mobileAuthRedirect = () =>
  isNativeMobile() ? "botvio://auth/callback" : window.location.origin;

export const STORE_RESTRICTED_ROUTES = new Set([
  "/binary-options",
  "/deriv-options",
  "/rise-fall",
  "/sports-betting",
]);

export const isStoreBuild = () =>
  import.meta.env.VITE_STORE_BUILD === "true";

export const isRestrictedOnStore = (pathname: string) =>
  isNativeMobile() &&
  isStoreBuild() &&
  Array.from(STORE_RESTRICTED_ROUTES).some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
