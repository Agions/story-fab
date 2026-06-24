/**
 * useVideoEditor hook — 16 useState 集中化入口
 * 来源: refactor/video-editor-usereducer (v3.4 §A2 范式)
 */
import { useReducer, useMemo, useCallback, useRef } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { SimpleVideoSegment, videoProcessor } from '@/core/video';
import { clipWorkflowService } from '../../../core/services/pipeline/clip-pipeline/clipWorkflow';
import type { VideoInfo } from '@/core/types';
import type { ClipSegment } from '../../../core/services/aiClip';
import { notify } from '@/shared';
import { logger } from '../../../shared/utils/logging';
import {
  initialVideoEditorState,
  videoEditorReducer,
  type VideoEditorAction,
  type VideoEditorState,
  type Updater,
} from './useVideoEditor.reducer';

type Setter<K extends keyof VideoEditorState> = (updater: Updater<VideoEditorState[K]>) => void;
type VideoEditorSetters = { [K in keyof VideoEditorState]: Setter<K> };

const makeSetters = (dispatch: React.Dispatch<VideoEditorAction>): VideoEditorSetters => {
  return Object.fromEntries(
    (Object.keys(initialVideoEditorState) as (keyof VideoEditorState)[]).map((key) => [
      key,
      (updater: Updater<VideoEditorState[typeof key]>) =>
        dispatch({ type: 'update', key, updater: updater as Updater<unknown> }),
    ]),
  ) as VideoEditorSetters;
};

