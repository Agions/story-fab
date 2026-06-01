/**
 * Commentary Domain Types
 * Canonical source for all commentary-related type definitions.
 * Replaces inline types in commentary/index.ts and voiceSynthesisService.ts.
 */

/** 脚本风格预设 */
export type ScriptStylePreset =
  | 'humorous'
  | 'serious'
  | 'conversational'
  | 'suspense'
  | 'warm';

/** 片段模式 */
export type SegmentMode = 'silent_only' | 'original_audio' | 'montage';

/** Director 状态 */
export type DirectorState =
  | 'idle'
  | 'analyzing'
  | 'planning'
  | 'ready'
  | 'rendering'
  | 'done';

/** 解说片段 */
export interface CommentarySegment {
  startTime: number;
  endTime: number;
  text: string;
  emotion?: string;
}

/** 解说脚本输出 */
export interface CommentaryScriptOutput {
  fullScript: string;
  segments: CommentarySegment[];
  estimatedDurationSecs: number;
  modelUsed: string;
  provider: string;
}

/** Director Plan */
export interface DirectorPlan {
  id: string;
  summary: string;
  angle: string;
  targetAudience?: string;
  targetDurationSecs: number;
  estimatedSegments: number;
  segmentMode: SegmentMode;
  recommendedVoice: string;
  keyPoints: string[];
  warnings: string[];
  confidence: number;
}

/** Director 状态响应 */
export interface DirectorStatusResponse {
  sessionId: string;
  state: DirectorState;
  plan?: DirectorPlan;
  error?: string;
  progressPct: number;
}

/** Plan 修正 */
export interface PlanModifications {
  targetDurationSecs?: number;
  angle?: string;
  segmentMode?: SegmentMode;
  recommendedVoice?: string;
}

/** 脚本生成输入 */
export interface GenerateScriptInput {
  subtitles: string;
  durationSecs?: number;
  targetDurationSecs?: number;
  style?: ScriptStylePreset;
  summary?: string;
  highlights?: string[];
  angle?: string;
  provider?: 'openai' | 'google' | 'deepseek' | 'qwen' | 'anthropic';
  model?: string;
  apiKey: string;
  baseUrl?: string;
  systemPromptExtra?: string;
}

/** 合成选项 */
export interface SynthesizeOptions {
  text: string;
  voice: string;
  speed: number;
  format?: 'mp3' | 'wav' | 'ogg';
  outputPath?: string;
}

/** 合成结果 */
export interface SynthesizeResult {
  audioPath: string;
  durationSecs: number;
}