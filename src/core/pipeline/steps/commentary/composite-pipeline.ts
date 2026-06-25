/**
 * CompositeCommentaryPipeline — 5 个 commentary step 的组合 Pipeline
 *
 * 提供：
 * 1. 一键运行所有 5 个 step
 * 2. 进度范围映射 (每个 step 占用全局进度的固定比例)
 * 3. 兼容原 orchestrateCommentaryAgents() 的返回结构
 *
 * 进度分配：
 * - director:  [0.00, 0.15]
 * - visual:    [0.15, 0.40]
 * - narration: [0.40, 0.65]
 * - timing:    [0.65, 0.85]
 * - overlay:   [0.85, 1.00]
 */

import { ChainPipeline, type PipelineResult, type StepOptions } from '../../step';
import { commentaryDirectorStep } from './director-step';
import { commentaryVisualStep } from './visual-step';
import { commentaryNarrationStep } from './narration-step';
import { commentaryTimingStep } from './timing-step';
import { commentaryOverlayStep } from './overlay-step';
import type { CommentaryPipelineState, CommentaryPipelineResult } from './types';

// ============================================================
// Pipeline 类型
// ============================================================

type Start = { state: CommentaryPipelineState };
type End = { state: CommentaryPipelineState };

// ============================================================
// 进度权重 (5 步总进度归一化)
// ============================================================

const PROGRESS_WEIGHTS = {
  director: 0.15,
  visual: 0.25,
  narration: 0.25,
  timing: 0.20,
  overlay: 0.15,
};

const computeGlobalProgress = (
  stepName: string,
  stepProgress: number
): number => {
  const cumulative: Record<string, number> = {
    'commentary-director': 0,
    'commentary-visual': PROGRESS_WEIGHTS.director,
    'commentary-narration':
      PROGRESS_WEIGHTS.director + PROGRESS_WEIGHTS.visual,
    'commentary-timing':
      PROGRESS_WEIGHTS.director + PROGRESS_WEIGHTS.visual + PROGRESS_WEIGHTS.narration,
    'commentary-overlay':
      PROGRESS_WEIGHTS.director +
      PROGRESS_WEIGHTS.visual +
      PROGRESS_WEIGHTS.narration +
      PROGRESS_WEIGHTS.timing,
  };
  const offset = cumulative[stepName] ?? 0;
  const weight =
    PROGRESS_WEIGHTS[
      stepName.replace('commentary-', '') as keyof typeof PROGRESS_WEIGHTS
    ] ?? 0;
  return offset + stepProgress * weight;
};

// ============================================================
// Composite Pipeline
// ============================================================

/**
 * 创建完整的 commentary pipeline
 */
export const createCommentaryPipeline = (): ChainPipeline<Start, End> => {
  return new ChainPipeline<Start, End>(
    commentaryDirectorStep as unknown as import('../../step').Step<Start, unknown>,
    commentaryVisualStep as unknown as import('../../step').Step<unknown, unknown>,
    commentaryNarrationStep as unknown as import('../../step').Step<unknown, unknown>,
    commentaryTimingStep as unknown as import('../../step').Step<unknown, unknown>,
    commentaryOverlayStep as unknown as import('../../step').Step<unknown, End>
  );
};

/**
 * 一次性运行完整 pipeline
 * 包装进度回调，转换为全局进度
 */
export async function runCommentaryPipeline(
  state: CommentaryPipelineState,
  options?: StepOptions
): Promise<CommentaryPipelineResult> {
  const wrappedOptions: StepOptions = {
    ...options,
    onProgress: options?.onProgress
      ? (stage: string, progress: number, message?: string) => {
          const global = computeGlobalProgress(stage, progress);
          options.onProgress!(stage, global, message);
        }
      : undefined,
  };

  const result: PipelineResult<End> = await createCommentaryPipeline().run(
    { state },
    wrappedOptions
  );

  return {
    success: result.success,
    state: result.output?.state ?? state,
    completedSteps: result.completedSteps,
    failedStep: result.failedStep
      ? { name: result.failedStep.name, error: result.failedStep.error.message }
      : undefined,
    totalDurationMs: result.totalDurationMs,
  };
}

// ============================================================
// 工具: 进度权重 (UI 多 agent 面板用)
// ============================================================

export const COMMENTARY_PROGRESS_WEIGHTS = PROGRESS_WEIGHTS;
export const COMMENTARY_STEP_NAMES = [
  'commentary-director',
  'commentary-visual',
  'commentary-narration',
  'commentary-timing',
  'commentary-overlay',
] as const;
export type CommentaryStepName = (typeof COMMENTARY_STEP_NAMES)[number];
