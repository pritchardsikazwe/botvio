import type { CapacitorConfig } from "@capacitor/cli";

const appId = process.env.CAP_APP_ID || "live.botvio.app";
const appName = process.env.CAP_APP_NAME || "Botvio";

const config: CapacitorConfig = {
  appId,
  appName,
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 900,
      backgroundColor: "#0D0D1A",
      showSpinner: false,
    },
  },
};

export default config;
