/**
 * AI 剪辑分析器
 * 职责：分析视频内容，生成剪辑点和建议
 *
 * 重构说明：
 * - 提取工具函数到 analyzerUtils.ts
 * - 改善命名，使其更具自描述性
 * - 保持原有业务逻辑不变
 */

import { tauri } from '../../tauri';
import { logger } from '@/shared/utils/logging';
import { visionService } from '../ai/vision-service';
import { detectEmotionPeaks, type EmoPeak } from '../video/emotion-detector';
import type { EmotionAnalysis, VideoInfo, Scene } from '@/types';
import { DEFAULT_CLIP_CONFIG } from './types';
import { formatTime as formatSharedTime } from '../../../shared/utils/formatting';
import type {
  AIClipConfig,
  CutPoint,
  ClipSegment,
  ClipSuggestion,
  ClipAnalysisResult,
  Keyframe,
} from './types';
import type { SmartVideoSegment } from '../../video/highlight.types';
import { enrichSegments, type RustRawSegment } from './segment-enricher';

// 导入工具函数
import {
  calculateKeyframeImportance,
  deduplicateCutPoints,
  determineSegmentType,
  calculateSegmentConfidence,
  estimateFinalDuration,
  msToSeconds,
  type SilenceSegment,
  type EmotionPeak as UtilsEmotionPeak,
} from './analyzer-utils';

// ============================================
// 主分析函数
// ============================================

/**
 * 分析视频内容
 * @param videoInfo 视频信息
 * @param config 分析配置
 * @param signal 中断信号
 * @param onProgress 进度回调
 * @returns 分析结果
 */
export async function analyzeVideo(
  videoInfo: VideoInfo,
  config: Partial<AIClipConfig> = {},
  signal?: AbortSignal,
  onProgress?: (pct: number, label: string) => void
): Promise<ClipAnalysisResult> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const fullConfig = { ...DEFAULT_CLIP_CONFIG, ...config };

  // 1. 高级场景检测
  onProgress?.(10, '检测场景切换');
  const { scenes, emotions } = await Promise.all([
    visionService.detectScenesAdvanced(videoInfo, {
      minSceneDuration: 2,
      detectObjects: false,
      detectEmotions: false,
    }),
    Promise.resolve({
      scenes: [] as Scene[],
      objects: [],
      emotions: [] as EmotionAnalysis[],
    }),
  ])
    .then(([r]) => r)
    .catch((err) => {
      logger.warn('[analyzer] detectScenesAdvanced failed:', err);
      return {
        scenes: [] as Scene[],
        objects: [],
        emotions: [] as EmotionAnalysis[],
      };
    });

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  onProgress?.(30, '提取关键帧');

  // 2. 提取关键帧
  const keyframes = fullConfig.detectKeyframes
    ? await detectKeyframes(videoInfo, fullConfig.keyframeInterval)
    : [];

  // 3. 检测静音片段 + 富化智能片段（共享一次 Rust 调用）
  onProgress?.(50, '分析音频特征');
  let enrichedSegments: SmartVideoSegment[] = [];
  const silenceSegments = fullConfig.detectSilence
    ? await detectSilenceSegments(videoInfo, fullConfig, (raw) => {
        // 富化回调：在 detectSilenceSegments 拿到的原始 segments 上跑一次 enrich
        enrichedSegments = enrichSegments(raw);
      })
    : [];

  // 4. 检测情感峰值（ZCR 增强）
  onProgress?.(65, '检测情感峰值');
  const { peaks: rawPeaks }: { peaks: EmoPeak[] } = await detectEmotionPeaks(videoInfo.path, {
    threshold: 1.5,
    minDurationMs: 300,
  }).catch(() => ({ peaks: [] as EmoPeak[] }));

  const emotionPeaks: UtilsEmotionPeak[] = rawPeaks.map((p) => ({
    timestamp: msToSeconds(p.startMs),
    energy: p.energy,
    type: p.type,
  }));

  // 5. 生成剪辑点
  onProgress?.(75, '生成剪辑点');
  const cutPoints = generateCutPoints(
    videoInfo,
    scenes,
    keyframes,
    silenceSegments,
    emotions,
    emotionPeaks,
    fullConfig
  );

  // 6. 生成剪辑片段
  const segments = generateSegments(videoInfo, cutPoints, scenes);

  // 7. 生成AI剪辑建议
  onProgress?.(88, '生成剪辑建议');
  const suggestions = fullConfig.aiOptimize
    ? await generateSuggestions(videoInfo, segments, scenes, fullConfig)
    : [];

  // 8. 计算预估最终时长
  const estimatedFinalDuration = estimateFinalDuration(
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
    keyframeTimestamps: keyframes.map((k) => k.timestamp),
    sceneBoundaries: scenes.map((s) => ({
      start: s.startTime,
      end: s.endTime,
      type: s.type || 'unknown',
    })),
    estimatedFinalDuration,
    emotionPeaks,
    enrichedSegments: enrichedSegments.length > 0 ? enrichedSegments : undefined,
  };
}

