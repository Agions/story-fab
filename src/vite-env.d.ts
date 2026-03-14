/// <reference types="vite/client" />

// 全局类型声明
interface Window {
  // Tauri 相关
  __TAURI__?: {
    invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
  };
}

// Logger 类型声明
declare const logger: {
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  debug: (message: string, data?: unknown) => void;
};
