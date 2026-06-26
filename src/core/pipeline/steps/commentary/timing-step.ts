/**
 * CommentaryTimingStep — timing-aligner-agent
 *
 * 职责：将文案段落时间映射到镜头段落，降低漂移（< 1 秒）
 * 输入：state + draftScript + visualAnalysis
 * 输出：state + alignment
 *
 * Step 4/5
 * 进度范围：[0.65, 0.85]
 */

import { createStep, reportProgress } from '../../step';
import { logger } from '../../../../shared/utils/logging';
import { AppError } from '@/core/errors';
import {
  type CommentaryTimingInput,
  type CommentaryTimingOutput,
  type AlignedSegments,
} from './types';
import { sceneCommentaryAlignmentService } from '../../../../core/services/ai/scene-commentary-service';
import type { Scene, ScriptSegment } from '@/types';

// ============================================================
// Step Metadata
// ============================================================

const STEP_META = {
  name: 'commentary-timing',
  description: '将文案段落时间映射到镜头段落 (timing-aligner-agent)',
  estimatedDuration: 2,
};

/**
 * 分配 segments 到 scenes (比例映射)
 * 复用原 allocateSegmentsToScenes 逻辑（按比例映射到 scene 内）
 */
const allocateSegmentsToScenes = (
  scenes: Scene[],
  segments: ScriptSegment[]
): ScriptSegment[] => {
  if (!segments.length) return [];
  if (!scenes.length) return segments;

  const sortedScenes = [...scenes]
    .filter((scene) => scene.endTime > scene.startTime)
    .sort((a, b) => a.startTime - b.startTime);
  if (!sortedScenes.length) return segments;

  const sceneCount = sortedScenes.length;
  const totalDuration = segments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
  if (totalDuration <= 0) return segments;

  const cumulativeEnd: number[] = [];
  let acc = 0;
  for (const seg of segments) {
    acc += seg.endTime - seg.startTime;
    cumulativeEnd.push(acc);
  }
  const videoEnd = acc;

  return segments.map((segment, index) => {
    const segMid = segment.startTime + (segment.endTime - segment.startTime) / 2;
    const videoPosition = videoEnd > 0 ? segMid / videoEnd : index / segments.length;

    const sceneIndex = Math.min(
      sceneCount - 1,
      Math.floor(videoPosition * sceneCount)
    );
    const scene = sortedScenes[sceneIndex];
    const sceneDuration = Math.max(scene.endTime - scene.startTime, 0.1);
    const segDuration = segment.endTime - segment.startTime;

    const clampedDuration = Math.min(segDuration, sceneDuration);
    return {
      ...segment,
      startTime: scene.startTime,
      endTime: scene.startTime + clampedDuration,
    };
  });
};

// ============================================================
// Step Implementation
// ============================================================

export const commentaryTimingStep: import('../../step').Step<
  CommentaryTimingInput,
  CommentaryTimingOutput
> = createStep(STEP_META, async (input, _ctx, options) => {
  const { state } = input;
  const { visualAnalysis } = state;
  if (!visualAnalysis) {
    throw new AppError('APP_PIPELINE_ORDER', `[${STEP_META.name}] requires visualAnalysis from previous step`, {
      userMessage: '解说流程顺序错误：缺少视觉分析',
    });
  }

  const scenes = visualAnalysis.enhancedScenes;
  // 合并对白 + 旁白
  const allSegments = [
    ...(state.draftScript?.dialogueSegments ?? []),
    ...(state.draftScript?.narrationSegments ?? []),
  ];

  reportProgress(options?.onProgress, STEP_META.name, 0.3, 'timing 分配段落到场景...');

  const alignedSegments = allocateSegmentsToScenes(scenes, allSegments);

  reportProgress(options?.onProgress, STEP_META.name, 0.6, 'timing 评估漂移...');

  const alignmentItemsRaw = sceneCommentaryAlignmentService.align(scenes, alignedSegments);

  const alignmentItems = alignmentItemsRaw.map((item) => ({
    segmentId: item.segmentId,
    sceneId: item.sceneId,
    driftSeconds: item.driftSeconds,
    confidence: item.confidence,
  }));

  const averageConfidence =
    alignmentItems.length > 0
      ? alignmentItems.reduce((sum, i) => sum + i.confidence, 0) / alignmentItems.length
      : 1.0;
  const maxDriftSeconds =
    alignmentItems.length > 0
      ? alignmentItems.reduce((max, i) => Math.max(max, i.driftSeconds), 0)
      : 0;

  // 验证：是否超过 director 设定阈值
  const targetDrift = state.directorPlan?.targetDriftSeconds ?? 1.0;
  if (maxDriftSeconds > targetDrift * 2) {
    logger.warn(
      `[${STEP_META.name}] drift ${maxDriftSeconds.toFixed(2)}s exceeds threshold ${targetDrift}s`
    );
  }

  reportProgress(options?.onProgress, STEP_META.name, 0.95, 'timing 对齐完成...');

  const alignment: AlignedSegments = {
    alignedSegments,
    alignmentItems,
    averageConfidence: Number(averageConfidence.toFixed(4)),
    maxDriftSeconds: Number(maxDriftSeconds.toFixed(4)),
  };

  logger.debug(`[${STEP_META.name}] timing 完成`, {
    segments: alignedSegments.length,
    avgConfidence: alignment.averageConfidence,
    maxDrift: alignment.maxDriftSeconds,
  });

  return {
    state: {
      ...state,
      directorPlan: state.directorPlan!,
      visualAnalysis: state.visualAnalysis!,
      draftScript: state.draftScript!,
      alignment,
    },
  };
});

export default commentaryTimingStep;
