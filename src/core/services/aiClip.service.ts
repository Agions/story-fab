/**
 * AI 智能剪辑服务
 * 提供智能剪辑点检测、自动剪辑建议、批量处理等功能
 */

import { v4 as uuidv4 } from 'uuid';
import { videoService } from './video.service';
import { visionService } from './vision.service';
import { aiService } from './ai.service';
import type {
  VideoInfo,
  VideoAnalysis,
  Scene,
  ScriptSegment,
  ExportSettings
} from '@/core/types';

// 剪辑点类型
export type CutPointType = 'scene' | 'silence' | 'keyframe' | 'emotion' | 'manual' | 'ai-suggested';

// 剪辑点
export interface CutPoint {
  id: string;
  timestamp: number;
  type: CutPointType;
  confidence: number;
  description: string;
  suggestedAction?: 'keep' | 'remove' | 'trim' | 'transition';
  metadata?: {
    sceneChange?: number;
    audioLevel?: number;
    motionScore?: number;
    emotionScore?: number;
  };
}

// 剪辑建议
export interface ClipSuggestion {
  id: string;
  type: 'trim' | 'cut' | 'merge' | 'reorder' | 'effect';
  startTime: number;
  endTime: number;
  description: string;
  reason: string;
  confidence: number;
  previewThumbnail?: string;
  autoApplicable: boolean;
}

// 智能剪辑配置
export interface AIClipConfig {
  // 检测配置
  detectSceneChange: boolean;
  detectSilence: boolean;
  detectKeyframes: boolean;
  detectEmotion: boolean;

  // 阈值配置
  sceneThreshold: number;      // 场景切换阈值 (0-1)
  silenceThreshold: number;    // 静音阈值 (dB)
  minSilenceDuration: number;  // 最小静音时长 (秒)
  keyframeInterval: number;    // 关键帧间隔 (秒)

  // 剪辑配置
  removeSilence: boolean;
  trimDeadTime: boolean;
  autoTransition: boolean;
  transitionType: 'fade' | 'cut' | 'dissolve' | 'slide';

  // AI 增强
  aiOptimize: boolean;
  targetDuration?: number;
  pacingStyle: 'fast' | 'normal' | 'slow';
}

// 默认配置
const DEFAULT_CLIP_CONFIG: AIClipConfig = {
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
  pacingStyle: 'normal'
};

// 剪辑片段
export interface ClipSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'video' | 'audio' | 'silence' | 'keyframe';
  content: string;
  thumbnail?: string;
  confidence: number;
  cutPoints: CutPoint[];
  suggestions: ClipSuggestion[];
}

// 批量处理任务
export interface BatchClipTask {
  id: string;
  projectId: string;
  videos: VideoInfo[];
  config: AIClipConfig;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results: ClipSegment[][];
  errors: string[];
  createdAt: string;
  completedAt?: string;
}

// 剪辑分析结果
export interface ClipAnalysisResult {
  videoId: string;
  duration: number;
  cutPoints: CutPoint[];
  segments: ClipSegment[];
  suggestions: ClipSuggestion[];
  silenceSegments: Array<{ start: number; end: number; duration: number }>;
  keyframeTimestamps: number[];
  sceneBoundaries: Array<{ start: number; end: number; type: string }>;
  estimatedFinalDuration: number;
}

