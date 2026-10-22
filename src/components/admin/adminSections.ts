export const ADMIN_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users & access" },
  { id: "monetization", label: "Monetization" },
  { id: "signals", label: "Signals & markets" },
  { id: "robots", label: "Robots, MT5 & copy" },
  { id: "content", label: "Content Library" },
  { id: "settings", label: "Settings" },
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number]["id"];

const ANCHORS: Record<string, AdminSection> = {
  "users-panel": "users",
  "promotion-panel": "users",
  "live-users-panel": "users",
  "subscription-feature-matrix": "monetization",
  "signal-performance-panel": "signals",
  "tradecopy-panel": "robots",
  "analytics-panel": "overview",
  "visitors-panel": "overview",
};

export const sectionForAnchor = (id: string): AdminSection => ANCHORS[id] ?? "overview";
