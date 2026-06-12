/**
 * 视频处理 Hook
 *
 * 【优化思路】将纯工具函数提取到 videoUtils.ts，本文件专注于
 * React 状态管理，实现关注点分离。
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AppError } from '@/core/errors';
import type { VideoInfo, VideoAnalysis } from '@/core/types';
import { delay, formatDuration } from '@/shared';
import type { TaskStatusInfo } from '@/core/services/ai/types';
import {
  SUPPORTED_VIDEO_FORMATS,
  MAX_VIDEO_FILE_SIZE,
  readVideoMetadata,
  generateVideoThumbnail,
  generateMockScenes,
  generateMockKeyframes,
} from './videoUtils';

export interface UseVideoReturn {
  video: VideoInfo | null;
  analysis: VideoAnalysis | null;
  isUploading: boolean;
  uploadProgress: number;
  isAnalyzing: boolean;
  analysisProgress: number;
  taskStatus: TaskStatusInfo | null;
  uploadVideo: (file: File) => Promise<VideoInfo | null>;
  analyzeVideo: (videoId: string) => Promise<VideoAnalysis | null>;
  cancelAnalysis: () => void;
  extractThumbnail: (timestamp: number) => Promise<string | null>;
  extractKeyframes: (interval?: number) => Promise<string[]>;
  error: string | null;
  isLoading: boolean;
}

// 上传进度常量
const UPLOAD_PROGRESS_INTERVAL_MS = 200;
const UPLOAD_MAX_PROGRESS_BEFORE_COMPLETE = 90;
const UPLOAD_PROGRESS_STEP = 10;

// 分析步骤配置
const ANALYSIS_STEPS: ReadonlyArray<{ progress: number; message: string; delay: number }> = [
  { progress: 10, message: '提取关键帧...', delay: 1000 },
  { progress: 30, message: '场景检测...', delay: 2000 },
  { progress: 50, message: '对象识别...', delay: 2000 },
  { progress: 70, message: '情感分析...', delay: 1500 },
  { progress: 90, message: '生成摘要...', delay: 1000 },
];

export function useVideo(): UseVideoReturn {
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [taskStatus, setTaskStatus] = useState<TaskStatusInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, _setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = abortControllerRef.current;
    return () => {
      if (controller) {
        controller.abort();
      }
    };
  }, []);

  const uploadVideo = useCallback(async (file: File): Promise<VideoInfo | null> => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 验证文件格式
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !SUPPORTED_VIDEO_FORMATS.includes(ext)) {
        throw new AppError(
          'APP_VIDEO_FORMAT_UNSUPPORTED',
          `不支持的格式: ${ext}。请使用: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`,
          { userMessage: `视频格式不支持: ${ext || '未知'}` }
        );
      }

      // 验证文件大小
      if (file.size > MAX_VIDEO_FILE_SIZE) {
        throw new AppError(
          'APP_VIDEO_SIZE_EXCEEDED',
          `文件过大: ${(file.size / 1024 / 1024).toFixed(0)}MB。最大支持 2GB`,
          { userMessage: '文件超过 2GB 上限' }
        );
      }

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= UPLOAD_MAX_PROGRESS_BEFORE_COMPLETE) {
            clearInterval(progressInterval);
            return UPLOAD_MAX_PROGRESS_BEFORE_COMPLETE;
          }
          return prev + UPLOAD_PROGRESS_STEP;
        });
      }, UPLOAD_PROGRESS_INTERVAL_MS);

      const info = await readVideoMetadata(file);
      const thumbnail = await generateVideoThumbnail(info.path);
      info.thumbnail = thumbnail;

      clearInterval(progressInterval);
      setUploadProgress(100);
      setVideo(info);

      return info;
    } catch (_err) {
      setError(_err instanceof Error ? _err.message : '上传失败');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const analyzeVideo = useCallback(async (videoId: string): Promise<VideoAnalysis | null> => {
    if (!video) return null;

    setError(null);
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    const task: TaskStatusInfo = {
      id: crypto.randomUUID(),
      type: 'analysis',
      status: 'running',
      progress: 0,
      message: '开始分析视频...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTaskStatus(task);

    try {
      for (const step of ANALYSIS_STEPS) {
        await delay(step.delay);
        setAnalysisProgress(step.progress);
        setTaskStatus((prev) => prev ? {
          ...prev,
          progress: step.progress,
          message: step.message,
          updatedAt: new Date().toISOString()
        } : null);
      }

      const analysisResult: VideoAnalysis = {
        id: crypto.randomUUID(),
        videoId,
        scenes: generateMockScenes(video.duration),
        keyframes: generateMockKeyframes(video.duration),
        objects: [],
        emotions: [],
        summary: `视频时长 ${formatDuration(video.duration)}，分辨率 ${video.width}x${video.height}，包含 ${Math.floor(video.duration / 30)} 个场景。`,
        createdAt: new Date().toISOString()
      };

      setAnalysisProgress(100);
      setAnalysis(analysisResult);
      setTaskStatus(prev => prev ? {
        ...prev,
        status: 'completed',
        progress: 100,
        message: '分析完成',
        completedAt: new Date().toISOString()
      } : null);

      return analysisResult;
    } catch (_err) {
      setError(_err instanceof Error ? _err.message : '分析失败');
      setTaskStatus(prev => prev ? {
        ...prev,
        status: 'failed',
        error: _err instanceof Error ? _err.message : '分析失败'
      } : null);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [video]);

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
    setTaskStatus(prev => prev ? {
      ...prev,
      status: 'cancelled',
      message: '已取消'
    } : null);
  }, []);

  const extractThumbnail = useCallback(async (timestamp: number): Promise<string | null> => {
    if (!video) return null;

    try {
      return await generateVideoThumbnail(video.path, timestamp);
    } catch (_err) {
      setError('提取缩略图失败');
      return null;
    }
  }, [video]);

  const extractKeyframes = useCallback(async (interval: number = 5): Promise<string[]> => {
    if (!video) return [];

    const count = Math.floor(video.duration / interval);
    const BATCH_SIZE = 5;
    const thumbnails: string[] = [];
    for (let i = 0; i < count; i += BATCH_SIZE) {
      const batch = Array.from({ length: Math.min(BATCH_SIZE, count - i) }, async (_, j) => {
        const timestamp = (i + j) * interval;
        return extractThumbnail(timestamp);
      });
      const results = await Promise.all(batch);
      thumbnails.push(...results.filter((t): t is string => t !== null));
    }
    return thumbnails;
  }, [video, extractThumbnail]);

  return {
    video,
    analysis,
    isUploading,
    uploadProgress,
    isAnalyzing,
    analysisProgress,
    taskStatus,
    uploadVideo,
    analyzeVideo,
    cancelAnalysis,
    extractThumbnail,
    extractKeyframes,
    error,
    isLoading
  };
}