class AIClipService {
  private tasks: Map<string, BatchClipTask> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  /**
   * 分析视频并检测剪辑点
   */
  async analyzeVideo(
    videoInfo: VideoInfo,
    config: Partial<AIClipConfig> = {}
  ): Promise<ClipAnalysisResult> {
    const fullConfig = { ...DEFAULT_CLIP_CONFIG, ...config };
    const abortController = new AbortController();
    const taskId = uuidv4();
    this.abortControllers.set(taskId, abortController);

    try {
      // 1. 高级场景检测
      const { scenes, emotions } = await visionService.detectScenesAdvanced(
        videoInfo,
        {
          minSceneDuration: 2,
          detectObjects: false,
          detectEmotions: fullConfig.detectEmotion
        }
      );

      // 2. 提取关键帧
      const keyframes = fullConfig.detectKeyframes
        ? await this.detectKeyframes(videoInfo, fullConfig.keyframeInterval)
        : [];

      // 3. 检测静音片段
      const silenceSegments = fullConfig.detectSilence
        ? await this.detectSilenceSegments(videoInfo, fullConfig)
        : [];

      // 4. 生成剪辑点
      const cutPoints = this.generateCutPoints(
        videoInfo,
        scenes,
        keyframes,
        silenceSegments,
        emotions,
        fullConfig
      );

      // 5. 生成剪辑片段
      const segments = this.generateSegments(videoInfo, cutPoints, scenes);

      // 6. 生成AI剪辑建议
      const suggestions = fullConfig.aiOptimize
        ? await this.generateSuggestions(videoInfo, segments, scenes, fullConfig)
        : [];

      // 7. 计算预估最终时长
      const estimatedFinalDuration = this.estimateFinalDuration(
        videoInfo.duration,
        silenceSegments,
        segments,
        fullConfig
      );

      return {
        videoId: videoInfo.id,
        duration: videoInfo.duration,
        cutPoints,
        segments,
        suggestions,
        silenceSegments,
        keyframeTimestamps: keyframes.map(k => k.timestamp),
        sceneBoundaries: scenes.map(s => ({
          start: s.startTime,
          end: s.endTime,
          type: s.type || 'unknown'
        })),
        estimatedFinalDuration
      };
    } finally {
      this.abortControllers.delete(taskId);
    }
  }

  /**
   * 检测关键帧
   */
  private async detectKeyframes(
    videoInfo: VideoInfo,
    interval: number
  ): Promise<Array<{ timestamp: number; thumbnail: string; importance: number }>> {
    const count = Math.floor(videoInfo.duration / interval);
    const keyframes = await videoService.extractKeyframes(
      videoInfo.path,
      videoInfo.duration,
      Math.min(count, 20)
    );

    return keyframes.map((kf, index) => ({
      timestamp: kf.timestamp,
      thumbnail: kf.thumbnail,
      importance: this.calculateKeyframeImportance(kf, index, keyframes.length)
    }));
  }

  /**
   * 计算关键帧重要性
   */
  private calculateKeyframeImportance(
    keyframe: any,
    index: number,
    total: number
  ): number {
    // 开头和结尾的关键帧通常更重要
    const position = index / total;
    const positionWeight = Math.sin(position * Math.PI); // 中间低，两边高

    // 基于时间戳的分布权重
    const distributionWeight = 1 - Math.abs(0.5 - position) * 0.5;

    return Math.min(1, (positionWeight + distributionWeight) / 2);
  }

  /**
   * 检测静音片段
   */
  private async detectSilenceSegments(
    videoInfo: VideoInfo,
    config: AIClipConfig
  ): Promise<Array<{ start: number; end: number; duration: number }>> {
    // 模拟静音检测
    // 实际实现应该使用 Web Audio API 或 FFmpeg 分析音频
    const segments: Array<{ start: number; end: number; duration: number }> = [];
    const duration = videoInfo.duration;

    // 检测长静音（模拟）
    let currentTime = 0;
    while (currentTime < duration) {
      // 随机生成静音片段（实际应该基于音频分析）
      if (Math.random() > 0.7) {
        const silenceDuration = Math.random() * 2 + config.minSilenceDuration;
        const start = currentTime;
        const end = Math.min(start + silenceDuration, duration);

        if (end - start >= config.minSilenceDuration) {
          segments.push({
            start,
            end,
            duration: end - start
          });
        }
        currentTime = end;
      } else {
        currentTime += Math.random() * 10 + 5;
      }
    }

    return segments.sort((a, b) => a.start - b.start);
  }

