/**
 * 剪辑工作流 Hook
 * 整合所有剪辑功能，提供统一的剪辑工作流
 *
 * 重构说明：
 * - 原 451 行单体 Hook 已重构为多个独立 Hook 组合
 * - usePlaybackControl: 播放控制
 * - useClipOperations: 片段操作
 * - useTrackOperations: 轨道操作
 * - 本文件作为编排器，整合各子 Hook
 * - 保持原有 API 兼容性
 */

import { useState, useCallback, useEffect } from 'react';
import { delay } from '@/shared';
import {
  editorService,
  saveToStorage,
  type EditorConfig,
  type EditorExportSettings,
  type Timeline,
  type TimelineClip,
  type TextItem,
  type AudioClip,
  type VideoSegment,
  type ScriptSegment,
} from '@/core/services/editor';

// 导入拆分后的子 Hook
import { usePlaybackControl } from './usePlaybackControl';
import { useClipOperations } from './useClipOperations';
import { useTrackOperations } from './useTrackOperations';

// ============================================
// 类型定义（保持向后兼容）
// ============================================

export interface EditorState {
  timeline: Timeline | null;
  isLoading: boolean;
  isPlaying: boolean;
  currentTime: number;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  exportProgress: number;
  isExporting: boolean;
}

export interface EditorOperations {
  // 播放控制
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;

  // 片段操作
  addClip: (trackId: string, clip: TimelineClip, position: number) => void;
  removeClip: (trackId: string, clipId: string) => void;
  moveClip: (trackId: string, clipId: string, newPosition: number) => void;
  copyClip: (clipId: string) => void;
  trimClip: (clipId: string, startTime: number, endTime: number) => void;
  splitClip: (clipId: string, splitTime: number) => void;

  // 效果操作
  addTransition: (fromClipId: string, toClipId: string, type: string, duration: number) => void;
  addEffect: (clipId: string, effect: string, params: Record<string, unknown>) => void;
  addText: (trackId: string, text: TextItem, position: number) => void;
  addAudio: (trackId: string, audio: AudioClip, position: number) => void;

  // 轨道操作
  createTrack: (type: 'video' | 'audio' | 'text' | 'effect') => string;
  deleteTrack: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;

  // 历史操作
  undo: () => void;
  redo: () => void;

  // 选择操作
  selectClip: (clipId: string | null) => void;
  selectTrack: (trackId: string | null) => void;

  // 缩放操作
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (zoom: number) => void;

  // 工作流操作
  generateFromScript: (scriptSegments: ScriptSegment[], videoSegments: VideoSegment[]) => void;
  exportVideo: (settings?: Partial<EditorExportSettings>) => Promise<Blob>;
  getExportPreview: () => { duration: number; resolution: string; estimatedSize: string };

  // 项目操作
  saveProject: () => void;
  loadProject: () => boolean;
  clearProject: () => void;
}

// ============================================
// 主 Hook
// ============================================

/**
 * 剪辑 Hook（编排器）
 */
