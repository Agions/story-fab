/**
 * 字幕-场景对齐层 (Subtitle-Scene Aligner)
 * 
 * 功能：将 AI 生成的脚本段落与 Whisper 精确时间戳进行语义对齐
 * 问题背景：AI 返回的 start/end 是视频级近似值，实际应该用 Whisper 字幕的时间戳
 */

import type { ScriptSegment } from '@/core/types';
import type { WhisperResult, WhisperSegment } from './subtitle.service';

// ============================================
// 类型定义
// ============================================

/** 对齐选项 */
export interface AlignerOptions {
  /** 时间容差窗口（秒）：在此窗口内寻找最匹配的 Whisper 片段 */
  timeTolerance?: number;
  /** 是否启用语义相似度匹配（否则仅用时间匹配） */
  enableSemanticMatch?: boolean;
  /** 语义相似度权重 (0-1)，越高越依赖语义而非时间 */
  semanticWeight?: number;
}

const DEFAULT_OPTIONS: Required<AlignerOptions> = {
  timeTolerance: 10,        // ±10秒窗口
  enableSemanticMatch: true,
  semanticWeight: 0.6,
};

// ============================================
// 文本相似度工具
// ============================================

/**
 * 计算两个文本之间的词重叠相似度 (Jaccard)
 */
function wordOverlapSimilarity(text1: string, text2: string): number {
  const normalize = (t: string) =>
    t.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // 保留中文、英文、数字、空格
      .split(/\s+/)
      .filter(w => w.length > 0);

  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));

  if (words1.size === 0 && words2.size === 0) return 0;
  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * 简单的余弦相似度（基于词频向量）
 */
function cosineSimilarity(text1: string, text2: string): number {
  const normalize = (t: string) =>
    t.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);

  const words1 = normalize(text1);
  const words2 = normalize(text2);

  if (words1.length === 0 && words2.length === 0) return 0;
  if (words1.length === 0 || words2.length === 0) return 0;

  const tf1 = buildTermFrequency(words1);
  const tf2 = buildTermFrequency(words2);

  const allTerms = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const term of allTerms) {
    const v1 = tf1[term] || 0;
    const v2 = tf2[term] || 0;
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * 构建词频表
 */
function buildTermFrequency(words: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const w of words) {
    tf[w] = (tf[w] || 0) + 1;
  }
  return tf;
}

/**
 * 计算综合相似度（词重叠 + 余弦）
 */
function computeSimilarity(text1: string, text2: string): number {
  const overlap = wordOverlapSimilarity(text1, text2);
  const cosine = cosineSimilarity(text1, text2);
  // 加权平均
  return 0.4 * overlap + 0.6 * cosine;
}

// ============================================
// 核心对齐算法
// ============================================

/**
 * 在时间线上找到与给定时间最接近的 Whisper 片段索引
 */
function _findClosestWhisperSegmentIndex(
  scriptSegment: ScriptSegment,
  whisperSegments: WhisperSegment[],
  timeTolerance: number
): number | null {
  // 将 scriptSegment 的 startTime 从秒转为毫秒
  const scriptStartMs = scriptSegment.startTime * 1000;
  const scriptEndMs = scriptSegment.endTime * 1000;

  let closestIndex: number | null = null;
  let smallestDistance = Infinity;

  for (let i = 0; i < whisperSegments.length; i++) {
    const ws = whisperSegments[i];

    // 计算时间距离：
    // 如果有时间重叠，距离为 0
    // 否则为最近的端点距离
    const overlapStart = Math.max(scriptStartMs, ws.start_ms);
    const overlapEnd = Math.min(scriptEndMs, ws.end_ms);
    const distance = overlapStart > overlapEnd
      ? Math.min(
          Math.abs(scriptStartMs - ws.end_ms),
          Math.abs(scriptEndMs - ws.start_ms)
        )
      : 0;

    if (distance <= timeTolerance * 1000 && distance < smallestDistance) {
      smallestDistance = distance;
      closestIndex = i;
    }
  }

  // 如果没有找到重叠的，扩大搜索范围找最近的
  if (closestIndex === null) {
    for (let i = 0; i < whisperSegments.length; i++) {
      const ws = whisperSegments[i];
      const wsCenterMs = (ws.start_ms + ws.end_ms) / 2;
      const scriptCenterMs = (scriptStartMs + scriptEndMs) / 2;
      const distance = Math.abs(wsCenterMs - scriptCenterMs);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = i;
      }
    }
  }

  return closestIndex;
}

/**
 * 对单个脚本段落进行语义 + 时间对齐
 */
