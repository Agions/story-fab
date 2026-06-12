/**
 * CommentaryOverlayStep — overlay-planner-agent
 *
 * 职责：生成自动原画覆盖建议
 * 输入：state + alignment
 * 输出：state + overlayPlan (最终)
 *
 * Step 5/5
 * 进度范围：[0.85, 1.0]
 */

import { createStep, reportProgress } from '../../Step';
import { logger } from '../../../../shared/utils/logging';
import { AppError } from '@/core/errors';
import {
  type CommentaryOverlayInput,
  type CommentaryOverlayOutput,
  type OverlayPlan,
} from './types';
import { sceneCommentaryAlignmentService } from '../../../../core/services/ai/sceneCommentaryService';

// ============================================================
// Step Metadata
// ============================================================

const STEP_META = {
  name: 'commentary-overlay',
  description: '生成自动原画覆盖建议 (overlay-planner-agent)',
  estimatedDuration: 1,
};

/**
 * 计算平均强度
 * 强度 0-1: 高能片段保留原画 (1.0) > 情绪峰值 (0.8) > 锚点 (0.6) > 过渡 (0.4)
 */
const computeAverageIntensity = (plan: OverlayPlan['plan']): number => {
  if (plan.length === 0) return 0;
  const reasonWeight: Record<string, number> = {
    motion: 1.0,
    emotion: 0.8,
    anchor: 0.6,
    transition: 0.4,
  };
  const sum = plan.reduce((acc, item) => acc + (reasonWeight[item.reason] ?? 0.5), 0);
  return sum / plan.length;
};

// ============================================================
// Step Implementation
// ============================================================

export const commentaryOverlayStep: import('../../Step').Step<
  CommentaryOverlayInput,
  CommentaryOverlayOutput
> = createStep(STEP_META, async (input, _ctx, options) => {
  const { state } = input;
  const { visualAnalysis } = state;
  if (!visualAnalysis) {
    throw new AppError('APP_PIPELINE_ORDER', `[${STEP_META.name}] requires visualAnalysis from previous step`, {
      userMessage: '解说流程顺序错误：缺少视觉分析',
    });
  }

  const scenes = visualAnalysis.enhancedScenes;

  reportProgress(options?.onProgress, STEP_META.name, 0.3, 'overlay 评估场景强度...');

  const rawPlan = sceneCommentaryAlignmentService.buildOriginalOverlayPlan(scenes);

  reportProgress(options?.onProgress, STEP_META.name, 0.7, 'overlay 调整覆盖建议...');

  const overlayPlan: OverlayPlan = {
    plan: rawPlan,
    totalSuggestions: rawPlan.length,
    averageIntensity: Number(computeAverageIntensity(rawPlan).toFixed(4)),
  };

  reportProgress(options?.onProgress, STEP_META.name, 0.95, 'overlay 完成...');

  logger.debug(`[${STEP_META.name}] overlay 完成`, {
    suggestions: overlayPlan.totalSuggestions,
    avgIntensity: overlayPlan.averageIntensity,
  });

  return {
    state: {
      ...state,
      directorPlan: state.directorPlan!,
      visualAnalysis: state.visualAnalysis!,
      draftScript: state.draftScript!,
      alignment: state.alignment!,
      overlayPlan,
    },
  };
});

export default commentaryOverlayStep;