export function useEditor(_config?: Partial<EditorConfig>): {
  state: EditorState;
  operations: EditorOperations;
} {
  // 状态
  const [state, setState] = useState<EditorState>({
    timeline: null,
    isLoading: false,
    isPlaying: false,
    currentTime: 0,
    selectedClipId: null,
    selectedTrackId: null,
    zoom: 1,
    canUndo: false,
    canRedo: false,
    exportProgress: 0,
    isExporting: false,
  });

  // 初始化订阅
  useEffect(() => {
    const unsubscribe = editorService.subscribe((timeline) => {
      setState((prev) => ({
        ...prev,
        timeline,
        canUndo: editorService.canUndo(),
        canRedo: editorService.canRedo(),
      }));
    });

    editorService.loadFromStorage();

    return () => {
      unsubscribe();
    };
  }, []);

  // 状态更新辅助函数
  const updateState = useCallback((updates: Partial<EditorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 播放控制（委托给 usePlaybackControl）
  const playback = usePlaybackControl({
    timeline: state.timeline,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    onStateChange: (updates) => {
      updateState(updates);
    },
  });

  // 清理播放资源
  useEffect(() => {
    return () => {
      playback.cleanup();
    };
  }, [playback]);

  // 片段操作（委托给 useClipOperations）
  const clipOps = useClipOperations({
    dispatch: (action) => editorService.dispatch(action),
  });

  // 轨道操作（委托给 useTrackOperations）
  const trackOps = useTrackOperations({
    createTrackFn: (type) => editorService.createTrack(type),
    onToggleVisibility: (trackId) => {
      setState((prev) => ({
        ...prev,
        timeline: prev.timeline
          ? {
              ...prev.timeline,
              videoTracks: prev.timeline.videoTracks.map((track) =>
                track.id === trackId ? { ...track, visible: !track.visible } : track
              ),
            }
          : null,
      }));
    },
    onToggleLock: (trackId) => {
      setState((prev) => ({
        ...prev,
        timeline: prev.timeline
          ? {
              ...prev.timeline,
              videoTracks: prev.timeline.videoTracks.map((track) =>
                track.id === trackId ? { ...track, locked: !track.locked } : track
              ),
            }
          : null,
      }));
    },
  });

  // 历史操作
  const undo = useCallback(() => editorService.undo(), []);
  const redo = useCallback(() => editorService.redo(), []);

  // 选择操作
  const selectClip = useCallback((clipId: string | null) => {
    updateState({ selectedClipId: clipId });
  }, [updateState]);

  const selectTrack = useCallback((trackId: string | null) => {
    updateState({ selectedTrackId: trackId });
  }, [updateState]);

  // 缩放操作
  const zoomIn = useCallback(() => {
    updateState({ zoom: Math.min(state.zoom * 1.2, 5) });
  }, [state.zoom, updateState]);

  const zoomOut = useCallback(() => {
    updateState({ zoom: Math.max(state.zoom / 1.2, 0.2) });
  }, [state.zoom, updateState]);

  const setZoom = useCallback(
    (zoom: number) => {
      updateState({ zoom: Math.max(0.2, Math.min(zoom, 5)) });
    },
    [updateState]
  );

  // 工作流操作
  const generateFromScript = useCallback(
    (scriptSegments: ScriptSegment[], videoSegments: VideoSegment[]) => {
      editorService.generateTimelineFromScript(scriptSegments, videoSegments);
    },
    []
  );

  const exportVideo = useCallback(
    async (settings?: Partial<EditorExportSettings>): Promise<Blob> => {
      updateState({ isExporting: true, exportProgress: 0 });

      try {
        // 模拟导出进度
        for (let i = 0; i <= 100; i += 10) {
          await delay(200);
          updateState({ exportProgress: i });
        }

        const blob = await editorService.exportTimeline(settings);
        return blob;
      } finally {
        updateState({ isExporting: false, exportProgress: 100 });
      }
    },
    [updateState]
  );

  const getExportPreview = useCallback(() => {
    return editorService.getExportPreview();
  }, []);

  // 项目操作
  const saveProject = useCallback(() => {
    saveToStorage(editorService.getTimeline());
  }, []);

  const loadProject = useCallback(() => {
    return editorService.loadFromStorage();
  }, []);

  const clearProject = useCallback(() => {
    editorService.clear();
    updateState({
      currentTime: 0,
      selectedClipId: null,
      selectedTrackId: null,
    });
  }, [updateState]);

  return {
    state,
    operations: {
      play: playback.play,
      pause: playback.pause,
      seek: playback.seek,
      setPlaybackRate: playback.setPlaybackRate,
      addClip: clipOps.addClip,
      removeClip: clipOps.removeClip,
      moveClip: clipOps.moveClip,
      copyClip: clipOps.copyClip,
      trimClip: clipOps.trimClip,
      splitClip: clipOps.splitClip,
      addTransition: clipOps.addTransition,
      addEffect: clipOps.addEffect,
      addText: clipOps.addText,
      addAudio: clipOps.addAudio,
      createTrack: trackOps.createTrack,
      deleteTrack: trackOps.deleteTrack,
      toggleTrackVisibility: trackOps.toggleTrackVisibility,
      toggleTrackLock: trackOps.toggleTrackLock,
      undo,
      redo,
      selectClip,
      selectTrack,
      zoomIn,
      zoomOut,
      setZoom,
      generateFromScript,
      exportVideo,
      getExportPreview,
      saveProject,
      loadProject,
      clearProject,
    },
  };
}