  /**
   * 生成剪辑点
   */
  private generateCutPoints(
    videoInfo: VideoInfo,
    scenes: Scene[],
    keyframes: Array<{ timestamp: number; importance: number }>,
    silenceSegments: Array<{ start: number; end: number }>,
    emotions: any[],
    config: AIClipConfig
  ): CutPoint[] {
    const cutPoints: CutPoint[] = [];

    // 1. 场景边界作为剪辑点
    if (config.detectSceneChange) {
      scenes.forEach((scene, index) => {
        if (index > 0) {
          cutPoints.push({
            id: `scene_${scene.id}`,
            timestamp: scene.startTime,
            type: 'scene',
            confidence: scene.confidence || 0.8,
            description: `场景切换: ${scene.description || '场景 ' + (index + 1)}`,
            suggestedAction: 'transition',
            metadata: {
              sceneChange: scene.confidence
            }
          });
        }
      });
    }

    // 2. 关键帧作为剪辑点
    if (config.detectKeyframes) {
      keyframes.forEach(kf => {
        if (kf.importance > 0.5) {
          cutPoints.push({
            id: `kf_${kf.timestamp}`,
            timestamp: kf.timestamp,
            type: 'keyframe',
            confidence: kf.importance,
            description: `关键帧 @ ${this.formatTime(kf.timestamp)}`,
            suggestedAction: 'keep',
            metadata: {
              motionScore: kf.importance
            }
          });
        }
      });
    }

    // 3. 静音片段作为剪辑点
    if (config.detectSilence && config.removeSilence) {
      silenceSegments.forEach((silence, index) => {
        cutPoints.push({
          id: `silence_${index}`,
          timestamp: silence.start,
          type: 'silence',
          confidence: 0.9,
          description: `静音片段 (${silence.duration.toFixed(1)}秒)`,
          suggestedAction: 'remove',
          metadata: {
            audioLevel: -50
          }
        });
      });
    }

    // 4. 情感变化点作为剪辑点
    if (config.detectEmotion) {
      emotions.forEach((emotion, index) => {
        if (emotion.intensity > 0.6) {
          cutPoints.push({
            id: `emotion_${emotion.id}`,
            timestamp: emotion.timestamp,
            type: 'emotion',
            confidence: emotion.intensity,
            description: `情感变化: ${emotion.dominant}`,
            suggestedAction: 'keep',
            metadata: {
              emotionScore: emotion.intensity
            }
          });
        }
      });
    }

    // 按时间排序并去重
    return this.deduplicateCutPoints(cutPoints.sort((a, b) => a.timestamp - b.timestamp));
  }

  /**
   * 去重剪辑点
   */
  private deduplicateCutPoints(cutPoints: CutPoint[]): CutPoint[] {
    const result: CutPoint[] = [];
    const minGap = 0.5; // 最小间隔 0.5 秒

    for (const point of cutPoints) {
      const lastPoint = result[result.length - 1];
      if (!lastPoint || Math.abs(point.timestamp - lastPoint.timestamp) >= minGap) {
        result.push(point);
      } else if (point.confidence > lastPoint.confidence) {
        // 保留置信度更高的
        result[result.length - 1] = point;
      }
    }

    return result;
  }

  /**
   * 生成剪辑片段
   */
  private generateSegments(
    videoInfo: VideoInfo,
    cutPoints: CutPoint[],
    scenes: Scene[]
  ): ClipSegment[] {
    const segments: ClipSegment[] = [];

    if (cutPoints.length === 0) {
      return [{
        id: uuidv4(),
        startTime: 0,
        endTime: videoInfo.duration,
        duration: videoInfo.duration,
        type: 'video',
        content: '完整视频',
        confidence: 1,
        cutPoints: [],
        suggestions: []
      }];
    }

    // 基于剪辑点生成片段
    let currentStart = 0;

    for (let i = 0; i <= cutPoints.length; i++) {
      const endTime = i < cutPoints.length ? cutPoints[i].timestamp : videoInfo.duration;

      if (endTime > currentStart) {
        const segmentCutPoints = cutPoints.filter(
          cp => cp.timestamp >= currentStart && cp.timestamp <= endTime
        );

        // 找到对应的场景
        const scene = scenes.find(s =>
          s.startTime <= currentStart && s.endTime >= endTime
        );

        segments.push({
          id: uuidv4(),
          startTime: currentStart,
          endTime,
          duration: endTime - currentStart,
          type: this.determineSegmentType(segmentCutPoints),
          content: scene?.description || `片段 ${segments.length + 1}`,
          thumbnail: scene?.thumbnail,
          confidence: this.calculateSegmentConfidence(segmentCutPoints),
          cutPoints: segmentCutPoints,
          suggestions: []
        });
      }

      currentStart = endTime;
    }

    return segments;
  }

