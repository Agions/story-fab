/**
 * AI 剪辑 Hook
 * 提供智能剪辑相关的状态和操作
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { aiClipService, type AIClipConfig, type ClipAnalysisResult, type BatchClipTask } from '@/core/services/aiClip.service';
import type { VideoInfo } from '@/core/types';

export interface UseAIClipReturn {
  // 状态
  isAnalyzing: boolean;
  progress: number;
  result: ClipAnalysisResult | null;
  error: string | null;
  selectedSuggestions: Set<string>;

  // 批量处理
  batchTask: BatchClipTask | null;
  isBatchProcessing: boolean;

  // 操作
  analyze: (videoInfo: VideoInfo, config?: Partial<AIClipConfig>) => Promise<ClipAnalysisResult>;
  smartClip: (videoInfo: VideoInfo, targetDuration?: number, style?: 'fast' | 'normal' | 'slow') => Promise<ClipAnalysisResult>;
  batchProcess: (projectId: string, videos: VideoInfo[], config: AIClipConfig) => Promise<void>;
  toggleSuggestion: (id: string) => void;
  selectAllSuggestions: () => void;
  deselectAllSuggestions: () => void;
  applySelectedSuggestions: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useAIClip(): UseAIClipReturn {
  // 分析状态
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ClipAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  // 批量处理状态
  const [batchTask, setBatchTask] = useState<BatchClipTask | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // 当前处理的视频
  const currentVideoRef = useRef<VideoInfo | null>(null);

  // 分析视频
  const analyze = useCallback(async (
    videoInfo: VideoInfo,
    config: Partial<AIClipConfig> = {}
  ): Promise<ClipAnalysisResult> => {
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    currentVideoRef.current = videoInfo;

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return Math.min(90, prev + Math.random() * 10);
        });
      }, 300);

      const analysisResult = await aiClipService.analyzeVideo(videoInfo, config);

      clearInterval(progressInterval);
      setProgress(100);
      setResult(analysisResult);

      // 自动选中高置信度的建议
      const autoSelected = new Set(
        analysisResult.suggestions
          .filter(s => s.autoApplicable && s.confidence > 0.8)
          .map(s => s.id)
      );
      setSelectedSuggestions(autoSelected);

      return analysisResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分析失败';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // 一键智能剪辑
  const smartClip = useCallback(async (
    videoInfo: VideoInfo,
    targetDuration?: number,
    style: 'fast' | 'normal' | 'slow' = 'normal'
  ): Promise<ClipAnalysisResult> => {
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    currentVideoRef.current = videoInfo;

    try {
      const analysisResult = await aiClipService.smartClip(videoInfo, targetDuration, style);
      setResult(analysisResult);
      setProgress(100);
      return analysisResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '智能剪辑失败';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // 批量处理
  const batchProcess = useCallback(async (
    projectId: string,
    videos: VideoInfo[],
    config: AIClipConfig
  ): Promise<void> => {
    setIsBatchProcessing(true);
    setError(null);

    try {
      const task = await aiClipService.batchProcess(
        projectId,
        videos,
        config,
        (updatedTask) => {
          setBatchTask(updatedTask);
          setProgress(updatedTask.progress);
        }
      );

      setBatchTask(task);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量处理失败';
      setError(errorMessage);
      throw err;
    } finally {
      setIsBatchProcessing(false);
    }
  }, []);

  // 切换建议选中状态
  const toggleSuggestion = useCallback((id: string) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 全选建议
  const selectAllSuggestions = useCallback(() => {
    if (result) {
      setSelectedSuggestions(new Set(result.suggestions.map(s => s.id)));
    }
  }, [result]);

  // 取消全选
  const deselectAllSuggestions = useCallback(() => {
    setSelectedSuggestions(new Set());
  }, []);

  // 应用选中的建议
  const applySelectedSuggestions = useCallback(async (): Promise<void> => {
    if (!result || !currentVideoRef.current) return;

    const selectedIds = Array.from(selectedSuggestions);
    const suggestions = result.suggestions.filter(s => selectedIds.includes(s.id));

    const segments = await aiClipService.applySuggestions(
      currentVideoRef.current,
      suggestions,
      selectedIds
    );

    // 更新结果中的片段
    setResult(prev => prev ? { ...prev, segments } : null);
  }, [result, selectedSuggestions]);

  // 取消当前操作
  const cancel = useCallback(() => {
    // 如果有正在进行的任务，取消它
    if (batchTask) {
      aiClipService.cancelTask(batchTask.id);
    }
    setIsAnalyzing(false);
    setIsBatchProcessing(false);
  }, [batchTask]);

  // 重置状态
  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setProgress(0);
    setResult(null);
    setError(null);
    setSelectedSuggestions(new Set());
    setBatchTask(null);
    setIsBatchProcessing(false);
    currentVideoRef.current = null;
  }, []);

  return {
    isAnalyzing,
    progress,
    result,
    error,
    selectedSuggestions,
    batchTask,
    isBatchProcessing,
    analyze,
    smartClip,
    batchProcess,
    toggleSuggestion,
    selectAllSuggestions,
    deselectAllSuggestions,
    applySelectedSuggestions,
    cancel,
    reset
  };
}

export default useAIClip;
