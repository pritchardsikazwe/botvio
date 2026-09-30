import { Capacitor } from "@capacitor/core";

export const isNativeMobile = () => Capacitor.isNativePlatform();
export const mobileAuthRedirect = () =>
  isNativeMobile() ? "botvio://auth/callback" : window.location.origin;

export const STORE_RESTRICTED_ROUTES = new Set([
  "/binary-options", "/deriv-options", "/rise-fall", "/sports-betting",
  "/weltrade-trade", "/deriv-app", "/connections", "/bridge-request", "/accounts",
  "/copy-trading", "/providers", "/provider-dashboard", "/botvio-robot", "/bots",
  "/auto-trade", "/auto", "/trading", "/trade-modes",
  "/bots/binance", "/binance", "/settings/binance",
  "/billing", "/marketplace", "/my-products",
]);

export const STORE_FREE_ROUTES = new Set([
  "/", "/dashboard", "/signals", "/signals/history", "/signals-history", "/track-record",
  "/market-analysis", "/learn", "/learning-paths", "/research", "/blog",
  "/markets", "/global-markets", "/news-calendar", "/live", "/tools", "/brokers",
  "/about", "/contact", "/terms", "/privacy", "/disclaimer", "/affiliate-disclosure",
  "/ai-content-policy", "/methodology", "/performance-transparency", "/trust",
  "/faq", "/docs", "/whitepaper", "/case-studies", "/press",
  "/account/delete", "/settings", "/unsubscribe",
]);

export const isStoreBuild = () => import.meta.env.VITE_STORE_BUILD === "true";

const matchesRoute = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(route + "/");

export const isRestrictedOnStore = (pathname: string) =>
  isNativeMobile() &&
  isStoreBuild() &&
  Array.from(STORE_RESTRICTED_ROUTES).some((route) => matchesRoute(pathname, route));

export const isFreeOnStore = (pathname: string) =>
  isNativeMobile() &&
  isStoreBuild() &&
  Array.from(STORE_FREE_ROUTES).some((route) => matchesRoute(pathname, route));
