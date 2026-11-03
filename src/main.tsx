import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { enforceCanonicalDomain } from "./config/domain";
import { initAppUpdates, isBusy, markUpdatePending } from "./services/appUpdateService";

enforceCanonicalDomain();

const CONSENT_KEY = "botvio:cookie-consent:v1";
const CONSENT_EVENT = "botvio:cookie-consent-updated";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

function hasAcceptedAnalyticsCookies() {
  try {
    return JSON.parse(localStorage.getItem(CONSENT_KEY) || "null")?.value === "accepted";
  } catch {
    return false;
  }
}

// Optional analytics/advertising tags are not requested until consent is given.
function loadConsentTags() {
  if (!hasAcceptedAnalyticsCookies()) return;

  const gaId = import.meta.env.VITE_GA_ID;
  const gtmId = import.meta.env.VITE_GTM_ID;

  if (gaId && !document.getElementById("ga4-loader")) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer!.push(args as unknown as Record<string, unknown>);
    };
    window.gtag("js", new Date());
    // SPA pageviews are sent by AnalyticsTracker after each route transition.
    window.gtag("config", gaId, { anonymize_ip: true, send_page_view: false });

    const loader = document.createElement("script");
    loader.id = "ga4-loader";
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(loader);
  }

  if (gtmId && !document.getElementById("gtm-loader")) {
    window.dataLayer = window.dataLayer || [];
    const loader = document.createElement("script");
    loader.id = "gtm-loader";
    loader.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
    document.head.appendChild(loader);
  }

  const adsenseId = "ca-pub-8741937856196827";
  if (!document.getElementById("adsense-loader")) {
    const adsense = document.createElement("script");
    adsense.id = "adsense-loader";
    adsense.async = true;
    adsense.crossOrigin = "anonymous";
    adsense.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`;
    document.head.appendChild(adsense);
  }
}

loadConsentTags();
window.addEventListener(CONSENT_EVENT, (event) => {
  if ((event as CustomEvent<{ value?: string }>).detail?.value === "accepted") loadConsentTags();
});

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }
}
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as any).__deferredPwaPrompt = e;
  window.dispatchEvent(new CustomEvent("pwa-installable"));
});
window.addEventListener("appinstalled", () => {
  (window as any).__deferredPwaPrompt = null;
  window.dispatchEvent(new CustomEvent("pwa-installed"));
});

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (isBusy()) {
      markUpdatePending(() => updateSW(true));
      return;
    }
    updateSW(true);
  },
  onOfflineReady() {
    console.log("Botvio is ready to work offline");
  },
  onRegisteredSW(_swUrl, r) {
    if (r) r.update().catch(() => {});
  },
});

initAppUpdates();
createRoot(document.getElementById("root")!).render(<App />);
