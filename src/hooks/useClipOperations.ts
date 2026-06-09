/**
 * 片段操作 Hook
 * 职责：编辑器片段的增删改查操作
 *
 * 重构说明：
 * - 从原 useEditorState.ts (451行) 中提取片段操作逻辑
 * - 职责单一：只负责片段操作
 * - 通过 editorService 分发 action
 */

import { useCallback } from 'react';
import type { TimelineClip, TextItem, AudioClip } from '@/core/services/editor';

// ============================================
// Hook 返回值
// ============================================

export interface UseClipOperationsResult {
  addClip: (trackId: string, clip: TimelineClip, position: number) => void;
  removeClip: (trackId: string, clipId: string) => void;
  moveClip: (trackId: string, clipId: string, newPosition: number) => void;
  copyClip: (clipId: string) => void;
  trimClip: (clipId: string, startTime: number, endTime: number) => void;
  splitClip: (clipId: string, splitTime: number) => void;
  addTransition: (fromClipId: string, toClipId: string, type: string, duration: number) => void;
  addEffect: (clipId: string, effect: string, params: Record<string, unknown>) => void;
  addText: (trackId: string, text: TextItem, position: number) => void;
  addAudio: (trackId: string, audio: AudioClip, position: number) => void;
}

// ============================================
// Hook 参数
// ============================================

export interface UseClipOperationsParams {
  /** 分发 action 到 editor service */
  dispatch: (action: any) => void;
}

// ============================================
// 片段操作 Hook
// ============================================

/**
 * 片段操作 Hook
 * @param params Hook 参数
 * @returns 片段操作方法
 */
export function useClipOperations(params: UseClipOperationsParams): UseClipOperationsResult {
  const { dispatch } = params;

  const addClip = useCallback(
    (trackId: string, clip: TimelineClip, position: number) => {
      dispatch({ type: 'ADD_CLIP', trackId, clip, position });
    },
    [dispatch]
  );

  const removeClip = useCallback(
    (trackId: string, clipId: string) => {
      dispatch({ type: 'REMOVE_CLIP', trackId, clipId });
    },
    [dispatch]
  );

  const moveClip = useCallback(
    (trackId: string, clipId: string, newPosition: number) => {
      dispatch({ type: 'MOVE_CLIP', trackId, clipId, newPosition });
    },
    [dispatch]
  );

  const copyClip = useCallback(
    (clipId: string) => {
      dispatch({ type: 'COPY_CLIP', clipId });
    },
    [dispatch]
  );

  const trimClip = useCallback(
    (clipId: string, startTime: number, endTime: number) => {
      dispatch({
        type: 'TRIM_CLIP',
        clipId,
        startMs: startTime,
        endMs: endTime,
      });
    },
    [dispatch]
  );

  const splitClip = useCallback(
    (clipId: string, splitTime: number) => {
      dispatch({ type: 'SPLIT_CLIP', clipId, splitMs: splitTime });
    },
    [dispatch]
  );

  const addTransition = useCallback(
    (fromClipId: string, toClipId: string, transitionType: string, duration: number) => {
      dispatch({
        type: 'ADD_TRANSITION',
        fromClipId,
        toClipId,
        transitionType,
        duration,
      });
    },
    [dispatch]
  );

  const addEffect = useCallback(
    (clipId: string, effect: string, params: Record<string, unknown>) => {
      dispatch({ type: 'ADD_EFFECT', clipId, effect, params });
    },
    [dispatch]
  );

  const addText = useCallback(
    (trackId: string, text: TextItem, position: number) => {
      dispatch({ type: 'ADD_TEXT', trackId, text, position });
    },
    [dispatch]
  );

  const addAudio = useCallback(
    (trackId: string, audio: AudioClip, position: number) => {
      dispatch({ type: 'ADD_AUDIO', trackId, audio, position });
    },
    [dispatch]
  );

  return {
    addClip,
    removeClip,
    moveClip,
    copyClip,
    trimClip,
    splitClip,
    addTransition,
    addEffect,
    addText,
    addAudio,
  };
}
