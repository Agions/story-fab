import { useState, useCallback, useRef } from 'react';
import { message } from 'antd';
import { open } from '@tauri-apps/api/dialog';
import { VideoSegment, extractKeyFrames, analyzeVideo } from '@/services/videoService';
import { clipWorkflowService } from '@/core/services/clip-workflow.service';

export const useVideoEditor = (projectId: string | undefined) => {
  // 视频状态
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // 片段状态
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [keyframes, setKeyframes] = useState<string[]>([]);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(-1);

  // 历史记录
  const [editHistory, setEditHistory] = useState<VideoSegment[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // 导出设置
  const [outputFormat, setOutputFormat] = useState<string>('mp4');
  const [videoQuality, setVideoQuality] = useState<string>('medium');

  // 操作状态
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // 添加到历史记录
  const addToHistory = useCallback((newSegments: VideoSegment[]) => {
    setEditHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newSegments];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // 加载视频
  const handleLoadVideo = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: '视频文件',
          extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
        }],
      });

      if (!selected || typeof selected !== 'string') {
        return;
      }

      setLoading(true);
      setAnalyzing(true);

      try {
        setVideoSrc(`file://${selected}`);

        const metadata = await analyzeVideo(selected);
        setDuration(metadata.duration);

        const newSegment: VideoSegment = {
          start: 0,
          end: metadata.duration,
          type: 'video',
          content: '完整视频',
        };

        setSegments([newSegment]);
        addToHistory([newSegment]);

        const frames = await extractKeyFrames(selected, {
          interval: Math.max(5, Math.floor(metadata.duration / 10)),
          maxFrames: 10,
        });

        setKeyframes(frames.map(frame => frame.path));

        message.success('视频加载成功');
      } catch (error) {
        console.error('视频分析失败:', error);
        message.error('视频分析失败，请检查文件格式');
      } finally {
        setAnalyzing(false);
        setLoading(false);
      }
    } catch (err) {
      console.error('选择文件失败:', err);
    }
  }, [addToHistory]);

  // 撤销
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSegments(editHistory[newIndex]);
    }
  }, [historyIndex, editHistory]);

  // 重做
  const handleRedo = useCallback(() => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSegments(editHistory[newIndex]);
    }
  }, [historyIndex, editHistory]);

  // 添加片段
  const handleAddSegment = useCallback(() => {
    const newSegment: VideoSegment = {
      start: Math.min(currentTime, duration - 5),
      end: Math.min(currentTime + 5, duration),
      type: 'video',
      content: `片段 ${segments.length + 1}`,
    };

    const newSegments = [...segments, newSegment];
    setSegments(newSegments);
    addToHistory(newSegments);
    setSelectedSegmentIndex(newSegments.length - 1);
    message.success('已添加新片段');
  }, [currentTime, duration, segments, addToHistory]);

  // 删除片段
  const handleDeleteSegment = useCallback((index: number) => {
    const newSegments = segments.filter((_, i) => i !== index);
    setSegments(newSegments);
    addToHistory(newSegments);
    setSelectedSegmentIndex(-1);
    message.success('已删除片段');
  }, [segments, addToHistory]);

  // 选择片段
  const handleSelectSegment = useCallback((index: number) => {
    setSelectedSegmentIndex(index);
    if (index >= 0 && segments[index]) {
      setCurrentTime(segments[index].start);
    }
  }, [segments]);

  // 智能剪辑
  const handleSmartClip = useCallback(async () => {
    if (!videoSrc) return;

    setAnalyzing(true);
    try {
      const videoInfo = {
        path: videoSrc,
        duration,
        width: 1920,
        height: 1080,
      };

      const result = await clipWorkflowService.processVideo(videoInfo);

      const newSegments: VideoSegment[] = result.segments.map(seg => ({
        start: seg.sourceStart,
        end: seg.sourceEnd,
        type: 'video',
        content: `片段 ${segments.length + 1}`,
      }));

      setSegments(newSegments);
      addToHistory(newSegments);

      message.success(`智能剪辑完成: ${result.segments.length} 个片段`);
    } catch (error) {
      message.error('智能剪辑失败');
    } finally {
      setAnalyzing(false);
    }
  }, [videoSrc, duration, segments, addToHistory]);

  // 应用 AI 建议
  const handleApplyAISuggestions = useCallback((aiSegments: any[]) => {
    const newSegments = aiSegments.map(s => ({
      start: s.startTime,
      end: s.endTime,
      type: s.type === 'silence' ? 'silence' : 'video' as const,
      content: s.content,
    }));
    setSegments(newSegments);
    addToHistory(newSegments);
    message.success('已应用 AI 剪辑建议');
  }, [addToHistory]);

  return {
    // 状态
    videoSrc,
    loading,
    analyzing,
    currentTime,
    duration,
    isPlaying,
    segments,
    keyframes,
    selectedSegmentIndex,
    editHistory,
    historyIndex,
    outputFormat,
    videoQuality,
    isSaving,
    isExporting,

    // 状态设置器
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setIsSaving,
    setIsExporting,
    setOutputFormat,
    setVideoQuality,

    // 操作
    handleLoadVideo,
    handleUndo,
    handleRedo,
    handleAddSegment,
    handleDeleteSegment,
    handleSelectSegment,
    handleSmartClip,
    handleApplyAISuggestions,
  };
};
