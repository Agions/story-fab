/**
 * Commentary Script Service
 *
 * 职责：解说脚本生成（LLM）
 * - 生成解说脚本
 * - 管理脚本生成输入/输出类型
 *
 * 从 commentary/index.ts 拆分（2026-07-01）
 */

import { tauri } from '@/core/tauri';
import type {
  ScriptStylePreset,
  CommentarySegment,
  CommentaryScriptOutput,
} from '@/types';
import { synthesizeCommentaryAudio } from './audio.service';

// ─── Script Generation Input/Output ──────────────────────────────────────

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

// ─── Script Generation ───────────────────────────────────────────────────

/**
 * 生成解说脚本（调用 LLM）
 */
export async function generateCommentaryScript(
  input: GenerateScriptInput,
): Promise<CommentaryScriptOutput> {
  return tauri.generateScript(input) as Promise<CommentaryScriptOutput>;
}

// ─── 便捷工厂函数 ─────────────────────────────────────────────────────────

/**
 * 快速生成解说脚本 + 配音
 * 适用于简单一次性场景
 *
 * @deprecated 建议使用 CommentaryScriptService + CommentaryAudioService 组合
 */
export async function quickCommentary(
  subtitles: string,
  apiKey: string,
  style?: ScriptStylePreset,
  voice?: string,
): Promise<{
  script: CommentaryScriptOutput;
  audioFiles: Awaited<ReturnType<typeof synthesizeCommentaryAudio>>[];
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
    script.segments.map((seg: CommentarySegment) =>
      synthesizeCommentaryAudio(seg.text, voice ?? 'zh-CN-XiaoxiaoNeural'),
    ),
  );

  return { script, audioFiles };
}
