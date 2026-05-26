/**
 * Commentary Mode Service — AI 影视解说核心服务
 *
 * 封装 Tauri Commentary Mode 命令，提供：
 * - Director Agent 状态管理
 * - 解说脚本生成（LLM）
 * - 解说配音合成（TTS）
 *
 * 遵循"最优方案"架构设计
 */

import { invoke } from '@tauri-apps/api/core';

// ─── 类型定义 ────────────────────────────────────────────────────────────

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

/** 音色信息 */
export interface VoiceInfo {
  id: string;
  name: string;
  gender: 'male' | 'female';
  style: string;
  description: string;
}

// ─── Director Agent ─────────────────────────────────────────────────────

/**
 * 创建 Commentary Director 会话
 * @param sessionId 会话 ID（建议使用项目 ID）
 * @param style 风格预设
 */
export async function createCommentarySession(
  sessionId: string,
  style?: ScriptStylePreset,
): Promise<string> {
  return invoke('create_director_session', { sessionId, style });
}

/**
 * 获取 Director 状态
 */
export async function getCommentaryStatus(
  sessionId: string,
): Promise<DirectorStatusResponse> {
  return invoke('get_director_status', { sessionId });
}

/**
 * 开始分析视频
 * @param sessionId 会话 ID
 * @param videoPath 视频路径
 * @param subtitles 字幕内容（SRT 格式）
 * @param targetDurationSecs 目标解说时长（秒）
 */
export async function startCommentaryAnalysis(
  sessionId: string,
  videoPath: string,
  subtitles: string,
  targetDurationSecs?: number,
): Promise<void> {
  return invoke('start_director_analysis', {
    sessionId,
    videoPath,
    subtitles,
    targetDurationSecs,
  });
}

/**
 * 生成 Director Plan
 */
export async function generateCommentaryPlan(
  sessionId: string,
  style?: ScriptStylePreset,
  targetDurationSecs?: number,
): Promise<DirectorPlan> {
  return invoke('generate_director_plan', {
    sessionId,
    style,
    targetDurationSecs,
  });
}

/**
 * 确认 Plan 并开始渲染
 */
export async function approveCommentaryPlan(
  sessionId: string,
): Promise<string> {
  return invoke('approve_director_plan', { sessionId });
}

/**
 * 用户修正 Plan
 */
export async function reviseCommentaryPlan(
  sessionId: string,
  modifications: PlanModifications,
): Promise<DirectorPlan> {
  return invoke('revise_director_plan', { sessionId, modifications });
}

/**
 * 渲染完成回调
 */
export async function completeCommentaryRender(
  sessionId: string,
  outputPath: string,
): Promise<string> {
  return invoke('complete_director_render', { sessionId, outputPath });
}

/**
 * 销毁 Director 会话（释放内存）
 */
export async function destroyCommentarySession(
  sessionId: string,
): Promise<void> {
  return invoke('destroy_director_session', { sessionId });
}

// ─── Script Generator ────────────────────────────────────────────────────

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

/**
 * 生成解说脚本（调用 LLM）
 */
export async function generateCommentaryScript(
  input: GenerateScriptInput,
): Promise<CommentaryScriptOutput> {
  return invoke('generate_commentary_script', { input });
}

// ─── Commentary Synthesizer ─────────────────────────────────────────────

/**
 * 合成单条解说音频（调用 Edge TTS）
 */
export async function synthesizeCommentaryAudio(
  text: string,
  voice: string,
  speed?: number,
  format?: 'mp3' | 'wav' | 'ogg',
  outputPath?: string,
): Promise<SynthesizeResult> {
  return invoke('synthesize_commentary_audio', {
    text,
    voice,
    speed: speed ?? 1.0,
    format,
    outputPath,
  });
}

/**
 * 估算 TTS 音频时长（通过真实合成 + ffprobe 获取精确时长）
 */
export async function estimateTTSDuration(
  text: string,
  voice: string,
  speed?: number,
): Promise<number> {
  return invoke('estimate_tts_duration', {
    text,
    voice,
    speed: speed ?? 1.0,
  });
}

/**
 * 获取推荐音色列表
 * @param style 过滤风格（可选）
 */
export async function listCommentaryVoices(
  style?: ScriptStylePreset,
): Promise<VoiceInfo[]> {
  return invoke('list_commentary_voices', { style });
}

// ─── 便捷工厂函数 ───────────────────────────────────────────────────────

/**
 * 快速生成解说脚本 + 配音
 * 适用于简单一次性场景
 */
export async function quickCommentary(
  subtitles: string,
  apiKey: string,
  style?: ScriptStylePreset,
  voice?: string,
): Promise<{
  script: CommentaryScriptOutput;
  audioFiles: SynthesizeResult[];
}> {
  // 1. 生成脚本
  const script = await generateCommentaryScript({
    subtitles,
    style,
    apiKey,
    provider: 'openai',
  });

  // 2. 批量合成音频
  const audioFiles = await Promise.all(
    script.segments.map((seg) =>
      synthesizeCommentaryAudio(seg.text, voice ?? 'zh-CN-XiaoxiaoNeural'),
    ),
  );

  return { script, audioFiles };
}