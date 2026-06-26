/**
 * 流水线/工作流相关类型定义
 * 合并自 core/types.ts workflow 部分 + core/pipeline/Step.ts
 */

// ─── Pipeline 引擎类型 ───

export interface PipelineContext {
  stepIndex: number;
  completedSteps: string[];
  meta: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface StepOptions {
  signal?: AbortSignal;
  onProgress?: (stage: string, progress: number, message?: string) => void;
  continueOnError?: boolean;
}

export interface StepMeta {
  name: string;
  description?: string;
  estimatedDuration?: number;
  required?: boolean;
}

export interface Step<TInput, TOutput> {
  meta: StepMeta;
  execute(
    input: TInput,
    context: PipelineContext,
    options?: StepOptions,
  ): Promise<TOutput> | TOutput;
  validate?(input: TInput): { valid: boolean; reason?: string };
  getProgressRange?(): [number, number];
}

export interface PipelineResult<TOutput> {
  success: boolean;
  output?: TOutput;
  completedSteps: string[];
  failedStep?: { name: string; error: Error };
  totalDurationMs: number;
}

// ─── 编辑器面板 ───

export type EditorPanel = 'video' | 'script' | 'subtitle' | 'voice' | 'effect';
export type AIFeatureType = 'video-narration' | 'first-person' | 'remix' | 'smart-clip';
