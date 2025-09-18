/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_TOC_BASE_URL?: string;
  readonly VITE_TOC_PROXY_URL?: string;
  readonly VITE_TOC_PLATFORM_ID?: string;
  readonly VITE_TOC_PLATAFORMA_ID?: string;
  readonly VITE_PLATAFORMA_ID?: string;
  readonly VITE_TOC_PING_INTERVAL_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
