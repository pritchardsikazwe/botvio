import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { enforceCanonicalDomain } from "./config/domain";

// Enforce canonical domain redirect before rendering
enforceCanonicalDomain();

// PWA auto-update: check for new version every 60s, auto-reload when available
const updateSW = registerSW({
  onNeedRefresh() {
    // Auto-update immediately when a new version is available
    updateSW(true);
  },
  onOfflineReady() {
    console.log("Botvio is ready to work offline");
  },
  onRegisteredSW(swUrl, r) {
    // Periodically check for updates every 60 seconds
    if (r) {
      setInterval(() => {
        r.update();
      }, 60 * 1000);
    }
  },
});

createRoot(document.getElementById("root")!).render(<App />);
