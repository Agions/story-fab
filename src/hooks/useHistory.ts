/**
 * useHistory Hook - 操作历史管理
 * 提供撤销/重做功能，支持键盘快捷键 Ctrl+Z / Ctrl+Shift+Z
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UseHistoryOptions<T> {
  /** 初始状态 */
  initialState: T;
  /** 最大历史记录数量 */
  maxHistory?: number;
  /** 是否启用键盘快捷键 */
  enableKeyboard?: boolean;
}

export interface UseHistoryReturn<T> {
  /** 当前状态 */
  state: T;
  /** 是否可以撤销 */
  canUndo: boolean;
  /** 是否可以重做 */
  canRedo: boolean;
  /** 设置状态（不记录历史，用于撤销/重做） */
  setState: (newState: T) => void;
  /** 推入新状态到历史记录 */
  push: (newState: T) => void;
  /** 撤销操作 */
  undo: () => void;
  /** 重做操作 */
  redo: () => void;
  /** 跳转到指定历史位置 */
  goTo: (index: number) => void;
  /** 清空历史记录 */
  clear: () => void;
}

/**
 * 管理操作历史的 Hook
 * @param options 配置选项
 * @returns 历史状态和操作方法
 */
export function useHistory<T>(options: UseHistoryOptions<T>): UseHistoryReturn<T> {
  const { initialState, maxHistory = 50, enableKeyboard = true } = options;

  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  // 使用 ref 追踪当前状态，避免在 undo/redo 回调中引用过期的 state
  const historyRef = useRef(history);
  historyRef.current = history;

  const { past, present, future } = history;

  /**
   * 推入新状态到历史记录
   */
  const push = useCallback((newState: T) => {
    setHistory(prev => ({
      past: [...prev.past.slice(-(maxHistory - 1)), prev.present],
      present: newState,
      future: [] // 清空 future，因为新操作会覆盖未来
    }));
  }, [maxHistory]);

  /**
   * 设置状态（不记录历史）
   */
  const setState = useCallback((newState: T) => {
    setHistory(prev => ({
      ...prev,
      present: newState
    }));
  }, []);

  /**
   * 撤销操作
   */
  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) {
        return prev;
      }

      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  /**
   * 重做操作
   */
  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) {
        return prev;
      }

      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  /**
   * 跳转到指定历史位置
   */
  const goTo = useCallback((index: number) => {
    setHistory(prev => {
      if (index < 0 || index > prev.past.length) {
        return prev;
      }

      const targetState = prev.past[index];
      const newPast = prev.past.slice(0, index);

      return {
        past: newPast,
        present: targetState,
        future: [prev.present, ...prev.past.slice(index + 1), ...prev.future]
      };
    });
  }, []);

  /**
   * 清空历史记录
   */
  const clear = useCallback(() => {
    setHistory(prev => ({
      past: [],
      present: prev.present,
      future: []
    }));
  }, []);

  // 键盘事件处理
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 撤销: Ctrl+Z (Windows/Linux) 或 Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const currentHistory = historyRef.current;
        if (currentHistory.past.length > 0) {
          // 需要通过函数方式调用 undo，以获取最新的 state
          setHistory(prev => {
            if (prev.past.length === 0) return prev;
            const previous = prev.past[prev.past.length - 1];
            const newPast = prev.past.slice(0, -1);
            return {
              past: newPast,
              present: previous,
              future: [prev.present, ...prev.future]
            };
          });
        }
      }

      // 重做: Ctrl+Shift+Z 或 Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || e.key === 'y')) {
        e.preventDefault();
        const currentHistory = historyRef.current;
        if (currentHistory.future.length > 0) {
          setHistory(prev => {
            if (prev.future.length === 0) return prev;
            const next = prev.future[0];
            const newFuture = prev.future.slice(1);
            return {
              past: [...prev.past, prev.present],
              present: next,
              future: newFuture
            };
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard]);

  return {
    state: present,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    setState,
    push,
    undo,
    redo,
    goTo,
    clear
  };
}

export default useHistory;
