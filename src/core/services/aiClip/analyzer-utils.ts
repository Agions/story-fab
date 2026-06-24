/**
 * 视频分析工具函数
 * 职责：提供视频分析相关的通用工具函数
 *
 * 重构说明：
 * - 从原 analyzer.ts (475行) 中提取工具函数
 * - 职责单一，便于复用和测试
 * - 类型从 ./types 重新导出，保持单一类型源
 */

import { MS_PER_SECOND } from '@/shared/utils';

// 从 types 重新导出，保持单一类型源
export type { CutPoint, ClipSegment, ClipSuggestion } from './types';
import type { CutPoint, ClipSegment } from './types';

// SilenceSegment 和 EmotionPeak 是 analyzerUtils 的内部类型，不从 types 导出
// 重新定义以保持自包含
export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
}

export interface EmotionPeak {
  timestamp: number;
  energy: number;
  type: string;
}

// ============================================
// 工具函数
// ============================================

/**
 * 计算关键帧重要性
 * @param index 关键帧索引
 * @param total 总关键帧数
 * @returns 重要性分数 (0-1)
 */
export function calculateKeyframeImportance(index: number, total: number): number {
  const safeTotal = Math.max(total, 1);
  const position = index / safeTotal;
  const positionWeight = Math.sin(position * Math.PI);
  const distributionWeight = 1 - Math.abs(0.5 - position) * 0.5;
  return Math.min(1, (positionWeight + distributionWeight) / 2);
}

/**
 * 去重剪辑点
 * @param cutPoints 剪辑点列表
 * @param minGap 最小间隔（秒）
 * @returns 去重后的剪辑点列表
 */
export function deduplicateCutPoints(cutPoints: CutPoint[], minGap: number = 0.5): CutPoint[] {
  const result: CutPoint[] = [];

  for (const point of cutPoints) {
    const lastPoint = result[result.length - 1];
    if (!lastPoint || Math.abs(point.timestamp - lastPoint.timestamp) >= minGap) {
      result.push(point);
    } else if (point.confidence > lastPoint.confidence) {
      result[result.length - 1] = point;
    }
  }

  return result;
}

/**
 * 确定片段类型
 * @param cutPoints 剪辑点列表
 * @returns 片段类型
 */
export function determineSegmentType(cutPoints: CutPoint[]): ClipSegment['type'] {
  if (cutPoints.some((cp) => cp.type === 'silence')) return 'silence';
  if (cutPoints.some((cp) => cp.type === 'keyframe')) return 'keyframe';
  return 'video';
}

/**
 * 计算片段置信度
 * @param cutPoints 剪辑点列表
 * @returns 置信度分数 (0-1)
 */
export function calculateSegmentConfidence(cutPoints: CutPoint[]): number {
  if (cutPoints.length === 0) return 0.5;

  let audioSum = 0,
    audioCount = 0;
  let sceneSum = 0,
    sceneCount = 0;
  let emotionSum = 0,
    emotionCount = 0;

  for (const cp of cutPoints) {
    if (cp.type === 'scene') {
      sceneSum += cp.confidence;
      sceneCount++;
    } else if (cp.type === 'emotion') {
      emotionSum += cp.confidence;
      emotionCount++;
    } else {
      audioSum += cp.confidence;
      audioCount++;
    }
  }

  const audioConf = audioCount ? (audioSum / audioCount) * 0.4 : 0;
  const sceneConf = sceneCount ? (sceneSum / sceneCount) * 0.4 : 0;
  const emotionConf = emotionCount ? (emotionSum / emotionCount) * 0.2 : 0;

  return Math.min(1, audioConf + sceneConf + emotionConf);
}

/**
 * 估算最终时长
 * @param originalDuration 原始时长（秒）
 * @param silenceSegments 静音片段
 * @param segments 视频片段
 * @param config 配置
 * @returns 估算时长（秒）
 */
export function estimateFinalDuration(
  originalDuration: number,
  silenceSegments: SilenceSegment[],
  segments: ClipSegment[],
  config: {
    removeSilence?: boolean;
    trimDeadTime?: boolean;
    autoTransition?: boolean;
  }
): number {
  let estimated = originalDuration;

  if (config.removeSilence) {
    const totalSilence = silenceSegments.reduce((sum, s) => sum + s.duration, 0);
    estimated -= totalSilence;
  }

  if (config.trimDeadTime) {
    const deadTime = segments
      .filter((s) => s.duration < 0.5)
      .reduce((sum, s) => sum + s.duration, 0);
    estimated -= deadTime;
  }

  if (config.autoTransition) {
    const transitionCount = segments.length - 1;
    estimated += transitionCount * 0.3;
  }

  return Math.max(0, estimated);
}

/**
 * 转换毫秒到秒
 * @param ms 毫秒
 * @returns 秒
 */
export function msToSeconds(ms: number): number {
  return ms / MS_PER_SECOND;
}

