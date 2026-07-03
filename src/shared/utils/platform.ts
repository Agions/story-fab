/**
 * Platform detection utilities.
 */

/**
 * Returns true when running inside the Tauri desktop environment.
 */
export function isTauriEnv(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
