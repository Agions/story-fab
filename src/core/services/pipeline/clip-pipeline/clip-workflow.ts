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

import { visionService } from '../../ai/vision-service';
import { asrService } from '../../asr/asr-service';
import { logger } from '../../../../shared/utils/logging';
import type { VideoInfo, VideoAnalysis, ScriptSegment, ExportSettings } from '@/types';
import { ClipRepurposingPipeline } from './pipeline';
import type { RepurposingOptions } from './pipeline';
import type { ClipConfig, ClipSegment } from './types';
import { clipSegmentFromRepurposing } from './types';
import type { ASRSegment } from '../../asr/asr-types';
import {
  buildSceneChanges,
  isSegmentInSilence,
  attachScriptText,
  applyTransitionsToSegments,
  getAnalysisDuration,
} from './clip-generators';

// 剪辑结果
interface ClipResult {
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
   * 执行 ASR 识别（Rust Whisper 优先，失败则 Mock）
   */
  private async runASR(videoInfo: VideoInfo): Promise<ASRSegment[]> {
    try {
      const result = await asrService.recognizeSpeech(videoInfo);
      return result.segments;
    } catch (err) {
      logger.warn('[ClipWorkflowService] ASR 失败，使用空分段:', String(err));
      return [];
    }
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
    // Step 1: 视频分析
    const analysis = await this.analyzeVideo(videoInfo);

    // Step 2: 场景切换点（复用 analyzeVideo 已有结果，无需重复调用）
    const sceneChanges = buildSceneChanges(analysis, this.config.detectSceneChange);

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
    const finalSegments = applyTransitionsToSegments(segments, this.config);
    
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
   * @param asrSegments 可选：外部传入的 ASR 分段（未传入时自动调用 Rust Whisper）
   */
  async processVideoWithPipeline(
    videoInfo: VideoInfo,
    analysis: VideoAnalysis | undefined,
    pipelineOptions?: Partial<RepurposingOptions>,
    asrSegments?: ASRSegment[],
  ): Promise<ClipResult> {
    // 若未传入 analysis， 先做一次轻量分析
    const resolvedAnalysis = analysis ?? await this.analyzeVideo(videoInfo);

    // ASR 分段：未传入时自动调用 Rust Whisper（本地，离线可用）
    const resolvedASR = asrSegments ?? await this.runASR(videoInfo);

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
      resolvedASR, // 传入 ASR 分段用于 transcript 提取
    );

    // Pipeline 结果 → ClipSegment[]（向后兼容）
    const sourceId = videoInfo.id || 'source';
    const segments: ClipSegment[] = pipelineResult.clips.map((rep) =>
      clipSegmentFromRepurposing(rep, sourceId),
    );

    // 应用当前服务的转换效果（向后兼容）
    const finalSegments = applyTransitionsToSegments(segments, this.config);

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
    const duration = getAnalysisDuration(analysis);

    // 基于场景切换生成片段
    const cutTimes = [0, ...sceneChanges.map(s => s.time), duration];

    for (let i = 0; i < cutTimes.length - 1; i++) {
      const start = cutTimes[i];
      const end = cutTimes[i + 1];

      // 跳过静音段落（使用工具函数，逻辑更清晰）
      if (this.config.removeSilence && isSegmentInSilence(start, end, silenceSections)) {
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

      // 关联脚本段落（委托给工具函数）
      attachScriptText(segment, i, scriptSegments);

      segments.push(segment);
      currentTime += segment.duration;
    }

    return segments;
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
    const qualityMap: Record<ClipConfig['outputQuality'], { resolution: ExportSettings['resolution']; fps: ExportSettings['fps']; quality: ExportSettings['quality'] }> = {
      low: { resolution: '720p', fps: 24, quality: 'low' },
      medium: { resolution: '1080p', fps: 30, quality: 'medium' },
      high: { resolution: '1080p', fps: 30, quality: 'high' },
      ultra: { resolution: '4k', fps: 60, quality: 'ultra' },
    };
    
    const quality = qualityMap[this.config.outputQuality];
    
    return {
      format: (this.config.outputFormat === 'mov' ? 'mp4' : this.config.outputFormat) as ExportSettings['format'],
      resolution: quality.resolution,
      quality: quality.quality,
      fps: quality.fps,
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
}

// 导出单例
export const clipWorkflowService = new ClipWorkflowService();
export default clipWorkflowService;
