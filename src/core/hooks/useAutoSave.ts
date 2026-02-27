/**
 * useAutoSave Hook - 自动保存功能
 * 实现每 30 秒自动保存编辑器内容
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { message } from 'antd';

// 自动保存配置
export interface AutoSaveConfig {
  interval?: number; // 保存间隔（毫秒），默认 30000ms (30秒)
  enabled?: boolean; // 是否启用自动保存
  onSave?: () => void; // 保存时的回调
  onError?: (error: Error) => void; // 保存失败时的回调
}

// 自动保存状态
export interface AutoSaveState {
  isSaving: boolean; // 是否正在保存
  lastSavedTime: number | null; // 上次保存时间
  lastSavedDate: string | null; // 上次保存日期（格式化）
  autoSaveEnabled: boolean; // 自动保存是否启用
}

// 自动保存 Hook
export function useAutoSave(config: AutoSaveConfig = {}): {
  state: AutoSaveState;
  saveNow: () => void;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
} {
  const {
    interval = 30000, // 默认 30 秒
    enabled = true,
    onSave,
    onError
  } = config;

  // 状态
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSavedTime: null,
    lastSavedDate: null,
    autoSaveEnabled: enabled
  });

  // 保存函数引用（通过 ref 获取最新的保存函数）
  const saveRef = useRef<() => void>(() => {});
  const enabledRef = useRef(enabled);

  // 更新 enabled 引用
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // 格式化日期
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // 执行保存
  const performSave = useCallback(async () => {
    if (state.isSaving) return;

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      // 调用保存函数
      saveRef.current();

      const now = Date.now();
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSavedTime: now,
        lastSavedDate: formatDate(now)
      }));

      // 调用保存成功回调
      if (onSave) {
        onSave();
      }
    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false }));

      // 调用错误回调
      if (onError && error instanceof Error) {
        onError(error);
      }
      console.error('自动保存失败:', error);
    }
  }, [state.isSaving, onSave, onError]);

  // 立即保存
  const saveNow = useCallback(() => {
    performSave();
  }, [performSave]);

  // 启用自动保存
  const enableAutoSave = useCallback(() => {
    setState(prev => ({ ...prev, autoSaveEnabled: true }));
  }, []);

  // 禁用自动保存
  const disableAutoSave = useCallback(() => {
    setState(prev => ({ ...prev, autoSaveEnabled: false }));
  }, []);

  // 设置自动保存定时器
  useEffect(() => {
    if (!state.autoSaveEnabled) return;

    const timer = setInterval(() => {
      if (enabledRef.current) {
        performSave();
      }
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [interval, state.autoSaveEnabled, performSave]);

  // 返回状态和操作
  return {
    state,
    saveNow,
    enableAutoSave,
    disableAutoSave
  };
}

// 设置保存函数的辅助 Hook
export function useAutoSaveRegister(saveFn: () => void): void {
  const saveRef = useRef(saveFn);
  saveRef.current = saveFn;
}

export default useAutoSave;
