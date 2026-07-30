/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Injected at build time by vite.config.ts (see botvioVersionPlugin). */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_DERIV_APP_ID?: string;
  /** Dev-only convenience; prefer user input in UI */
  readonly VITE_DERIV_API_TOKEN?: string;
  /** Google Analytics 4 measurement ID (e.g. G-XXXXXXXXXX). Optional. */
  readonly VITE_GA_ID?: string;
  /** Google Tag Manager container ID (e.g. GTM-XXXXXX). Optional. */
  readonly VITE_GTM_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
