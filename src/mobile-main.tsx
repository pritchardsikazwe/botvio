import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { startMobileDeepLinkHandling } from "./services/mobileDeepLink";

void startMobileDeepLinkHandling();

createRoot(document.getElementById("root")!).render(<App />);
