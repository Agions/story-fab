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

export { buildCandidatesStep } from './build-candidates-step';
export { scoreClipsStep } from './score-clips-step';
export { generateSEOStep } from './generate-seo-step';
export { prepareExportStep } from './prepare-export-step';

// Commentary 5-Step pipeline
export { commentaryDirectorStep } from './commentary/director-step';
export { commentaryVisualStep } from './commentary/visual-step';
export { commentaryNarrationStep } from './commentary/narration-step';
export { commentaryTimingStep } from './commentary/timing-step';
export { commentaryOverlayStep } from './commentary/overlay-step';
export {
  runCommentaryPipeline,
  createCommentaryPipeline,
  COMMENTARY_PROGRESS_WEIGHTS,
  COMMENTARY_STEP_NAMES,
  type CommentaryStepName,
} from './commentary/composite-pipeline';

// Re-export input/output types for convenience
export type {
  BuildCandidatesInput,
  BuildCandidatesOutput,
} from './build-candidates-step';

export type {
  ScoreClipsInput,
  ScoreClipsOutput,
} from './score-clips-step';

export type {
  GenerateSEOInput,
  GenerateSEOOutput,
} from './generate-seo-step';

export type {
  PrepareExportInput,
  PrepareExportOutput,
} from './prepare-export-step';

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
