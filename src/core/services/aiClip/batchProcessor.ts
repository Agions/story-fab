import { v4 as uuidv4 } from 'uuid';
import { analyzeVideo } from './analyzer';
import type { VideoInfo } from '@/core/types';
import type { AIClipConfig, BatchClipTask, ClipSegment } from './types';

const tasks = new Map<string, BatchClipTask>();
const abortControllers = new Map<string, AbortController>();

export async function batchProcess(
  projectId: string,
  videos: VideoInfo[],
  config: AIClipConfig,
  onProgress?: (task: BatchClipTask) => void
): Promise<BatchClipTask> {
  const task: BatchClipTask = {
    id: uuidv4(),
    projectId,
    videos,
    config,
    status: 'processing',
    progress: 0,
    results: [],
    errors: [],
    createdAt: new Date().toISOString()
  };

  tasks.set(task.id, task);

  try {
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      try {
        const result = await analyzeVideo(video, config);
        task.results.push(result.segments);
      } catch (error) {
        task.errors.push(`视频 ${video.name} 处理失败: ${error}`);
      }
      task.progress = ((i + 1) / videos.length) * 100;
      onProgress?.(task);
    }
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
  } catch (error) {
    task.status = 'failed';
    task.errors.push(`批量处理失败: ${error}`);
  }

  return task;
}

export function getBatchTask(taskId: string): BatchClipTask | undefined {
  return tasks.get(taskId);
}

export function cancelTask(taskId: string): void {
  const controller = abortControllers.get(taskId);
  if (controller) {
    controller.abort();
    abortControllers.delete(taskId);
  }
  const task = tasks.get(taskId);
  if (task) {
    task.status = 'failed';
    task.errors.push('用户取消');
  }
}

export async function applySuggestions(
  videoInfo: VideoInfo,
  suggestions: any[],
  selectedIds: string[]
): Promise<ClipSegment[]> {
  const selectedSuggestions = suggestions.filter((s) => selectedIds.includes(s.id));
  const segments: ClipSegment[] = [];

  selectedSuggestions.sort((a, b) => a.startTime - b.startTime);
  let currentTime = 0;

  for (const suggestion of selectedSuggestions) {
    if (suggestion.startTime > currentTime) {
      segments.push({
        id: uuidv4(),
        startTime: currentTime,
        endTime: suggestion.startTime,
        duration: suggestion.startTime - currentTime,
        type: 'video',
        content: '保留片段',
        confidence: 1,
        cutPoints: [],
        suggestions: []
      });
    }

    switch (suggestion.type) {
      case 'trim':
      case 'cut':
        currentTime = suggestion.endTime;
        break;
      case 'effect':
        segments.push({
          id: uuidv4(),
          startTime: suggestion.startTime,
          endTime: suggestion.endTime,
          duration: suggestion.endTime - suggestion.startTime,
          type: 'video',
          content: `转场效果: ${suggestion.description}`,
          confidence: 0.9,
          cutPoints: [],
          suggestions: []
        });
        currentTime = suggestion.endTime;
        break;
    }
  }

  if (currentTime < videoInfo.duration) {
    segments.push({
      id: uuidv4(),
      startTime: currentTime,
      endTime: videoInfo.duration,
      duration: videoInfo.duration - currentTime,
      type: 'video',
      content: '保留片段',
      confidence: 1,
      cutPoints: [],
      suggestions: []
    });
  }

  return segments;
}

export async function smartClip(
  videoInfo: VideoInfo,
  targetDuration?: number,
  style: 'fast' | 'normal' | 'slow' = 'normal'
): Promise<any> {
  const config: AIClipConfig = {
    detectSceneChange: true,
    detectSilence: true,
    detectKeyframes: true,
    detectEmotion: true,
    sceneThreshold: 0.3,
    silenceThreshold: -40,
    minSilenceDuration: 0.5,
    keyframeInterval: 5,
    removeSilence: true,
    trimDeadTime: true,
    autoTransition: true,
    transitionType: 'fade',
    aiOptimize: true,
    targetDuration,
    pacingStyle: style
  };

  const analysis = await analyzeVideo(videoInfo, config);
  const autoSuggestions = analysis.suggestions.filter((s) => s.autoApplicable);
  if (autoSuggestions.length > 0) {
    analysis.segments = await applySuggestions(
      videoInfo,
      autoSuggestions,
      autoSuggestions.map((s) => s.id)
    );
  }

  return analysis;
}
