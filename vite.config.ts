import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

/** Build-stamped application version, e.g. 2026.07.30.1246 */
const now = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const APP_VERSION = `${now.getUTCFullYear()}.${pad(now.getUTCMonth() + 1)}.${pad(
  now.getUTCDate()
)}.${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;

/** Emits /version.json on every production build so clients can detect new deploys. */
const botvioVersionPlugin = () => ({
  name: "botvio-version-json",
  apply: "build" as const,
  closeBundle() {
    const payload = {
      version: APP_VERSION,
      build: `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`,
      updatedAt: now.toISOString(),
    };
    try {
      fs.mkdirSync(path.resolve(__dirname, "dist"), { recursive: true });
      fs.writeFileSync(
        path.resolve(__dirname, "dist/version.json"),
        JSON.stringify(payload, null, 2)
      );
    } catch {
      /* non-fatal */
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/", // Critical: ensures absolute asset paths for deep routes like /admin
  define: {
    __APP_VERSION__: JSON.stringify(mode === "development" ? "dev" : APP_VERSION),
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    botvioVersionPlugin(),
    mcpPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Botvio - AI Trading Platform",
        short_name: "Botvio",
        id: "/",
        description: "Automated trading bots for Deriv, Weltrade & Exness. Copy trading, signals & more.",
        theme_color: "#1A1A2E",
        background_color: "#0D0D1A",
        display: "standalone",
        display_override: ["standalone", "minimal-ui", "browser"],
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any"
          }
        ],
        categories: ["finance", "business", "productivity"],
        screenshots: [],
        shortcuts: [
          {
            name: "Dashboard",
            url: "/dashboard",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          },
          {
            name: "Signals",
            url: "/signals",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: ["**/version.json"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false, // we control activation via SKIP_WAITING messaging
        navigateFallbackDenylist: [/^\/sitemap\.xml$/, /^\/robots\.txt$/, /^\/version\.json$/, /^\/~oauth/],
        runtimeCaching: [
          {
            // Always network-first for the HTML shell so a new deploy is picked up.
            urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-shell",
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/version\.json$/,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
