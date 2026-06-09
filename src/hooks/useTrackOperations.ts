/**
 * 轨道操作 Hook
 * 职责：编辑器轨道的增删改查操作
 *
 * 重构说明：
 * - 从原 useEditorState.ts (451行) 中提取轨道操作逻辑
 * - 职责单一：只负责轨道管理
 * - 通过 editorService 分发 action
 */

import { useCallback } from 'react';

// ============================================
// Hook 返回值
// ============================================

export interface UseTrackOperationsResult {
  createTrack: (type: 'video' | 'audio' | 'text' | 'effect') => string;
  deleteTrack: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
}

// ============================================
// Hook 参数
// ============================================

export interface UseTrackOperationsParams {
  /** 创建轨道 */
  createTrackFn: (type: 'video' | 'audio' | 'text' | 'effect') => string;
  /** 删除轨道 */
  deleteTrackFn?: (trackId: string) => void;
  /** 切换可见性 */
  onToggleVisibility: (trackId: string) => void;
  /** 切换锁定 */
  onToggleLock: (trackId: string) => void;
}

// ============================================
// 轨道操作 Hook
// ============================================

/**
 * 轨道操作 Hook
 * @param params Hook 参数
 * @returns 轨道操作方法
 */
export function useTrackOperations(params: UseTrackOperationsParams): UseTrackOperationsResult {
  const { createTrackFn, deleteTrackFn, onToggleVisibility, onToggleLock } = params;

  const createTrack = useCallback(
    (type: 'video' | 'audio' | 'text' | 'effect') => {
      return createTrackFn(type);
    },
    [createTrackFn]
  );

  const deleteTrack = useCallback(
    (trackId: string) => {
      if (deleteTrackFn) {
        deleteTrackFn(trackId);
      } else {
        console.debug('[Editor] 删除轨道:', { trackId });
      }
    },
    [deleteTrackFn]
  );

  const toggleTrackVisibility = useCallback(
    (trackId: string) => {
      onToggleVisibility(trackId);
    },
    [onToggleVisibility]
  );

  const toggleTrackLock = useCallback(
    (trackId: string) => {
      onToggleLock(trackId);
    },
    [onToggleLock]
  );

  return {
    createTrack,
    deleteTrack,
    toggleTrackVisibility,
    toggleTrackLock,
  };
}
