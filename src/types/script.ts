/**
 * 脚本相关类型定义
 * 合并自 core/types.ts + core/types/commentary.ts
 */

// ─── 脚本风格 ───

export type ScriptStylePreset =
  | 'humorous'
  | 'serious'
  | 'conversational'
  | 'suspense'
  | 'warm';

export type SegmentMode = 'silent_only' | 'original_audio' | 'montage';

// ─── 脚本模型 ───

export interface Script {
  id: string;
  segments: ScriptSegment[];
  totalDuration?: number;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  content?: string;
  text?: string;
  voice?: string;
  type?: 'narration' | 'dialogue' | 'description' | string;
}

export interface ScriptMetadata {
  title?: string;
  author?: string;
  tone?: string;
  length?: string;
  estimatedDuration?: number;
  targetAudience?: string;
  language?: string;
  wordCount?: number;
  generatedBy?: string;
  generatedAt?: string;
  template?: string;
  createdAt?: string;
  updatedAt?: string;
  style?: string;
}

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  content: string;
  duration?: number;
  wordCount?: number;
}

export interface ScriptData {
  id: string;
  title: string;
  content: string;
  duration?: number;
  segments: ScriptSegment[];
  metadata?: ScriptMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScriptGenerationOptions {
  style?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  purpose?: string;
}

// ─── 解说脚本 ───

export interface CommentarySegment {
  startTime: number;
  endTime: number;
  text: string;
  emotion?: string;
}

export interface CommentaryScriptOutput {
  fullScript: string;
  segments: CommentarySegment[];
  estimatedDurationSecs: number;
  modelUsed: string;
  provider: string;
}

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
