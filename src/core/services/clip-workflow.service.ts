/**
 * 智能剪辑工作流服务 (优化版)
 * 简化的完整剪辑流程
 *
 * 整合说明：
 * - processVideo()          → 轻量路径：场景切换 + 静音检测（向后兼容）
 * - processVideoWithPipeline() → 完整路径：委托 ClipRepurposingPipeline（多维评分 + SEO）
 *
 * 两者共享 VideoSegmentBase 字段（startTime/endTime/sourceId/duration），
 * 类型定义见 clipRepurposing/types.ts
 */

import { visionService } from './vision.service';
import type { VideoInfo, VideoAnalysis, ScriptSegment, ExportSettings } from '@/core/types';
import { ClipRepurposingPipeline } from './clipRepurposing/pipeline';
import type { RepurposingOptions } from './clipRepurposing/pipeline';
import { clipSegmentFromRepurposing } from './clipRepurposing/types';

// 剪辑配置
interface ClipConfig {
  // 检测配置
  detectSceneChange: boolean;
  detectSilence: boolean;
  sceneThreshold: number;
  silenceThreshold: number;
  
  // 剪辑选项
  removeSilence: boolean;
  autoTransition: boolean;
  transitionType: 'fade' | 'cut' | 'dissolve';
  
  // AI 优化
  aiOptimize: boolean;
  targetDuration?: number;
  
  // 输出质量
  outputQuality: 'low' | 'medium' | 'high' | 'ultra';
  outputFormat: 'mp4' | 'webm' | 'mov';
  bitrate: '2M' | '5M' | '8M' | '15M' | '30M';
  fps: 24 | 30 | 60;
  resolution: '720p' | '1080p' | '2k' | '4k';
}

// 剪辑片段
export interface ClipSegment {
  id: string;
  _startTime: number;
  endTime: number;
  sourceStart: number;
  sourceEnd: number;
  sourceId: string;
  type: 'video' | 'audio' | 'subtitle';
  transition?: string;
  effects?: string[];
  text?: string;
  duration: number;
}

// 剪辑结果
export interface ClipResult {
  segments: ClipSegment[];
  totalDuration: number;
  removedDuration: number;
  cutPoints: number;
  metadata: {
    processedAt: string;
    config: ClipConfig;
    sceneChanges: number;
    silenceSections: number;
    pipelineUsed?: boolean;
  };
}

// 默认配置
const DEFAULT_CONFIG: ClipConfig = {
  detectSceneChange: true,
  detectSilence: true,
  sceneThreshold: 0.3,
  silenceThreshold: -40,
  removeSilence: true,
  autoTransition: true,
  transitionType: 'fade',
  aiOptimize: true,
  // 输出质量 - 默认高质量
  outputQuality: 'high',
  outputFormat: 'mp4',
  bitrate: '8M',
  fps: 30,
  resolution: '1080p',
};

export class ClipWorkflowService {
  private config: ClipConfig;
  /** Lazily-created pipeline instance (heavy, so defer until needed) */
  private _pipeline?: ClipRepurposingPipeline;

