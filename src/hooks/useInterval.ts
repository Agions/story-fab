/**
 * useInterval - 统一管理 setInterval 的 Hook
 * 解决多个组件重复实现 setInterval 清理逻辑的问题
 * 自动在组件卸载时清理所有注册的 interval
 */
import { useRef, useEffect, useCallback } from 'react';

export interface UseIntervalReturn {
  /** 设置一个带自动清理的 setInterval，返回 interval id */
  set: (fn: () => void, delay: number) => ReturnType<typeof setInterval>;
  /** 清除特定的 interval */
  clear: (id: ReturnType<typeof setInterval>) => void;
  /** 返回 Promise 的 setInterval 包装器（用于需要等待的场合） */
  delay: (ms: number) => Promise<void>;
}

/**
 * useInterval Hook
 * 
 * @example
 * ```tsx
 * const interval = useInterval();
 * 
 * // 使用 set 方法
 * interval.set(() => doSomething(), 1000);
 * 
 * // 使用 clear 方法
 * interval.clear(id);
 * 
 * // 组件卸载时自动清理所有 interval
 * ```
 */
export function useInterval(): UseIntervalReturn {
  const intervalIdsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  // 组件卸载时清理所有 interval
  useEffect(() => {
    return () => {
      intervalIdsRef.current.forEach(id => clearInterval(id));
      intervalIdsRef.current = [];
    };
  }, []);

  const set = useCallback((fn: () => void, delay: number) => {
    const id = setInterval(fn, delay);
    intervalIdsRef.current.push(id);
    return id;
  }, []);

  const clear = useCallback((id: ReturnType<typeof setInterval>) => {
    clearInterval(id);
    intervalIdsRef.current = intervalIdsRef.current.filter(iid => iid !== id);
  }, []);

  const delay = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => {
      const id = setInterval(resolve, ms);
      intervalIdsRef.current.push(id);
    });
  }, []);

  return { set, clear, delay };
}
