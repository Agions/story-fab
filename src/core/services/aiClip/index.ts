export * from './types';
export * from './analyzer';
export * from './batchProcessor';
export * from './config';

import { analyzeVideo } from './analyzer';
import { batchProcess, getBatchTask, cancelTask, applySuggestions, smartClip } from './batchProcessor';
import { exportClipConfig, importClipConfig } from './config';
import {
  DEFAULT_CLIP_CONFIG,
  type AIClipConfig,
  type BatchClipTask,
  type ClipAnalysisResult,
  type ClipSegment,
  type ClipSuggestion,
} from './types';
import type { VideoInfo } from '@/core/types';

export class AIClipService {
  async analyzeVideo(videoInfo: VideoInfo, config?: Partial<AIClipConfig>): Promise<ClipAnalysisResult> {
    return analyzeVideo(videoInfo, config);
  }

  async batchProcess(
    projectId: string,
    videos: VideoInfo[],
    config: AIClipConfig,
    onProgress?: (task: BatchClipTask) => void
  ) {
    return batchProcess(projectId, videos, config, onProgress);
  }

  getBatchTask(taskId: string) {
    return getBatchTask(taskId);
  }

  cancelTask(taskId: string) {
    return cancelTask(taskId);
  }

  async applySuggestions(videoInfo: VideoInfo, suggestions: ClipSuggestion[], selectedIds: string[]): Promise<ClipSegment[]> {
    return applySuggestions(videoInfo, suggestions, selectedIds);
  }

  async smartClip(
    videoInfo: VideoInfo,
    targetDuration?: number,
    style?: 'fast' | 'normal' | 'slow'
  ): Promise<ClipAnalysisResult> {
    return smartClip(videoInfo, targetDuration, style);
  }

  exportClipConfig(config: AIClipConfig): string {
    return exportClipConfig(config);
  }

  importClipConfig(json: string): AIClipConfig {
    return importClipConfig(json, DEFAULT_CLIP_CONFIG);
  }
}

export const aiClipService = new AIClipService();
export default aiClipService;