  constructor(config: Partial<ClipConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private get pipeline(): ClipRepurposingPipeline {
    if (!this._pipeline) {
      this._pipeline = new ClipRepurposingPipeline();
    }
    return this._pipeline;
  }

  /**
   * 完整剪辑流程 — 轻量路径
   * 
   * 流程：视频分析 → 场景检测 → 静音检测 → 智能剪辑 → 生成时间轴
   *
   * 适用于：基础场景切换剪辑，无需多维评分 / SEO
   *
   * @see processVideoWithPipeline 完整路径（多维评分 + SEO）
   */
  async processVideo(
    videoInfo: VideoInfo,
    scriptSegments?: ScriptSegment[]
  ): Promise<ClipResult> {
    const startTime = Date.now();
    
    // Step 1: 视频分析
    const analysis = await this.analyzeVideo(videoInfo);
    
    // Step 2: 场景切换点（复用 analyzeVideo 已有结果，无需重复调用）
    const sceneChanges = this.config.detectSceneChange
      ? (analysis.scenes || []).map((s) => ({ time: s.startTime, confidence: s.confidence || 0.8 }))
      : [];
    
    // Step 3: 静音检测（VideoAnalysis 暂无音频分段数据，保守返回空）
    const silenceSections: Array<{ start: number; end: number }> = [];
    
    // Step 4: 生成剪辑片段
    const segments = this.generateClips(
      analysis,
      sceneChanges,
      silenceSections,
      scriptSegments
    );
    
    // Step 5: 应用转换效果
    const finalSegments = this.applyTransitions(segments);
    
    const totalDuration = finalSegments.reduce((sum, s) => sum + s.duration, 0);
    const removedDuration = silenceSections.reduce((sum, s) => sum + (s.end - s.start), 0);
    
    return {
      segments: finalSegments,
      totalDuration,
      removedDuration,
      cutPoints: sceneChanges.length,
      metadata: {
        processedAt: new Date().toISOString(),
        config: this.config,
        sceneChanges: sceneChanges.length,
        silenceSections: silenceSections.length,
        pipelineUsed: false,
      },
    };
  }

  /**
   * 完整剪辑流程 — 委托 Pipeline 路径
   * 
   * 委托 ClipRepurposingPipeline 执行：
   *   1. 分析视频（Rust 高光检测 + 场景边界）
   *   2. 多维评分（笑声密度 / 情感峰值 / 语音完整度 / …）
   *   3. SEO 元数据生成
   *   4. 多格式导出准备
   * 
   * 结果转换为 ClipSegment[]（向后兼容 ClipResult）。
   *
   * 适用于：高质量短片段拆条，需要评分排序 / SEO 元数据
   *
   * @param videoInfo 视频信息
   * @param analysis 已有视频分析结果（可避免重复分析）
   * @param pipelineOptions Pipeline 专属选项
   */
  async processVideoWithPipeline(
    videoInfo: VideoInfo,
    analysis: VideoAnalysis | undefined,
    pipelineOptions?: Partial<RepurposingOptions>,
  ): Promise<ClipResult> {
    // 若未传入 analysis， 先做一次轻量分析
    const resolvedAnalysis = analysis ?? await this.analyzeVideo(videoInfo);

    const pipelineResult = await this.pipeline.run(
      videoInfo,
      resolvedAnalysis,
      {
        targetClipCount: pipelineOptions?.targetClipCount ?? 5,
        minClipDuration: pipelineOptions?.minClipDuration ?? 15,
        maxClipDuration: pipelineOptions?.maxClipDuration ?? 120,
        platform: pipelineOptions?.platform ?? 'youtube',
        exportFormats: pipelineOptions?.exportFormats ?? ['9:16'],
        multiFormat: pipelineOptions?.multiFormat ?? false,
        generateSEO: pipelineOptions?.generateSEO ?? false,
        onProgress: pipelineOptions?.onProgress,
      },
    );

    // Pipeline 结果 → ClipSegment[]（向后兼容）
    const sourceId = videoInfo.id || 'source';
    const segments: ClipSegment[] = pipelineResult.clips.map((rep, index) =>
      clipSegmentFromRepurposing(rep, index, sourceId),
    );

    // 应用当前服务的转换效果（向后兼容）
    const finalSegments = this.applyTransitions(segments);

    const totalDuration = finalSegments.reduce((sum, s) => sum + s.duration, 0);
    const removedDuration = 0; // Pipeline 内部已过滤

    return {
      segments: finalSegments,
      totalDuration,
      removedDuration,
      cutPoints: segments.length,
      metadata: {
        processedAt: new Date().toISOString(),
        config: this.config,
        sceneChanges: segments.length,
        silenceSections: 0,
        pipelineUsed: true,
      },
    };
  }

  /**
   * 分析视频
   */
  private async analyzeVideo(videoInfo: VideoInfo): Promise<VideoAnalysis> {
    const { scenes, objects, emotions } = await visionService.detectScenesAdvanced(videoInfo, {
      minSceneDuration: 3,
      detectObjects: true,
      detectEmotions: true,
    });
    return visionService.generateAnalysisReport(videoInfo, scenes, objects, emotions);
  }

  /**
   * 生成剪辑片段
   */
  private generateClips(
    analysis: VideoAnalysis,
    sceneChanges: Array<{ time: number }>,
    silenceSections: Array<{ start: number; end: number }>,
    scriptSegments?: ScriptSegment[]
  ): ClipSegment[] {
    const segments: ClipSegment[] = [];
    let currentTime = 0;
    const duration = this.getAnalysisDuration(analysis);
    
    // 基于场景切换生成片段
    const cutTimes = [0, ...sceneChanges.map(s => s.time), duration];
    
    for (let i = 0; i < cutTimes.length - 1; i++) {
      const start = cutTimes[i];
      const end = cutTimes[i + 1];
      
      // 跳过静音段落
      const isSilence = silenceSections.some(
        s => s.start < end && s.end > start
      );
      
      if (this.config.removeSilence && isSilence) {
        continue;
      }
      
      // 创建片段
      const segment: ClipSegment = {
        id: crypto.randomUUID(),
        _startTime: currentTime,
        endTime: currentTime + (end - start),
        sourceStart: start,
        sourceEnd: end,
        sourceId: analysis.videoId || 'source',
        type: 'video',
        duration: end - start,
      };
      
      // 关联脚本段落
      if (scriptSegments) {
        const relatedScript = scriptSegments[i];
        if (relatedScript) {
          segment.text = relatedScript.content;
        }
      }
      
      segments.push(segment);
      currentTime += segment.duration;
    }
    
    return segments;
  }

  /**
   * 应用转换效果
   */
  private applyTransitions(segments: ClipSegment[]): ClipSegment[] {
    if (!this.config.autoTransition || segments.length < 2) {
      return segments;
    }
    
    return segments.map((segment, index) => {
      if (index === 0) return segment;
      
      return {
        ...segment,
        transition: this.config.transitionType,
      };
    });
  }

  /**
   * 导出时间轴数据
   */
  exportTimeline(segments: ClipSegment[]): object {
    return {
      tracks: [
        {
          id: 'video-track-1',
          type: 'video',
          clips: segments.filter(s => s.type === 'video'),
        },
        {
          id: 'subtitle-track-1',
          type: 'subtitle',
          clips: segments.filter(s => s.type === 'subtitle'),
        },
      ],
      duration: segments.reduce((sum, s) => sum + s.duration, 0),
    };
  }

  /**
   * 获取导出质量配置
   */
  getExportSettings(): ExportSettings {
    const qualityMap: Record<ClipConfig['outputQuality'], { resolution: ExportSettings['resolution']; frameRate: ExportSettings['frameRate']; quality: ExportSettings['quality'] }> = {
      low: { resolution: '720p', frameRate: 24, quality: 'low' },
      medium: { resolution: '1080p', frameRate: 30, quality: 'medium' },
      high: { resolution: '1080p', frameRate: 30, quality: 'high' },
      ultra: { resolution: '4k', frameRate: 60, quality: 'ultra' },
    };
    
    const quality = qualityMap[this.config.outputQuality];
    
    return {
      format: this.config.outputFormat as any,
      resolution: quality.resolution,
      quality: quality.quality,
      fps: quality.frameRate as 24 | 30 | 60,
      includeSubtitles: true,
      includeWatermark: false,
      burnSubtitles: true,
    };
  }

  /**
   * 优化片段质量
   */
  optimizeQuality(segments: ClipSegment[]): ClipSegment[] {
    return segments.map(segment => ({
      ...segment,
      effects: [
        ...(segment.effects || []),
        // 添加质量优化效果
        this.config.outputQuality === 'high' || this.config.outputQuality === 'ultra'
          ? 'denoise' 
          : null,
        'sharpen',
      ].filter((effect): effect is string => Boolean(effect)),
    }));
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ClipConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): ClipConfig {
    return { ...this.config };
  }

  private getAnalysisDuration(analysis: VideoAnalysis): number {
    if (!analysis.scenes || analysis.scenes.length === 0) {
      return 0;
    }
    return Math.max(...analysis.scenes.map((scene) => scene.endTime));
  }
}

// 导出单例
export const clipWorkflowService = new ClipWorkflowService();
export default clipWorkflowService;
