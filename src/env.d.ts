/// <reference types="vite/client" />

declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_OPENAI_API_KEY: string;
    readonly VITE_ANTHROPIC_API_KEY: string;
  }
} 