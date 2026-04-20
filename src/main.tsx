import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { enforceCanonicalDomain } from "./config/domain";

// Enforce canonical domain redirect before rendering
enforceCanonicalDomain();

// PWA auto-update: aggressively check for new versions and force reload
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // New version available — apply update and hard reload immediately
    updateSW(true);
    // Belt-and-suspenders: force a reload shortly after activation
    setTimeout(() => {
      window.location.reload();
    }, 800);
  },
  onOfflineReady() {
    console.log("Botvio is ready to work offline");
  },
  onRegisteredSW(swUrl, r) {
    if (r) {
      // Check immediately on load
      r.update().catch(() => {});
      // Then poll every 30 seconds for new versions
      setInterval(() => {
        r.update().catch(() => {});
      }, 30 * 1000);
    }
  },
});

// When the active service worker changes (new version takes control), reload once
if ("serviceWorker" in navigator) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  // Also re-check for updates whenever the tab becomes visible again
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      navigator.serviceWorker.getRegistration().then((reg) => reg?.update().catch(() => {}));
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
