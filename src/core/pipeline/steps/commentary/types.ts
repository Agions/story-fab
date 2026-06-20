/**
 * Commentary Pipeline — 共享类型定义
 *
 * 5 个 Step 共同使用的输入/输出数据类型
 * 设计原则：
 * - 每个 step 输入/输出都强类型化
 * - 累积式 (cumulative) state：每步都拿到上一步结果 + 原始 input
 * - 中间结果可被 UI 单独展示
 */

import type { ScriptSegment, Scene, VideoAnalysis } from '@/core/types';
import type { WorkflowMode } from '@/core/workflow/featureBlueprint';
import type { OriginalOverlayPlanItem } from '@/core/services/ai/sceneCommentaryService';

// ============================================================
// Pipeline 共享 Context (贯穿所有 step)
// ============================================================

/**
 * Director Plan — director-agent 的输出
 * 节奏策略 + 段落优先级
 */
export interface DirectorPlan {
  mode: WorkflowMode;
  /** 整体节奏：slow | medium | fast */
  pacing: 'slow' | 'medium' | 'fast';
  /** 段落优先级 (sceneId → priority 0-1) */
  scenePriorities: Map<string, number>;
  /** 段落优先级 (array form, 用于序列化) */
  scenePrioritiesList: Array<{ sceneId: string; priority: number }>;
  /** director 制定的"叙述主线" (一段话) */
  narrativeArc: string;
  /** director 目标的漂移阈值 (秒) */
  targetDriftSeconds: number;
  /** 生成时间戳 */
  createdAt: number;
}

/**
 * Visual Analysis Output — visual-analyst-agent 的输出
 * 场景摘要 + 关键镜头锚点
 */
export interface VisualAnalysisOutput {
  /** 解析后的场景列表（增强版：含 emotional 标签 + motionScore） */
  enhancedScenes: Array<Scene & {
    /** 高能评分 (0-1) */
    motionScore: number;
    /** 是否为关键锚点 (motionScore > 0.7) */
    isKeyAnchor: boolean;
    /** 主导情绪 (来自 emotions 列表) */
    dominantEmotion?: string;
  }>;
  /** 关键镜头锚点 (取 top N) */
  keyAnchors: Array<{
    sceneId: string;
    startTime: number;
    endTime: number;
    reason: 'motion' | 'emotion' | 'transition';
  }>;
}

/**
 * Draft Script — narration-writer-agent 的输出
 * 分层解说草稿（对白层 + 旁白层）
 */
export interface DraftScript {
  /** 对白层段落 (从原字幕提取) */
  dialogueSegments: ScriptSegment[];
  /** 旁白层段落 (新生成的解说) */
  narrationSegments: ScriptSegment[];
  /** 语气一致性标记 (0-1) */
  toneConsistency: number;
  /** 草稿完整文本 (用于 UI 预览) */
  fullText: string;
}

/**
 * Aligned Segments — timing-aligner-agent 的输出
 * 时间对齐结果 + 漂移评估
 */
export interface AlignedSegments {
  /** 对齐后的段落 (startTime/endTime 调整到 scene 内) */
  alignedSegments: ScriptSegment[];
  /** 每个段落 vs 目标 scene 的漂移 (秒) */
  alignmentItems: Array<{
    segmentId: string;
    sceneId: string;
    driftSeconds: number;
    confidence: number;
  }>;
  /** 平均置信度 (0-1) */
  averageConfidence: number;
  /** 最大漂移 (秒) */
  maxDriftSeconds: number;
}

/**
 * Overlay Plan — overlay-planner-agent 的输出
 * 原画覆盖建议
 */
export interface OverlayPlan {
  /** 每个 scene 的覆盖建议 */
  plan: OriginalOverlayPlanItem[];
  /** 总建议数 */
  totalSuggestions: number;
  /** 平均强度 (0-1) */
  averageIntensity: number;
}

// ============================================================
// Pipeline 累积 State (作为 PipelineContext.meta 传递)
// ============================================================

/**
 * Commentary Pipeline 的累积 state
 * 每一步都基于前一步的 state 加上自己的输出
 */
export interface CommentaryPipelineState {
  /** 原始输入 (不变) */
  mode: WorkflowMode;
  analysis: VideoAnalysis;
  segments: ScriptSegment[];

  /** director 步骤结果 */
  directorPlan?: DirectorPlan;

  /** visual 步骤结果 */
  visualAnalysis?: VisualAnalysisOutput;

  /** narration 步骤结果 */
  draftScript?: DraftScript;

  /** timing 步骤结果 */
  alignment?: AlignedSegments;

  /** overlay 步骤结果 (最终) */
  overlayPlan?: OverlayPlan;
}

/**
 * Step 1 初始输入
 */
export interface CommentaryDirectorInput {
  state: CommentaryPipelineState;
}

/**
 * Step 1 输出 = Step 2 输入 (累积 state)
 */
export interface CommentaryDirectorOutput {
  state: CommentaryPipelineState & {
    directorPlan: DirectorPlan;
  };
}

export interface CommentaryVisualInput {
  state: CommentaryPipelineState;
}

export interface CommentaryVisualOutput {
  state: CommentaryPipelineState & {
    directorPlan: DirectorPlan;
    visualAnalysis: VisualAnalysisOutput;
  };
}

export interface CommentaryNarrationInput {
  state: CommentaryPipelineState;
}

export interface CommentaryNarrationOutput {
  state: CommentaryPipelineState & {
    directorPlan: DirectorPlan;
    visualAnalysis: VisualAnalysisOutput;
    draftScript: DraftScript;
  };
}

export interface CommentaryTimingInput {
  state: CommentaryPipelineState;
}

export interface CommentaryTimingOutput {
  state: CommentaryPipelineState & {
    directorPlan: DirectorPlan;
    visualAnalysis: VisualAnalysisOutput;
    draftScript: DraftScript;
    alignment: AlignedSegments;
  };
}

export interface CommentaryOverlayInput {
  state: CommentaryPipelineState;
}

export interface CommentaryOverlayOutput {
  state: CommentaryPipelineState & {
    directorPlan: DirectorPlan;
    visualAnalysis: VisualAnalysisOutput;
    draftScript: DraftScript;
    alignment: AlignedSegments;
    overlayPlan: OverlayPlan;
  };
}

/**
 * 最终 Pipeline 输出 (兼容原 CommentaryOrchestrationResult)
 */
export interface CommentaryPipelineResult {
  success: boolean;
  state: CommentaryPipelineState;
  completedSteps: string[];
  failedStep?: { name: string; error: string };
  totalDurationMs: number;
}

// ============================================================
// 辅助工具
// ============================================================

/**
 * 从 VideoAnalysis 中提取 emotion 列表
 */
/**
 * Director pacing 推导
 * 根据场景密度 + 时长推导节奏
 */
export const derivePacing = (scenes: Scene[], durationSec: number): 'slow' | 'medium' | 'fast' => {
  if (scenes.length === 0 || durationSec <= 0) return 'medium';
  const sceneDensity = scenes.length / (durationSec / 60); // scenes per minute
  if (sceneDensity < 5) return 'slow';
  if (sceneDensity < 15) return 'medium';
  return 'fast';
};
