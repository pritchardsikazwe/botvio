import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { enforceCanonicalDomain } from "./config/domain";
import { initAppUpdates, isBusy, markUpdatePending } from "./services/appUpdateService";

// Enforce canonical domain redirect before rendering
enforceCanonicalDomain();

// ── Google Analytics 4 + Google Tag Manager (opt-in via env vars) ──
// Set VITE_GA_ID (e.g. "G-XXXXXXXXXX") and/or VITE_GTM_ID (e.g. "GTM-XXXXXX")
// in your Lovable project env. Nothing loads if the IDs are absent.
(() => {
  const gaId = import.meta.env.VITE_GA_ID;
  const gtmId = import.meta.env.VITE_GTM_ID;

  if (gaId && !document.getElementById("ga4-loader")) {
    const s1 = document.createElement("script");
    s1.id = "ga4-loader";
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(s1);

    const s2 = document.createElement("script");
    s2.id = "ga4-init";
    s2.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`;
    document.head.appendChild(s2);
  }

  if (gtmId && !document.getElementById("gtm-loader")) {
    const s = document.createElement("script");
    s.id = "gtm-loader";
    s.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
    document.head.appendChild(s);

    const ns = document.createElement("noscript");
    ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.appendChild(ns);
  }
})();

// Capture install prompt globally so /install page (and any CTA) can trigger it
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

// ── PWA version-aware auto-update ──────────────────────────────────
// The full lifecycle (version.json polling, SW activation, safe reload,
// trading-operation guard) lives in src/services/appUpdateService.ts.
// Nothing here clears storage, IndexedDB or the auth session.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // A new service worker is waiting: activate it unless a trade/payment
    // is mid-flight — the update service retries once the operation ends.
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
