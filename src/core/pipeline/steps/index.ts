/**
 * Pipeline Steps — 统一导出
 *
 * Clip 模式 (4 step):
 *   import { buildCandidatesStep, scoreClipsStep, generateSEOStep, prepareExportStep } from '@/core/pipeline/steps';
 *
 * Commentary 模式 (5 step + 组合封装):
 *   import {
 *     runCommentaryPipeline,
 *     commentaryDirectorStep,
 *     commentaryVisualStep,
 *     commentaryNarrationStep,
 *     commentaryTimingStep,
 *     commentaryOverlayStep,
 *     COMMENTARY_STEP_NAMES,
 *     COMMENTARY_PROGRESS_WEIGHTS,
 *   } from '@/core/pipeline/steps';
 */

export { buildCandidatesStep } from './BuildCandidatesStep';
export { scoreClipsStep } from './ScoreClipsStep';
export { generateSEOStep } from './GenerateSEOStep';
export { prepareExportStep } from './PrepareExportStep';

// Commentary 5-Step pipeline
export { commentaryDirectorStep } from './commentary/CommentaryDirectorStep';
export { commentaryVisualStep } from './commentary/CommentaryVisualStep';
export { commentaryNarrationStep } from './commentary/CommentaryNarrationStep';
export { commentaryTimingStep } from './commentary/CommentaryTimingStep';
export { commentaryOverlayStep } from './commentary/CommentaryOverlayStep';
export {
  runCommentaryPipeline,
  createCommentaryPipeline,
  COMMENTARY_PROGRESS_WEIGHTS,
  COMMENTARY_STEP_NAMES,
  type CommentaryStepName,
} from './commentary/CompositeCommentaryPipeline';

// Re-export input/output types for convenience
export type {
  BuildCandidatesInput,
  BuildCandidatesOutput,
} from './BuildCandidatesStep';

export type {
  ScoreClipsInput,
  ScoreClipsOutput,
} from './ScoreClipsStep';

export type {
  GenerateSEOInput,
  GenerateSEOOutput,
} from './GenerateSEOStep';

export type {
  PrepareExportInput,
  PrepareExportOutput,
} from './PrepareExportStep';

// Commentary types
export type {
  CommentaryPipelineState,
  CommentaryPipelineResult,
  DirectorPlan,
  VisualAnalysisOutput,
  DraftScript,
  AlignedSegments,
  OverlayPlan,
} from './commentary/types';
