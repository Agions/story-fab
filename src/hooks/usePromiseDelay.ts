/**
 * usePromiseDelay - 返回 Promise 的 setTimeout 包装器
 * 统一管理 setTimeout id，支持组件卸载时自动清理
 * 
 * @example
 * ```tsx
 * const { delay } = usePromiseDelay();
 * await delay(1000); // 等待 1 秒
 * ```
 */
import { useRef, useEffect, useCallback } from 'react';

export interface UsePromiseDelayReturn {
  /** 返回 Promise 的 setTimeout 包装器 */
  delay: (ms: number) => Promise<void>;
  /** 清除所有待执行的 timeout */
  clearAll: () => void;
}

export function usePromiseDelay(): UsePromiseDelayReturn {
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 组件卸载时清理所有 timeout
  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach(id => clearTimeout(id));
      timeoutIdsRef.current = [];
    };
  }, []);

  const delay = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => {
      const id = setTimeout(resolve, ms);
      timeoutIdsRef.current.push(id);
    });
  }, []);

  const clearAll = useCallback(() => {
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current = [];
  }, []);

  return { delay, clearAll };
}
