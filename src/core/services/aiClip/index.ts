export * from './types';
export * from './analyzer';
export * from './batchProcessor';
export * from './config';

import { analyzeVideo } from './analyzer';
import { batchProcess, getBatchTask, cancelTask, applySuggestions, smartClip } from './batchProcessor';
import { exportClipConfig, importClipConfig } from './config';
import { DEFAULT_CLIP_CONFIG, type AIClipConfig } from './types';

class AIClipService {
  async analyzeVideo(videoInfo: any, config?: Partial<AIClipConfig>) {
    return analyzeVideo(videoInfo, config);
  }

  async batchProcess(projectId: string, videos: any[], config: AIClipConfig, onProgress?: any) {
    return batchProcess(projectId, videos, config, onProgress);
  }

  getBatchTask(taskId: string) {
    return getBatchTask(taskId);
  }

  cancelTask(taskId: string) {
    return cancelTask(taskId);
  }

  async applySuggestions(videoInfo: any, suggestions: any[], selectedIds: string[]) {
    return applySuggestions(videoInfo, suggestions, selectedIds);
  }

  async smartClip(videoInfo: any, targetDuration?: number, style?: 'fast' | 'normal' | 'slow') {
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