function alignSingleSegment(
  scriptSegment: ScriptSegment,
  whisperSegments: WhisperSegment[],
  options: Required<AlignerOptions>
): { startTime: number; endTime: number; similarity: number } {
  const { timeTolerance, enableSemanticMatch, semanticWeight } = options;

  // 步骤 1：在时间窗口内找候选片段
  const candidates: Array<{ index: number; distance: number }> = [];
  const scriptStartMs = scriptSegment.startTime * 1000;
  const scriptEndMs = scriptSegment.endTime * 1000;

  for (let i = 0; i < whisperSegments.length; i++) {
    const ws = whisperSegments[i];
    const overlapStart = Math.max(scriptStartMs, ws.start_ms);
    const overlapEnd = Math.min(scriptEndMs, ws.end_ms);
    const distance = overlapStart > overlapEnd
      ? Math.min(
          Math.abs(scriptStartMs - ws.end_ms),
          Math.abs(scriptEndMs - ws.start_ms)
        )
      : 0;

    if (distance <= timeTolerance * 1000) {
      candidates.push({ index: i, distance });
    }
  }

  // 步骤 2：如果启用了语义匹配，从候选中选择最佳匹配
  //        如果没有候选，扩大到全部片段
  const searchSet = candidates.length > 0
    ? candidates
    : whisperSegments.map((_, i) => ({ index: i, distance: Infinity }));

  const scriptText = scriptSegment.content || scriptSegment.text || '';

  let bestMatch: { index: number; score: number } | null = null;

  for (const { index, distance } of searchSet) {
    const ws = whisperSegments[index];
    const wsText = ws.text || '';

    let similarity = 0;
    if (enableSemanticMatch && scriptText) {
      similarity = computeSimilarity(scriptText, wsText);
    }

    // 综合分数：语义相似度 + 时间接近度
    // 时间分数：距离越近分数越高 (1 - normalized_distance)
    const maxDistance = timeTolerance * 1000 * 2; // 归一化参考
    const timeScore = 1 - Math.min(distance, maxDistance) / maxDistance;

    // 总分 = 语义权重 * 语义分数 + (1 - 语义权重) * 时间分数
    const totalScore = semanticWeight * similarity + (1 - semanticWeight) * timeScore;

    if (!bestMatch || totalScore > bestMatch.score) {
      bestMatch = { index, score: totalScore };
    }
  }

  if (!bestMatch) {
    // 兜底：使用原时间
    return {
      startTime: scriptSegment.startTime,
      endTime: scriptSegment.endTime,
      similarity: 0,
    };
  }

  const matchedWs = whisperSegments[bestMatch.index];
  const finalSimilarity = enableSemanticMatch && scriptText
    ? computeSimilarity(scriptText, matchedWs.text || '')
    : 1;

  return {
    startTime: matchedWs.start_ms / 1000,
    endTime: matchedWs.end_ms / 1000,
    similarity: finalSimilarity,
  };
}

// ============================================
// 主导出函数
// ============================================

/**
 * 将 AI 脚本段落与 Whisper 精确时间戳对齐
 *
 * @param scriptSegments - AI 生成的脚本段落（具有近似时间）
 * @param whisperResult - Whisper 转录结果（具有精确时间戳）
 * @param options - 对齐选项
 * @returns 时间戳精准对齐的 ScriptSegment[]
 *
 * @example
 * ```typescript
 * const alignedSegments = alignScriptWithSubtitles(scriptSegments, whisperResult, {
 *   timeTolerance: 10,
 *   enableSemanticMatch: true,
 *   semanticWeight: 0.6,
 * });
 * ```
 */
export function alignScriptWithSubtitles(
  scriptSegments: ScriptSegment[],
  whisperResult: WhisperResult,
  options: AlignerOptions = {}
): ScriptSegment[] {
  const mergedOptions: Required<AlignerOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const { segments: whisperSegments } = whisperResult;

  // 边界情况处理
  if (!scriptSegments || scriptSegments.length === 0) {
    return [];
  }
  if (!whisperSegments || whisperSegments.length === 0) {
    // 没有 Whisper 结果时，返回原始段落但清除时间
    return scriptSegments.map(seg => ({
      ...seg,
      startTime: 0,
      endTime: 0,
    }));
  }

  // 按时间排序 whisper 片段（确保对齐顺序）
  const sortedWhisperSegments = [...whisperSegments].sort(
    (a, b) => a.start_ms - b.start_ms
  );

  return scriptSegments.map(scriptSegment => {
    const aligned = alignSingleSegment(
      scriptSegment,
      sortedWhisperSegments,
      mergedOptions
    );

    return {
      ...scriptSegment,
      startTime: aligned.startTime,
      endTime: aligned.endTime,
    };
  });
}

// ============================================
// 辅助函数
// ============================================

/**
 * 批量对齐并返回详细的对齐报告
 */
export interface AlignmentReport {
  originalSegments: ScriptSegment[];
  alignedSegments: ScriptSegment[];
  whisperSegments: WhisperSegment[];
  alignments: Array<{
    scriptIndex: number;
    whisperIndex: number | null;
    similarity: number;
    timeBefore: { start: number; end: number };
    timeAfter: { start: number; end: number };
  }>;
}

/**
 * 生成对齐详细报告（用于调试和分析）
 */
export function alignScriptWithSubtitlesAndReport(
  scriptSegments: ScriptSegment[],
  whisperResult: WhisperResult,
  options: AlignerOptions = {}
): AlignmentReport {
  const mergedOptions: Required<AlignerOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const { segments: whisperSegments } = whisperResult;
  const sortedWhisperSegments = [...whisperSegments].sort(
    (a, b) => a.start_ms - b.start_ms
  );

  const alignments: AlignmentReport['alignments'] = [];
  const alignedSegments: ScriptSegment[] = [];

  for (let i = 0; i < scriptSegments.length; i++) {
    const scriptSegment = scriptSegments[i];
    const aligned = alignSingleSegment(scriptSegment, sortedWhisperSegments, mergedOptions);

    alignedSegments.push({
      ...scriptSegment,
      startTime: aligned.startTime,
      endTime: aligned.endTime,
    });

    alignments.push({
      scriptIndex: i,
      whisperIndex: sortedWhisperSegments.findIndex(
        ws => Math.abs(ws.start_ms / 1000 - aligned.startTime) < 0.001 &&
              Math.abs(ws.end_ms / 1000 - aligned.endTime) < 0.001
      ),
      similarity: aligned.similarity,
      timeBefore: {
        start: scriptSegment.startTime,
        end: scriptSegment.endTime,
      },
      timeAfter: {
        start: aligned.startTime,
        end: aligned.endTime,
      },
    });
  }

  return {
    originalSegments: scriptSegments,
    alignedSegments,
    whisperSegments: sortedWhisperSegments,
    alignments,
  };
}
