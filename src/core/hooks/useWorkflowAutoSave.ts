/**
 * 自动保存 Hook
 * 支持工作流状态自动保存和恢复
 */

import { useEffect, useCallback, useRef } from 'react';
import { WorkflowState, WorkflowStep } from '../services/workflow/types';
import { WorkflowPersistenceService } from '../services/workflow/persistence';

export interface UseAutoSaveOptions {
  /** 项目ID */
  projectId: string;
  /** 当前状态 */
  state: WorkflowState;
  /** 是否启用自动保存 */
  enabled?: boolean;
  /** 保存间隔(毫秒) */
  interval?: number;
  /** 保存前的回调 */
  onBeforeSave?: () => void;
  /** 恢复时的回调 */
  onRestore?: (state: WorkflowState) => void;
}

export interface UseAutoSaveReturn {
  /** 是否正在恢复 */
  isRestoring: boolean;
  /** 是否有可恢复的数据 */
  hasRecoverable: boolean;
  /** 恢复信息 */
  recoveryInfo: {
    step: WorkflowStep;
    progress: number;
    hasError: boolean;
  } | null;
  /** 手动保存 */
  save: () => void;
  /** 清除保存的数据 */
  clear: () => void;
  /** 恢复到指定步骤 */
  recover: () => void;
}

/**
 * 工作流自动保存 Hook
 */
export function useWorkflowAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const {
    projectId,
    state,
    enabled = true,
    interval = 30000, // 默认30秒
    onBeforeSave,
    onRestore,
  } = options;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // 检查是否有可恢复的数据
  const hasRecoverable = WorkflowPersistenceService.hasRecoverableWorkflow(projectId);
  const recoveryInfo = WorkflowPersistenceService.getRecoveryInfo(projectId);

  // 保存状态
  const save = useCallback(() => {
    if (!projectId || !state) return;

    onBeforeSave?.();
    WorkflowPersistenceService.saveState(projectId, state);
    lastSavedRef.current = JSON.stringify(state);
  }, [projectId, state, onBeforeSave]);

  // 恢复状态
  const recover = useCallback(() => {
    if (!projectId) return;

    const savedState = WorkflowPersistenceService.loadState(projectId);
    if (savedState) {
      onRestore?.(savedState);
    }
  }, [projectId, onRestore]);

  // 清除保存的数据
  const clear = useCallback(() => {
    if (!projectId) return;
    WorkflowPersistenceService.removeState(projectId);
  }, [projectId]);

  // 自动保存
  useEffect(() => {
    if (!enabled || !projectId) return;

    const stateString = JSON.stringify(state);
    
    // 如果状态有变化，则保存
    if (stateString !== lastSavedRef.current) {
      timerRef.current = setTimeout(() => {
        save();
      }, 1000); // 防抖 1秒
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [state, enabled, projectId, save]);

  // 定期保存
  useEffect(() => {
    if (!enabled || !projectId) return;

    timerRef.current = setInterval(() => {
      save();
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, projectId, interval, save]);

  // 离开页面时保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      save();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      save(); // 离开时保存
    };
  }, [save]);

  return {
    isRestoring: false,
    hasRecoverable,
    recoveryInfo,
    save,
    clear,
    recover,
  };
}

export default useWorkflowAutoSave;