// ============================================
// 辅助函数
// ============================================

/**
 * 检测关键帧
 */
async function detectKeyframes(videoInfo: VideoInfo, interval: number): Promise<Keyframe[]> {
  const count = Math.floor(videoInfo.duration / interval);
  const keyframes = await visionService.extractKeyframes(videoInfo, {
    maxFrames: Math.min(count, 20),
  });

  return keyframes.map((kf, index) => ({
    timestamp: kf.timestamp,
    thumbnail: kf.thumbnail,
    importance: calculateKeyframeImportance(index, keyframes.length),
  }));
}

/**
 * 检测静音片段
 *
 * 同时通过 `onRawSegments` 回调把 Rust 返回的**完整** segments 列表抛给调用方，
 * 让上层（比如 analyzeVideo）可以顺手跑一次 `enrichSegments`，
 * 避免在 UI 渲染时再次调用 `tauri.detectSmartSegments` 增加一次 IPC。
 */
async function detectSilenceSegments(
  videoInfo: VideoInfo,
  _config: AIClipConfig,
  onRawSegments?: (raw: RustRawSegment[]) => void,
): Promise<SilenceSegment[]> {
  try {
    const rustSegments = (await tauri.detectSmartSegments(videoInfo.path, {
      minDurationMs: 500,
      maxDurationMs: 30000,
    })) as Array<{
      startMs: number;
      endMs: number;
      segmentType: string;
      durationMs: number;
      silenceRatio?: number;
    }>;

    // 把原始 segments（包含 suggested_speed 等 Rust 字段）抛给上层
    onRawSegments?.(rustSegments as RustRawSegment[]);

    return rustSegments
      .filter((seg) => seg.segmentType === 'Silence' || (seg.silenceRatio ?? 0) > 0.3)
      .map((seg) => ({
        start: msToSeconds(seg.startMs),
        end: msToSeconds(seg.endMs),
        duration: msToSeconds(seg.durationMs),
      }));
  } catch (error) {
    // Rust 失败时返回空，不阻断主流程
    return [];
  }
}

/**
 * 生成剪辑点
 */
function generateCutPoints(
  _videoInfo: VideoInfo,
  scenes: Scene[],
  keyframes: Keyframe[],
  silenceSegments: SilenceSegment[],
  _emotions: EmotionAnalysis[],
  emotionPeaks: UtilsEmotionPeak[],
  config: AIClipConfig
): CutPoint[] {
  const cutPoints: CutPoint[] = [];

  // 场景边界
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
          metadata: { sceneChange: scene.confidence },
        });
      }
    });
  }

  // 关键帧
  if (config.detectKeyframes) {
    keyframes.forEach((kf) => {
      if (kf.importance > 0.5) {
        cutPoints.push({
          id: `kf_${kf.timestamp}`,
          timestamp: kf.timestamp,
          type: 'keyframe',
          confidence: kf.importance,
          description: `关键帧 @ ${formatSharedTime(kf.timestamp)}`,
          suggestedAction: 'keep',
          metadata: { motionScore: kf.importance },
        });
      }
    });
  }

  // 静音片段
  if (config.detectSilence && config.removeSilence) {
    silenceSegments.forEach((silence, index) => {
      cutPoints.push({
        id: `silence_${index}`,
        timestamp: silence.start,
        type: 'silence',
        confidence: 0.9,
        description: `静音片段 (${silence.duration.toFixed(1)}秒)`,
        suggestedAction: 'remove',
        metadata: { audioLevel: -50 },
      });
    });
  }

  // 情感峰值
  const EMOTION_ENERGY_THRESHOLD = 60;
  if (config.detectEmotion && config.aiOptimize && emotionPeaks.length > 0) {
    for (const peak of emotionPeaks) {
      if (peak.energy > EMOTION_ENERGY_THRESHOLD) {
        cutPoints.push({
          id: `emo_${peak.timestamp.toFixed(2)}`,
          timestamp: peak.timestamp,
          type: 'emotion',
          confidence: peak.energy / 100,
          description: `情感峰值: ${peak.type} (能量 ${peak.energy})`,
          suggestedAction: 'keep',
          metadata: { emotionScore: peak.energy / 100 },
        });
      }
    }
  }

  return deduplicateCutPoints(cutPoints.sort((a, b) => a.timestamp - b.timestamp));
}

