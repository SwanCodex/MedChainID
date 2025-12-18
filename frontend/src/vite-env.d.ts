/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APTOS_NETWORK: string
  readonly VITE_CONTRACT_ADDRESS: string
  readonly VITE_ISSUER_ADDRESS: string
  readonly VITE_ENCRYPTION_KEY_PREVIEW: string
  readonly VITE_GOOGLE_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
