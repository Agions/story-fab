/**
 * AIClip 启发式算法
 *
 * 基于视频内容特征（时长/音频能量/场景复杂度）智能决定：
 * 1. trim 策略 — 超长片段如何裁剪
 * 2. 情感峰值阈值 — 自适应能量阈值
 * 3. 剪辑点选择优先级
 */

import type { CutPoint, ClipSegment } from './types';

/** AIClip 内容特征 */
export interface AIClipContentProfile {
  /** 视频总时长（秒） */
  duration: number;
  /** 预估音频能量分布：low=安静，medium=普通，high=活泼 */
  audioEnergy: 'low' | 'medium' | 'high';
  /** 内容复杂度：simple=单一场景，normal=普通，complex=多场景多人物 */
  complexity: 'simple' | 'normal' | 'complex';
  /** 情感峰值数量 */
  emotionPeakCount: number;
  /** 场景切换数量 */
  sceneCount: number;
}

/** trim 策略配置 */
export interface TrimStrategy {
  /** 最大保留时长（秒），0=不限制 */
  maxDuration: number;
  /** 最小保留时长（秒） */
  minDuration: number;
  /** 优先保留的位置：start/middle/end */
  preservePosition: 'start' | 'middle' | 'end' | 'balanced';
  /** 是否启用智能合并短片段 */
  smartMerge: boolean;
}

/**
 * 根据内容特征生成 trim 策略
 * 启发式规则：
 * - 短视频（<60s）：不 trim
 * - 中视频（60-300s）：智能裁剪到目标时长
 * - 长视频（>300s）：强制裁剪，优先保留高能量段落
 */
export function generateTrimStrategy(
  profile: AIClipContentProfile,
  targetDuration?: number,
): TrimStrategy {
  const { duration, complexity, emotionPeakCount, sceneCount } = profile;

  // 短视频不 trim
  if (duration < 60) {
    return {
      maxDuration: 0, // 不限制
      minDuration: 15,
      preservePosition: 'balanced',
      smartMerge: true,
    };
  }

  // 长视频强制 trim
  if (duration > 300) {
    const _peakBonus = emotionPeakCount > 10 ? 30 : emotionPeakCount > 5 ? 15 : 0;
    return {
      maxDuration: targetDuration ?? Math.min(duration, 180),
      minDuration: 20,
      preservePosition: 'balanced',
      smartMerge: true,
    };
  }

  // 中等视频：智能决策
  const hasManyPeaks = emotionPeakCount > 5;
  const isComplex = complexity === 'complex' || sceneCount > 10;

  return {
    maxDuration: targetDuration ?? Math.min(duration, 120),
    minDuration: 15,
    preservePosition: hasManyPeaks || isComplex ? 'balanced' : 'start',
    smartMerge: true,
  };
}

/**
 * 自适应情感阈值
 *
 * 启发式规则：
 * - 高能量内容（audioEnergy=high）：阈值上调，避免过多剪辑点
 * - 低能量内容（audioEnergy=low）：阈值下调，避免遗漏情感段落
 * - 复杂内容（complex）：阈值降低，确保关键段落不被遗漏
 */
export function getAdaptiveEmotionThreshold(
  profile: AIClipContentProfile,
  baseThreshold: number = 60,
): number {
  const { audioEnergy, complexity, duration } = profile;

  let threshold = baseThreshold;

  // 音频能量调节
  if (audioEnergy === 'high') {
    threshold += 10; // 高能量内容减少敏感度
  } else if (audioEnergy === 'low') {
    threshold -= 15; // 低能量内容增加敏感度
  }

  // 复杂度调节
  if (complexity === 'complex') {
    threshold -= 10; // 复杂内容需要更低的阈值
  }

  // 时长调节：超长视频需要更激进的过滤
  if (duration > 300) {
    threshold += 5;
  } else if (duration < 60) {
    threshold -= 10;
  }

  // 限制范围 [20, 90]
  return Math.max(20, Math.min(90, threshold));
}

/**
 * 剪辑点优先级排序
 *
 * 启发式规则：
 * 1. 情感峰值 → 最高优先级（高能量时刻）
 * 2. 场景切换 → 中等优先级（自然断点）
 * 3. 关键帧 → 低优先级（视觉变化）
 * 4. 静音片段 → 最低优先级（待移除）
 */
export type CutPointPriority = 'emotion' | 'scene' | 'keyframe' | 'silence';

export function getCutPointPriority(type: CutPoint['type']): number {
  const priorities: Record<CutPointPriority, number> = {
    emotion: 4,
    scene: 3,
    keyframe: 2,
    silence: 1,
  };
  return priorities[type as CutPointPriority] ?? 2;
}

/**
 * 过滤并排序剪辑点
 * - 去重（时间相近的合并）
 * - 按优先级排序
 * - 应用自适应阈值
 */
export function filterAndRankCutPoints(
  cutPoints: CutPoint[],
  profile: AIClipContentProfile,
  options: { maxPoints?: number; minConfidence?: number } = {},
): CutPoint[] {
  const { maxPoints = 20, minConfidence = 0.3 } = options;
  const threshold = getAdaptiveEmotionThreshold(profile);

  // 1. 过滤低置信度
  let filtered = cutPoints.filter(cp => cp.confidence >= minConfidence);

  // 2. 应用自适应阈值（情感类型需要高于阈值）
  filtered = filtered.filter(cp => {
    if (cp.type === 'emotion') {
      return cp.confidence * 100 >= threshold;
    }
    return true;
  });

  // 3. 按优先级 + 置信度排序
  filtered.sort((a, b) => {
    const priorityDiff = getCutPointPriority(b.type) - getCutPointPriority(a.type);
    if (priorityDiff !== 0) return priorityDiff;
    return b.confidence - a.confidence;
  });

  // 4. 限制数量 + 去重（时间相近的）
  const deduped: CutPoint[] = [];
  const minGap = 0.3; // 秒

  for (const cp of filtered) {
    const last = deduped[deduped.length - 1];
    if (!last || Math.abs(cp.timestamp - last.timestamp) >= minGap) {
      deduped.push(cp);
    } else if (cp.confidence > last.confidence) {
      deduped[deduped.length - 1] = cp;
    }
    if (deduped.length >= maxPoints) break;
  }

  return deduped;
}

/**
 * 估算剪辑后时长
 * 基于 trim 策略和静音检测结果
 */
export function estimateTrimmedDuration(
  segments: ClipSegment[],
  strategy: TrimStrategy,
): number {
  let total = 0;

  for (const seg of segments) {
    let duration = seg.endTime - seg.startTime;

    // 应用 maxDuration 裁剪
    if (strategy.maxDuration > 0 && duration > strategy.maxDuration) {
      duration = strategy.maxDuration;
    }

    // 跳过过短片段
    if (duration >= strategy.minDuration) {
      total += duration;
    }
  }

  return total;
}

/**
 * 生成剪辑建议原因描述
 * 用于 UI 展示
 */
export function buildClipSuggestionReason(
  type: 'trim' | 'merge' | 'remove' | 'transition',
  duration: number,
  energy?: number,
): string {
  switch (type) {
    case 'trim':
      return energy !== undefined
        ? `长片段 (${duration.toFixed(1)}s) 能量 ${energy}，建议裁剪`
        : `长片段 (${duration.toFixed(1)}s)，建议裁剪`;
    case 'merge':
      return `短片段 (${duration.toFixed(1)}s)，建议合并`;
    case 'remove':
      return `静音片段 (${duration.toFixed(1)}s)，建议移除`;
    case 'transition':
      return `场景切换，建议添加转场`;
    default:
      return '自动优化建议';
  }
}