  /**
   * 确定片段类型
   */
  private determineSegmentType(cutPoints: CutPoint[]): ClipSegment['type'] {
    if (cutPoints.some(cp => cp.type === 'silence')) return 'silence';
    if (cutPoints.some(cp => cp.type === 'keyframe')) return 'keyframe';
    return 'video';
  }

  /**
   * 计算片段置信度
   */
  private calculateSegmentConfidence(cutPoints: CutPoint[]): number {
    if (cutPoints.length === 0) return 0.5;
    const avgConfidence = cutPoints.reduce((sum, cp) => sum + cp.confidence, 0) / cutPoints.length;
    return Math.min(1, avgConfidence);
  }

  /**
   * 生成AI剪辑建议
   */
  private async generateSuggestions(
    videoInfo: VideoInfo,
    segments: ClipSegment[],
    scenes: Scene[],
    config: AIClipConfig
  ): Promise<ClipSuggestion[]> {
    const suggestions: ClipSuggestion[] = [];

    // 1. 建议移除静音片段
    const silenceSegments = segments.filter(s => s.type === 'silence');
    silenceSegments.forEach(segment => {
      suggestions.push({
        id: uuidv4(),
        type: 'trim',
        startTime: segment.startTime,
        endTime: segment.endTime,
        description: `移除静音片段 (${segment.duration.toFixed(1)}秒)`,
        reason: '这段音频几乎没有声音，移除后可以提升视频节奏',
        confidence: 0.9,
        autoApplicable: true
      });
    });

    // 2. 建议合并短片段
    const shortSegments = segments.filter(s => s.duration < 1.5 && s.type !== 'silence');
    for (let i = 0; i < shortSegments.length - 1; i++) {
      const current = shortSegments[i];
      const next = shortSegments[i + 1];

      if (next.startTime - current.endTime < 1) {
        suggestions.push({
          id: uuidv4(),
          type: 'merge',
          startTime: current.startTime,
          endTime: next.endTime,
          description: `合并短片段 (${current.duration.toFixed(1)}s + ${next.duration.toFixed(1)}s)`,
          reason: '两个片段都很短且相邻，合并后观看体验更好',
          confidence: 0.75,
          autoApplicable: true
        });
      }
    }

    // 3. 建议添加转场
    const sceneChanges = segments.filter(s =>
      s.cutPoints.some(cp => cp.type === 'scene')
    );
    sceneChanges.forEach((segment, index) => {
      if (index < sceneChanges.length - 1) {
        suggestions.push({
          id: uuidv4(),
          type: 'effect',
          startTime: segment.endTime,
          endTime: segment.endTime + 0.5,
          description: `添加${config.transitionType}转场`,
          reason: '场景切换处添加转场效果可以使过渡更自然',
          confidence: 0.8,
          autoApplicable: config.autoTransition
        });
      }
    });

    // 4. 基于目标时长的建议
    if (config.targetDuration) {
      const currentDuration = segments
        .filter(s => s.type !== 'silence')
        .reduce((sum, s) => sum + s.duration, 0);

      if (currentDuration > config.targetDuration * 1.2) {
        suggestions.push({
          id: uuidv4(),
          type: 'trim',
          startTime: 0,
          endTime: videoInfo.duration,
          description: `压缩视频至目标时长 (${config.targetDuration}秒)`,
          reason: `当前预估时长 ${Math.round(currentDuration)}秒，建议精简内容`,
          confidence: 0.7,
          autoApplicable: false
        });
      }
    }

    // 5. 节奏优化建议
    if (config.pacingStyle === 'fast') {
      const slowSegments = segments.filter(s => s.duration > 10);
      slowSegments.forEach(segment => {
        suggestions.push({
          id: uuidv4(),
          type: 'trim',
          startTime: segment.startTime,
          endTime: segment.endTime,
          description: `加速长片段 (${segment.duration.toFixed(1)}秒)`,
          reason: '选择快速节奏模式，建议缩短长片段',
          confidence: 0.65,
          autoApplicable: false
        });
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 估算最终时长
   */
  private estimateFinalDuration(
    originalDuration: number,
    silenceSegments: Array<{ duration: number }>,
    segments: ClipSegment[],
    config: AIClipConfig
  ): number {
    let estimated = originalDuration;

    // 减去静音片段
    if (config.removeSilence) {
      const totalSilence = silenceSegments.reduce((sum, s) => sum + s.duration, 0);
      estimated -= totalSilence;
    }

    // 减去死时间
    if (config.trimDeadTime) {
      const deadTime = segments
        .filter(s => s.duration < 0.5)
        .reduce((sum, s) => sum + s.duration, 0);
      estimated -= deadTime;
    }

    // 添加转场时间
    if (config.autoTransition) {
      const transitionCount = segments.length - 1;
      estimated += transitionCount * 0.3; // 每个转场 0.3 秒
    }

    return Math.max(0, estimated);
  }

  /**
   * 应用剪辑建议
   */
  async applySuggestions(
    videoInfo: VideoInfo,
    suggestions: ClipSuggestion[],
    selectedIds: string[]
  ): Promise<ClipSegment[]> {
    const selectedSuggestions = suggestions.filter(s => selectedIds.includes(s.id));
    const segments: ClipSegment[] = [];

    // 按时间排序
    selectedSuggestions.sort((a, b) => a.startTime - b.startTime);

    let currentTime = 0;

    for (const suggestion of selectedSuggestions) {
      // 添加建议前的片段
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

      // 处理建议
      switch (suggestion.type) {
        case 'trim':
          // 跳过被修剪的部分
          currentTime = suggestion.endTime;
          break;
        case 'merge':
          // 合并片段，继续到下一个建议
          break;
        case 'cut':
          currentTime = suggestion.endTime;
          break;
        case 'effect':
          // 添加效果，保留片段
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

    // 添加最后一段
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

  /**
   * 批量处理多个视频
   */
  async batchProcess(
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

    this.tasks.set(task.id, task);

    try {
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];

        try {
          const result = await this.analyzeVideo(video, config);
          task.results.push(result.segments);
        } catch (error) {
          task.errors.push(`视频 ${video.name} 处理失败: ${error}`);
        }

        task.progress = ((i + 1) / videos.length) * 100;
        onProgress?.(task);
      }

      task.status = task.errors.length > 0 ? 'completed' : 'completed';
      task.completedAt = new Date().toISOString();
    } catch (error) {
      task.status = 'failed';
      task.errors.push(`批量处理失败: ${error}`);
    }

    return task;
  }

  /**
   * 获取批量任务状态
   */
  getBatchTask(taskId: string): BatchClipTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): void {
    const controller = this.abortControllers.get(taskId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(taskId);
    }

    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.errors.push('用户取消');
    }
  }

  /**
   * 智能剪辑 - 一键处理
   */
  async smartClip(
    videoInfo: VideoInfo,
    targetDuration?: number,
    style: 'fast' | 'normal' | 'slow' = 'normal'
  ): Promise<ClipAnalysisResult> {
    const config: AIClipConfig = {
      ...DEFAULT_CLIP_CONFIG,
      aiOptimize: true,
      targetDuration,
      pacingStyle: style,
      removeSilence: true,
      trimDeadTime: true,
      autoTransition: true
    };

    const analysis = await this.analyzeVideo(videoInfo, config);

    // 自动应用高置信度的建议
    const autoSuggestions = analysis.suggestions.filter(s => s.autoApplicable);
    if (autoSuggestions.length > 0) {
      analysis.segments = await this.applySuggestions(
        videoInfo,
        autoSuggestions,
        autoSuggestions.map(s => s.id)
      );
    }

    return analysis;
  }

  /**
   * 导出剪辑配置
   */
  exportClipConfig(config: AIClipConfig): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * 导入剪辑配置
   */
  importClipConfig(json: string): AIClipConfig {
    return { ...DEFAULT_CLIP_CONFIG, ...JSON.parse(json) };
  }

  /**
   * 格式化时间
   */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

export const aiClipService = new AIClipService();
export default aiClipService;
