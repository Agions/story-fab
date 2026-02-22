/**
 * 剪辑工作流 Hook
 * 整合所有剪辑功能，提供统一的剪辑工作流
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { editorService, type EditorAction, type EditorConfig } from '@/core/services/editor.service';
import type { Timeline, VideoClip, ExportSettings, ScriptSegment, VideoSegment } from '@/core/types';

// 剪辑状态
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

// 剪辑操作
export interface EditorOperations {
  // 播放控制
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;

  // 片段操作
  addClip: (trackId: string, clip: VideoClip, position: number) => void;
  removeClip: (trackId: string, clipId: string) => void;
  moveClip: (trackId: string, clipId: string, newPosition: number) => void;
  trimClip: (clipId: string, startTime: number, endTime: number) => void;
  splitClip: (clipId: string, splitTime: number) => void;

  // 效果操作
  addTransition: (fromClipId: string, toClipId: string, type: string, duration: number) => void;
  addEffect: (clipId: string, effect: string, params: Record<string, any>) => void;
  addText: (trackId: string, text: any, position: number) => void;
  addAudio: (trackId: string, audio: any, position: number) => void;

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
  exportVideo: (settings?: Partial<ExportSettings>) => Promise<Blob>;
  getExportPreview: () => { duration: number; resolution: string; estimatedSize: string };

  // 项目操作
  saveProject: () => void;
  loadProject: () => boolean;
  clearProject: () => void;
}

// 剪辑 Hook
export function useEditor(config?: Partial<EditorConfig>): {
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
    isExporting: false
  });

  // 播放状态引用
  const playbackRef = useRef<{
    isPlaying: boolean;
    startTime: number;
    startPosition: number;
    animationFrame: number | null;
  }>({
    isPlaying: false,
    startTime: 0,
    startPosition: 0,
    animationFrame: null
  });

  // 初始化
  useEffect(() => {
    // 订阅时间轴变化
    const unsubscribe = editorService.subscribe((timeline) => {
      setState(prev => ({
        ...prev,
        timeline,
        canUndo: editorService.canUndo(),
        canRedo: editorService.canRedo()
      }));
    });

    // 尝试加载本地项目
    editorService.loadFromStorage();

    return () => {
      unsubscribe();
      if (playbackRef.current.animationFrame) {
        cancelAnimationFrame(playbackRef.current.animationFrame);
      }
    };
  }, []);

  // 播放控制
  const play = useCallback(() => {
    if (!state.timeline || state.isPlaying) return;

    playbackRef.current = {
      isPlaying: true,
      startTime: performance.now(),
      startPosition: state.currentTime,
      animationFrame: null
    };

    const animate = () => {
      const elapsed = (performance.now() - playbackRef.current.startTime) / 1000;
      const newTime = playbackRef.current.startPosition + elapsed;

      if (state.timeline && newTime >= state.timeline.duration) {
        // 播放结束
        setState(prev => ({
          ...prev,
          isPlaying: false,
          currentTime: state.timeline!.duration
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        currentTime: newTime
      }));

      playbackRef.current.animationFrame = requestAnimationFrame(animate);
    };

    playbackRef.current.animationFrame = requestAnimationFrame(animate);

    setState(prev => ({ ...prev, isPlaying: true }));
  }, [state.timeline, state.currentTime, state.isPlaying]);

  const pause = useCallback(() => {
    if (playbackRef.current.animationFrame) {
      cancelAnimationFrame(playbackRef.current.animationFrame);
    }
    playbackRef.current.isPlaying = false;
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const seek = useCallback((time: number) => {
    setState(prev => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, prev.timeline?.duration || 0))
    }));
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    // 实现播放速度调整
    console.log('设置播放速度:', rate);
  }, []);

  // 片段操作
  const addClip = useCallback((trackId: string, clip: VideoClip, position: number) => {
    editorService.dispatch({
      type: 'ADD_CLIP',
      trackId,
      clip,
      position
    });
  }, []);

  const removeClip = useCallback((trackId: string, clipId: string) => {
    editorService.dispatch({
      type: 'REMOVE_CLIP',
      trackId,
      clipId
    });
  }, []);

  const moveClip = useCallback((trackId: string, clipId: string, newPosition: number) => {
    editorService.dispatch({
      type: 'MOVE_CLIP',
      trackId,
      clipId,
      newPosition
    });
  }, []);

  const trimClip = useCallback((clipId: string, startTime: number, endTime: number) => {
    editorService.dispatch({
      type: 'TRIM_CLIP',
      clipId,
      startTime,
      endTime
    });
  }, []);

  const splitClip = useCallback((clipId: string, splitTime: number) => {
    editorService.dispatch({
      type: 'SPLIT_CLIP',
      clipId,
      splitTime
    });
  }, []);

  // 效果操作
  const addTransition = useCallback((
    fromClipId: string,
    toClipId: string,
    type: string,
    duration: number
  ) => {
    editorService.dispatch({
      type: 'ADD_TRANSITION',
      fromClipId,
      toClipId,
      type,
      duration
    });
  }, []);

  const addEffect = useCallback((clipId: string, effect: string, params: Record<string, any>) => {
    editorService.dispatch({
      type: 'ADD_EFFECT',
      clipId,
      effect,
      params
    });
  }, []);

  const addText = useCallback((trackId: string, text: any, position: number) => {
    editorService.dispatch({
      type: 'ADD_TEXT',
      trackId,
      text,
      position
    });
  }, []);

  const addAudio = useCallback((trackId: string, audio: any, position: number) => {
    editorService.dispatch({
      type: 'ADD_AUDIO',
      trackId,
      audio,
      position
    });
  }, []);

  // 轨道操作
  const createTrack = useCallback((type: 'video' | 'audio' | 'text' | 'effect') => {
    return editorService.createTrack(type);
  }, []);

  const deleteTrack = useCallback((trackId: string) => {
    // 实现删除轨道
    console.log('删除轨道:', trackId);
  }, []);

  const toggleTrackVisibility = useCallback((trackId: string) => {
    setState(prev => ({
      ...prev,
      timeline: prev.timeline ? {
        ...prev.timeline,
        videoTracks: prev.timeline.videoTracks.map(track =>
          track.id === trackId ? { ...track, visible: !track.visible } : track
        )
      } : null
    }));
  }, []);

  const toggleTrackLock = useCallback((trackId: string) => {
    setState(prev => ({
      ...prev,
      timeline: prev.timeline ? {
        ...prev.timeline,
        videoTracks: prev.timeline.videoTracks.map(track =>
          track.id === trackId ? { ...track, locked: !track.locked } : track
        )
      } : null
    }));
  }, []);

  // 历史操作
  const undo = useCallback(() => {
    editorService.undo();
  }, []);

  const redo = useCallback(() => {
    editorService.redo();
  }, []);

  // 选择操作
  const selectClip = useCallback((clipId: string | null) => {
    setState(prev => ({ ...prev, selectedClipId: clipId }));
  }, []);

  const selectTrack = useCallback((trackId: string | null) => {
    setState(prev => ({ ...prev, selectedTrackId: trackId }));
  }, []);

  // 缩放操作
  const zoomIn = useCallback(() => {
    setState(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.2) }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(0.2, Math.min(zoom, 5)) }));
  }, []);

  // 工作流操作
  const generateFromScript = useCallback((
    scriptSegments: ScriptSegment[],
    videoSegments: VideoSegment[]
  ) => {
    editorService.generateTimelineFromScript(scriptSegments, videoSegments);
  }, []);

  const exportVideo = useCallback(async (settings?: Partial<ExportSettings>): Promise<Blob> => {
    setState(prev => ({ ...prev, isExporting: true, exportProgress: 0 }));

    try {
      // 模拟导出进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setState(prev => ({ ...prev, exportProgress: i }));
      }

      const blob = await editorService.exportTimeline(settings);
      return blob;
    } finally {
      setState(prev => ({ ...prev, isExporting: false, exportProgress: 100 }));
    }
  }, []);

  const getExportPreview = useCallback(() => {
    return editorService.getExportPreview();
  }, []);

  // 项目操作
  const saveProject = useCallback(() => {
    editorService.saveToStorage();
  }, []);

  const loadProject = useCallback(() => {
    return editorService.loadFromStorage();
  }, []);

  const clearProject = useCallback(() => {
    editorService.clear();
    setState(prev => ({
      ...prev,
      currentTime: 0,
      selectedClipId: null,
      selectedTrackId: null
    }));
  }, []);

  // 返回状态和操作
  return {
    state,
    operations: {
      play,
      pause,
      seek,
      setPlaybackRate,
      addClip,
      removeClip,
      moveClip,
      trimClip,
      splitClip,
      addTransition,
      addEffect,
      addText,
      addAudio,
      createTrack,
      deleteTrack,
      toggleTrackVisibility,
      toggleTrackLock,
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
      clearProject
    }
  };
}

export default useEditor;
