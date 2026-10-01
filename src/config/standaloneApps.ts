export type StandaloneAppId = "gold-robot" | "crypto-robot" | "synthetic-robot" | "weltrade-robot" | "deriv-copy";

export interface StandaloneAppDefinition {
  id: StandaloneAppId;
  name: string;
  shortName: string;
  description: string;
  path: string;
  hostnames: string[];
  accent: string;
  icon: string;
  destination: string;
  nativeAppId: string;
  nativeAppName: string;
}

export const STANDALONE_APPS: StandaloneAppDefinition[] = [
  {
    id: "gold-robot",
    name: "Botvio Gold Robot",
    shortName: "Gold Robot",
    description: "Gold/XAUUSD AI signals, analysis and MT5 automation.",
    path: "/apps/gold-robot",
    hostnames: ["gold.botvio.live"],
    accent: "text-primary",
    icon: "🥇",
    destination: "/gold",
    nativeAppId: "live.botvio.gold",
    nativeAppName: "Botvio Gold Robot",
  },
  {
    id: "crypto-robot",
    name: "Botvio Crypto Robot",
    shortName: "Crypto Robot",
    description: "Crypto AI signals and automated trading workflows.",
    path: "/apps/crypto-robot",
    hostnames: ["crypto.botvio.live"],
    accent: "text-warning",
    icon: "₿",
    destination: "/binance",
    nativeAppId: "live.botvio.crypto",
    nativeAppName: "Botvio Crypto Robot",
  },
  {
    id: "synthetic-robot",
    name: "Botvio Synthetic Robot",
    shortName: "Synthetic Robot",
    description: "Deriv Boom, Crash, Volatility and Step automation.",
    path: "/apps/synthetic-robot",
    hostnames: ["synthetic.botvio.live"],
    accent: "text-success",
    icon: "⚡",
    destination: "/synthetic-hub",
    nativeAppId: "live.botvio.synthetic",
    nativeAppName: "Botvio Synthetic Robot",
  },
  {
    id: "weltrade-robot",
    name: "Botvio Weltrade Robot",
    shortName: "Weltrade Robot",
    description: "SyntX signals, charts and MT5 Bridge automation.",
    path: "/apps/weltrade-robot",
    hostnames: ["weltrade.botvio.live"],
    accent: "text-warning",
    icon: "📈",
    destination: "/weltrade",
    nativeAppId: "live.botvio.weltrade",
    nativeAppName: "Botvio Weltrade Robot",
  },
  {
    id: "deriv-copy",
    name: "Botvio Deriv Copy Trading",
    shortName: "Deriv Copy Trading",
    description: "Follow providers and manage your Deriv copy-trading account.",
    path: "/apps/deriv-copy",
    hostnames: ["copy.botvio.live"],
    accent: "text-primary",
    icon: "🔁",
    destination: "/copy-trading",
    nativeAppId: "live.botvio.copy",
    nativeAppName: "Botvio Deriv Copy Trading",
  },
];

export const getStandaloneApp = (id?: string | null) =>
  STANDALONE_APPS.find((app) => app.id === id) ?? null;

export const getStandaloneAppFromHost = (hostname: string) =>
  STANDALONE_APPS.find((app) => app.hostnames.includes(hostname.toLowerCase())) ?? null;

export const getStandaloneAppFromEnv = () =>
  getStandaloneApp(import.meta.env.VITE_STANDALONE_APP_ID);