export const useVideoEditor = (projectId: string | undefined) => {
  const [state, dispatch] = useReducer(videoEditorReducer, initialVideoEditorState);
  const setters = useMemo(() => makeSetters(dispatch), []);
  const {
    videoSrc, loading, analyzing, currentTime, duration, isPlaying,
    segments, keyframes, selectedSegmentIndex, editHistory, historyIndex,
    outputFormat, videoQuality, isSaving, isExporting,
  } = state;

  const historyIndexRef = useRef(-1);
  const loadVideoLockRef = useRef(false);
  const smartClipLockRef = useRef(false);

  const addToHistory = useCallback((newSegments: SimpleVideoSegment[]) => {
    setters.editHistory((prev) => {
      const cursor = historyIndexRef.current;
      const newHistory = prev.slice(0, cursor + 1);
      const nextHistory = [...newHistory, newSegments];
      const nextIndex = nextHistory.length - 1;
      historyIndexRef.current = nextIndex;
      setters.historyIndex(nextIndex);
      return nextHistory;
    });
  }, [setters]);

  const handleLoadVideo = useCallback(async () => {
    if (loading || analyzing || loadVideoLockRef.current) return;
    loadVideoLockRef.current = true;
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] }],
      });
      if (!selected || typeof selected !== 'string') return;

      setters.loading(true);
      setters.analyzing(true);
      try {
        setters.videoSrc(`file://${selected}`);
        const metadata = await videoProcessor.analyze(selected);
        setters.duration(metadata.duration);

        const newSegment: SimpleVideoSegment = { start: 0, end: metadata.duration };
        setters.segments([newSegment]);
        addToHistory([newSegment]);

        const frames = await videoProcessor.extractKeyFrames(selected, {
          interval: Math.max(5, Math.floor(metadata.duration / 10)),
          maxFrames: 10,
        }, metadata.duration);
        setters.keyframes(frames.map(frame => frame.path));
        notify.success('视频加载成功');
      } catch (error) {
        logger.error('视频分析失败:', error);
        notify.error(error, '视频分析失败，请检查文件格式');
      } finally {
        setters.analyzing(false);
        setters.loading(false);
      }
    } catch (err: unknown) {
      logger.error('选择文件失败:', err);
    } finally {
      loadVideoLockRef.current = false;
    }
  }, [addToHistory, analyzing, loading, setters]);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    historyIndexRef.current = newIndex;
    setters.historyIndex(newIndex);
    setters.segments(editHistory[newIndex]);
  }, [historyIndex, editHistory, setters]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= editHistory.length - 1) return;
    const newIndex = historyIndex + 1;
    historyIndexRef.current = newIndex;
    setters.historyIndex(newIndex);
    setters.segments(editHistory[newIndex]);
  }, [historyIndex, editHistory, setters]);

  const handleAddSegment = useCallback(() => {
    if (duration <= 0) return;
    const baseStart = Math.max(0, Math.min(currentTime, Math.max(duration - 5, 0)));
    const baseEnd = Math.max(baseStart, Math.min(baseStart + 5, duration));
    const newSegment: SimpleVideoSegment = { start: baseStart, end: baseEnd };
    const newSegments = [...segments, newSegment];
    setters.segments(newSegments);
    addToHistory(newSegments);
    setters.selectedSegmentIndex(newSegments.length - 1);
    notify.success('已添加新片段');
  }, [currentTime, duration, segments, addToHistory, setters]);

  const handleDeleteSegment = useCallback((index: number) => {
    if (index < 0 || index >= segments.length) return;
    const newSegments = segments.filter((_, i) => i !== index);
    setters.segments(newSegments);
    addToHistory(newSegments);
    setters.selectedSegmentIndex((prev) => {
      if (prev === index) return -1;
      if (prev > index) return prev - 1;
      return prev;
    });
    notify.success('已删除片段');
  }, [segments, addToHistory, setters]);

  const handleSelectSegment = useCallback((index: number) => {
    if (index === selectedSegmentIndex) return;
    if (index < -1 || index >= segments.length) return;
    setters.selectedSegmentIndex(index);
    if (index >= 0 && segments[index]) {
      setters.currentTime(segments[index].start);
    }
  }, [segments, selectedSegmentIndex, setters]);

  const handleSmartClip = useCallback(async () => {
    if (!videoSrc || analyzing || smartClipLockRef.current) return;
    smartClipLockRef.current = true;
    setters.analyzing(true);
    try {
      const videoInfo: VideoInfo = {
        id: projectId || 'new', path: videoSrc, name: '当前视频', duration,
        width: 1920, height: 1080, fps: 30, format: outputFormat, size: 0,
        createdAt: new Date().toISOString(),
      };
      const result = await clipWorkflowService.processVideo(videoInfo);
      const newSegments: SimpleVideoSegment[] = result.segments.map(seg => ({
        start: seg.sourceStart, end: seg.sourceEnd, type: 'video',
        content: `片段 ${segments.length + 1}`,
      }));
      setters.segments(newSegments);
      addToHistory(newSegments);
      notify.success(`智能剪辑完成: ${result.segments.length} 个片段`);
    } catch (error) {
      notify.error(error, '智能剪辑失败');
    } finally {
      setters.analyzing(false);
      smartClipLockRef.current = false;
    }
  }, [projectId, videoSrc, duration, outputFormat, segments, addToHistory, analyzing, setters]);

  const handleApplyAISuggestions = useCallback((aiSegments: ClipSegment[]) => {
    if (!Array.isArray(aiSegments) || aiSegments.length === 0) return;
    const newSegments = aiSegments.map(s => ({
      start: s.startTime, end: s.endTime,
      type: s.type === 'silence' ? 'silence' as const : 'video' as const,
      content: s.content,
    }));
    setters.segments(newSegments);
    addToHistory(newSegments);
    notify.success('已应用 AI 剪辑建议');
  }, [addToHistory, setters]);

  return {
    // 状态
    videoSrc, loading, analyzing, currentTime, duration, isPlaying,
    segments, keyframes, selectedSegmentIndex, editHistory, historyIndex,
    outputFormat, videoQuality, isSaving, isExporting,

    // 状态设置器
    setCurrentTime: setters.currentTime,
    setDuration: setters.duration,
    setIsPlaying: setters.isPlaying,
    setIsSaving: setters.isSaving,
    setIsExporting: setters.isExporting,
    setOutputFormat: setters.outputFormat,
    setVideoQuality: setters.videoQuality,

    // 操作
    handleLoadVideo, handleUndo, handleRedo, handleAddSegment,
    handleDeleteSegment, handleSelectSegment, handleSmartClip, handleApplyAISuggestions,
  };
};
