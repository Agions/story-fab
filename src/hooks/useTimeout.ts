/**
 * useTimeout - 统一管理 setTimeout 的 Hook
 * 解决多个组件重复实现 setTimeout 清理逻辑的问题
 * 自动在组件卸载时清理所有注册的 timeout
 */
import { useRef, useEffect, useCallback } from 'react';

export interface UseTimeoutReturn {
  /** 设置一个带自动清理的 setTimeout，返回 timeout id */
  set: (fn: () => void, delay: number) => ReturnType<typeof setTimeout>;
  /** 清除特定的 timeout */
  clear: (id: ReturnType<typeof setTimeout>) => void;
  /** 返回 Promise 的 setTimeout 包装器 */
  delay: (ms: number) => Promise<void>;
}

/**
 * useTimeout Hook
 * 
 * @example
 * ```tsx
 * const timeout = useTimeout();
 * 
 * // 使用 set 方法
 * timeout.set(() => doSomething(), 1000);
 * 
 * // 使用 delay 方法 (返回 Promise)
 * await timeout.delay(2000);
 * 
 * // 组件卸载时自动清理所有 timeout
 * ```
 */
export function useTimeout(): UseTimeoutReturn {
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 组件卸载时清理所有 timeout
  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach(id => clearTimeout(id));
      timeoutIdsRef.current = [];
    };
  }, []);

  const set = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timeoutIdsRef.current.push(id);
    return id;
  }, []);

  const clear = useCallback((id: ReturnType<typeof setTimeout>) => {
    clearTimeout(id);
    timeoutIdsRef.current = timeoutIdsRef.current.filter(tid => tid !== id);
  }, []);

  const delay = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => {
      const id = setTimeout(resolve, ms);
      timeoutIdsRef.current.push(id);
    });
  }, []);

  return { set, clear, delay };
}
