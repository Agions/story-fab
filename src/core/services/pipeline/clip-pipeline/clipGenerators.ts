/**
 * Clip 生成工具函数
 * 单一职责：纯函数集合，无副作用，便于测试
 */
import type { VideoAnalysis, ScriptSegment } from '../../../types';
import type { ClipConfig, ClipSegment } from './types';

/**
 * 从视频分析结果中构建场景切点数组
 * @param analysis 视频分析结果
 * @param includeSceneChanges 是否包含场景切点
 * @returns 场景切点数组
 */
export function buildSceneChanges(
  analysis: VideoAnalysis,
  includeSceneChanges: boolean,
): Array<{ time: number; confidence: number }> {
  if (!includeSceneChanges || !analysis.scenes) {
    return [];
  }
  return analysis.scenes.map((s) => ({
    time: s.startTime,
    confidence: s.confidence || 0.8,
  }));
}

/**
 * 检测片段是否完全位于静音段落内
 * @param segmentStart 片段开始时间
 * @param segmentEnd 片段结束时间
 * @param silenceSections 静音段落列表
 */
export function isSegmentInSilence(
  segmentStart: number,
  segmentEnd: number,
  silenceSections: Array<{ start: number; end: number }>,
): boolean {
  return silenceSections.some(
    (s) => s.start < segmentEnd && s.end > segmentStart,
  );
}

/**
 * 关联脚本段落文本到片段
 * 如果有 scriptSegments，尝试为片段附加文本
 */
export function attachScriptText(
  segment: ClipSegment,
  index: number,
  scriptSegments?: ScriptSegment[],
): void {
  if (!scriptSegments) return;
  const relatedScript = scriptSegments[index];
  if (relatedScript) {
    segment.text = relatedScript.content;
  }
}

/**
 * 应用转换效果到片段列表（跳过第一个片段）
 * @param segments 片段列表
 * @param config 剪辑配置
 */
export function applyTransitionsToSegments(
  segments: ClipSegment[],
  config: ClipConfig,
): ClipSegment[] {
  if (!config.autoTransition || segments.length < 2) {
    return segments;
  }
  return segments.map((segment, index) => {
    if (index === 0) return segment;
    return {
      ...segment,
      transition: config.transitionType,
    };
  });
}

/**
 * 从 VideoAnalysis 中提取总时长
 * 使用最大场景 endTime 作为视频总时长
 */
export function getAnalysisDuration(analysis: VideoAnalysis): number {
  if (!analysis.scenes || analysis.scenes.length === 0) {
    return 0;
  }
  return Math.max(...analysis.scenes.map((scene) => scene.endTime));
}
