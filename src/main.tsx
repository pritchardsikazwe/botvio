import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { enforceCanonicalDomain } from "./config/domain";

// Enforce canonical domain redirect before rendering
enforceCanonicalDomain();

createRoot(document.getElementById("root")!).render(<App />);
