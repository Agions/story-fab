/**
 * ClipRepurposingPipeline — 长视频 → 多短片段自动拆条
 *
 * 完整管道：
 *   1. 分析视频 → 识别高光候选片段
 *   2. 多维评分 → 排序选择最佳片段
 *   3. SEO 元数据生成 → 每片段标题/描述/hashtags
 *   4. 多格式导出 → 9:16 / 1:1 / 16:9
 *
 * 使用方式：
 *   const pipeline = new ClipRepurposingPipeline();
 *   const result = await pipeline.run(videoInfo, analysis, options);
 */

import { logger } from '@/utils/logger';
import type { VideoInfo, VideoAnalysis } from '@/core/types';
import type { CandidateClip, ClipScore } from './clipScorer';
import type { SEOMetadata, SocialPlatform } from './seoGenerator';
import type { AspectRatio } from './multiFormatExport';

import { ClipScorer, clipScorer } from './clipScorer';
import { SEOGenerator } from './seoGenerator';
import { multiFormatExporter, type ExportTask } from './multiFormatExport';

// ============================================================
// Types
// ============================================================

export interface RepurposingOptions {
  /** 目标片段数量 */
  targetClipCount?: number;
  /** 最短片段时长（秒） */
  minClipDuration?: number;
  /** 最长片段时长（秒） */
  maxClipDuration?: number;
  /** 目标平台 */
  platform?: SocialPlatform;
  /** 导出格式列表 */
  exportFormats?: AspectRatio[];
  /** 是否启用多格式导出 */
  multiFormat?: boolean;
  /** 是否生成 SEO 元数据 */
  generateSEO?: boolean;
  /** 进度回调 */
  onProgress?: (stage: PipelineStage, progress: number, message?: string) => void;
}

export type PipelineStage =
  | 'analyzing'
  | 'scoring'
  | 'generating_seo'
  | 'exporting';

export interface RepurposingClip {
  clip: CandidateClip;
  score: ClipScore;
  seo?: SEOMetadata;
  exportTasks?: ExportTask[];
}

export interface RepurposingResult {
  clips: RepurposingClip[];
  totalInputDuration: number;
  totalOutputDuration: number;
  platform: SocialPlatform;
  exportedFormats: AspectRatio[];
}

export const DEFAULT_REPURPOSING_OPTIONS: Required<RepurposingOptions> = {
  targetClipCount: 5,
  minClipDuration: 15,
  maxClipDuration: 120,
  platform: 'youtube',
  exportFormats: ['9:16'],
  multiFormat: false,
  generateSEO: true,
  onProgress: () => {},
};

// ============================================================
// Pipeline
// ============================================================

export class ClipRepurposingPipeline {
  private scorer: ClipScorer;
  private seoGenerator: SEOGenerator;

  constructor() {
    this.scorer = clipScorer;
    this.seoGenerator = new SEOGenerator('zh');
  }

  /**
   * 执行完整的拆条管道
   */
  async run(
    videoInfo: VideoInfo,
    analysis: VideoAnalysis,
    options?: RepurposingOptions,
  ): Promise<RepurposingResult> {
    const opts: Required<RepurposingOptions> = {
      ...DEFAULT_REPURPOSING_OPTIONS,
      ...options,
    };
    const { onProgress } = opts;

    logger.info('[ClipRepurposingPipeline] 开始执行', {
      videoDuration: videoInfo.duration,
      targetClips: opts.targetClipCount,
      platform: opts.platform,
    });

    // ── Stage 1: 构建候选片段 ──────────────────────────────
    onProgress('analyzing', 10, '识别高光候选片段...');
    const candidates = this.buildCandidates(videoInfo, analysis);
    logger.info(`[ClipRepurposingPipeline] 生成 ${candidates.length} 个候选片段`);

    // ── Stage 2: 多维评分 ─────────────────────────────────
    onProgress('scoring', 30, '多维评分排序...');
    const scored = this.scorer.topClips(candidates);
    logger.info(`[ClipRepurposingPipeline] 评分完成，top ${scored.length} 个片段`);

    // ── Stage 3: SEO 元数据生成 ───────────────────────────
    let seoResults: SEOMetadata[] = [];
    if (opts.generateSEO) {
      onProgress('generating_seo', 50, '生成 SEO 元数据...');
      seoResults = this.seoGenerator.generateBatch(scored, {
        platform: opts.platform,
        includeNativeHashtags: true,
      });
      logger.info('[ClipRepurposingPipeline] SEO 元数据生成完成');
    }

    // ── Stage 4: 准备导出任务 ─────────────────────────────
    const exportTasks: Map<string, ExportTask[]> = new Map();
    if (opts.multiFormat && opts.exportFormats.length > 0) {
      onProgress('exporting', 70, '准备导出任务...');
      for (const clip of scored) {
        const tasks = multiFormatExporter.prepareExportTasks({
          clipId: `clip_${clip.clip.startTime}_${clip.clip.endTime}`,
          sourceVideoPath: videoInfo.path ?? videoInfo.id,
          startTime: clip.clip.startTime,
          endTime: clip.clip.endTime,
          formats: opts.exportFormats,
          outputDir: '/tmp/cutdeck-exports',
          quality: 'high',
        });
        exportTasks.set(clip.clip.startTime.toString(), tasks);
      }
      logger.info('[ClipRepurposingPipeline] 导出任务准备完成');
    }

    // ── 组装结果 ──────────────────────────────────────────
    const repurposingClips: RepurposingClip[] = scored.map((s, i) => ({
      clip: s.clip,
      score: s,
      seo: seoResults[i],
      exportTasks: exportTasks.get(s.clip.startTime.toString()),
    }));

    const totalOutputDuration = scored.reduce(
      (sum, s) => sum + (s.clip.endTime - s.clip.startTime), 0
    );

    logger.info('[ClipRepurposingPipeline] 管道完成', {
      outputClips: scored.length,
      totalOutputDuration,
    });

    return {
      clips: repurposingClips,
      totalInputDuration: videoInfo.duration,
      totalOutputDuration,
      platform: opts.platform,
      exportedFormats: opts.multiFormat ? opts.exportFormats : ['9:16'],
    };
  }

