/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPM_SUBDOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
