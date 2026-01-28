/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DERIV_APP_ID?: string;
  /** Dev-only convenience; prefer user input in UI */
  readonly VITE_DERIV_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
