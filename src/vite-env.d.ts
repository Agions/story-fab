/// <reference types="vite/client" />

// 全局类型声明
interface Window {
  // Tauri 相关
  __TAURI__?: {
    invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
  };
}