  // ============================================================
  // Private
  // ============================================================

  /**
   * 从 VideoAnalysis 构建候选片段
   *
   * 策略：
   * 1. 以场景边界为主要断点
   * 2. 结合 ASR 情感峰值（如果有）
   * 3. 每个候选片段满足 min-max 时长约束
   */
  private buildCandidates(videoInfo: VideoInfo, analysis: VideoAnalysis): CandidateClip[] {
    const { scenes = [] } = analysis;
    const candidates: CandidateClip[] = [];

    if (scenes.length === 0) {
      // 无场景数据时，按时间均匀切分
      return this.buildUniformCandidates(videoInfo.duration, 30, 90);
    }

    // 以场景为候选片段
    for (const scene of scenes) {
      const duration = scene.endTime - scene.startTime;

      // 时长过滤：太短的跳过
      if (duration < 10) continue;

      // 时长过长：拆分为多个候选
      if (duration > 120) {
        const subClips = this.splitLongScene(scene.startTime, scene.endTime, 60, 90);
        candidates.push(...subClips);
        continue;
      }

      candidates.push({
        startTime: scene.startTime,
        endTime: scene.endTime,
        sceneType: scene.type ?? 'default',
        transcript: this.extractSceneTranscript(analysis, scene.startTime, scene.endTime),
      });
    }

    return candidates;
  }

  /**
   * 拆分长场景为多个候选片段
   */
  private splitLongScene(
    start: number,
    end: number,
    minDuration: number,
    idealDuration: number,
  ): CandidateClip[] {
    const clips: CandidateClip[] = [];
    let cursor = start;

    while (cursor < end) {
      const clipEnd = Math.min(cursor + idealDuration, end);
      clips.push({
        startTime: cursor,
        endTime: clipEnd,
        sceneType: 'split',
        transcript: '',
      });
      cursor = clipEnd;
    }

    return clips;
  }

  /**
   * 按均匀时长切分（无场景数据时的 fallback）
   */
  private buildUniformCandidates(
    totalDuration: number,
    minDuration: number,
    idealDuration: number,
  ): CandidateClip[] {
    const clips: CandidateClip[] = [];
    let cursor = 0;

    while (cursor < totalDuration) {
      const remaining = totalDuration - cursor;
      if (remaining < minDuration) break;

      const clipDuration = Math.min(idealDuration, remaining);
      clips.push({
        startTime: cursor,
        endTime: cursor + clipDuration,
        sceneType: 'uniform',
        transcript: '',
      });
      cursor += clipDuration;
    }

    return clips;
  }

  /**
   * 从 analysis 中提取指定时间范围的文本（如果有 ASR 数据）
   */
  private extractSceneTranscript(
    analysis: VideoAnalysis,
    startTime: number,
    endTime: number,
  ): string {
    // 目前从 summary 中近似（未来可接入 ASR 字幕数据）
    return analysis.summary ?? '';
  }
}

export const clipRepurposingPipeline = new ClipRepurposingPipeline();
export default clipRepurposingPipeline;