/**
 * 生成剪辑片段
 */
function generateSegments(
  videoInfo: VideoInfo,
  cutPoints: CutPoint[],
  scenes: Scene[]
): ClipSegment[] {
  if (cutPoints.length === 0) {
    return [
      {
        id: crypto.randomUUID(),
        startTime: 0,
        endTime: videoInfo.duration,
        duration: videoInfo.duration,
        type: 'video',
        content: '完整视频',
        confidence: 1,
        cutPoints: [],
        suggestions: [],
      },
    ];
  }

  const segments: ClipSegment[] = [];
  let currentStart = 0;

  for (let i = 0; i <= cutPoints.length; i++) {
    const endTime = i < cutPoints.length ? cutPoints[i].timestamp : videoInfo.duration;

    if (endTime > currentStart) {
      const segmentCutPoints = cutPoints.filter(
        (cp) => cp.timestamp >= currentStart && cp.timestamp <= endTime
      );

      const scene = scenes.find((s) => s.startTime <= currentStart && s.endTime >= endTime);

      segments.push({
        id: crypto.randomUUID(),
        startTime: currentStart,
        endTime,
        duration: endTime - currentStart,
        type: determineSegmentType(segmentCutPoints),
        content: scene?.description || `片段 ${segments.length + 1}`,
        thumbnail: scene?.thumbnail,
        confidence: calculateSegmentConfidence(segmentCutPoints),
        cutPoints: segmentCutPoints,
        suggestions: [],
      });
    }
    currentStart = endTime;
  }

  return segments;
}

/**
 * 生成剪辑建议
 */
async function generateSuggestions(
  videoInfo: VideoInfo,
  segments: ClipSegment[],
  _scenes: Scene[],
  config: AIClipConfig
): Promise<ClipSuggestion[]> {
  const suggestions: ClipSuggestion[] = [];

  // 建议移除静音
  const silenceSegments = segments.filter((s) => s.type === 'silence');
  silenceSegments.forEach((segment) => {
    suggestions.push({
      id: crypto.randomUUID(),
      type: 'trim',
      startTime: segment.startTime,
      endTime: segment.endTime,
      description: `移除静音片段 (${segment.duration.toFixed(1)}秒)`,
      reason: '这段音频几乎没有声音，移除后可以提升视频节奏',
      confidence: 0.9,
      autoApplicable: true,
    });
  });

  // 建议合并短片段
  const shortSegments = segments.filter((s) => s.duration < 1.5 && s.type !== 'silence');
  for (let i = 0; i < shortSegments.length - 1; i++) {
    const current = shortSegments[i];
    const next = shortSegments[i + 1];
    if (next.startTime - current.endTime < 1) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'merge',
        startTime: current.startTime,
        endTime: next.endTime,
        description: `合并短片段 (${current.duration.toFixed(1)}s + ${next.duration.toFixed(1)}s)`,
        reason: '两个片段都很短且相邻，合并后观看体验更好',
        confidence: 0.75,
        autoApplicable: true,
      });
    }
  }

  // 建议添加转场
  const sceneChanges = segments.filter((s) => s.cutPoints.some((cp) => cp.type === 'scene'));
  sceneChanges.forEach((segment, index) => {
    if (index < sceneChanges.length - 1) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'effect',
        startTime: segment.endTime,
        endTime: segment.endTime + 0.5,
        description: `添加${config.transitionType}转场`,
        reason: '场景切换处添加转场效果可以使过渡更自然',
        confidence: 0.8,
        autoApplicable: config.autoTransition,
      });
    }
  });

  // 基于目标时长的建议
  if (config.targetDuration) {
    const currentDuration = segments
      .filter((s) => s.type !== 'silence')
      .reduce((sum, s) => sum + s.duration, 0);

    if (currentDuration > config.targetDuration * 1.2) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'trim',
        startTime: 0,
        endTime: videoInfo.duration,
        description: `压缩视频至目标时长 (${config.targetDuration}秒)`,
        reason: `当前预估时长 ${Math.round(currentDuration)}秒，建议精简内容`,
        confidence: 0.7,
        autoApplicable: false,
      });
    }
  }

  // 节奏优化建议
  if (config.pacingStyle === 'fast') {
    const slowSegments = segments.filter((s) => s.duration > 10);
    slowSegments.forEach((segment) => {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'trim',
        startTime: segment.startTime,
        endTime: segment.endTime,
        description: `加速长片段 (${segment.duration.toFixed(1)}秒)`,
        reason: '选择快速节奏模式，建议缩短长片段',
        confidence: 0.65,
        autoApplicable: false,
      });
    });
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
