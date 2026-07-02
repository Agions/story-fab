/**
 * Commentary Audio Service
 *
 * 职责：解说配音合成（TTS）
 * - 合成单条/批量音频
 * - 估算音频时长
 * - 音频格式转换
 *
 * 从 commentary/index.ts 拆分（2026-07-01）
 */

import { tauri } from '@/core/tauri';
import type { SynthesizeResult } from '@/types';

// ─── Audio Synthesis ──────────────────────────────────────────────────────

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
  return tauri.synthesizeAudio(text, voice, speed ?? 1.0, format ?? 'mp3', outputPath) as Promise<SynthesizeResult>;
}

/**
 * 估算 TTS 音频时长（通过真实合成 + ffprobe 获取精确时长）
 */
export async function estimateTTSDuration(
  text: string,
  voice: string,
  speed?: number,
): Promise<number> {
  return tauri.estimateTTSDuration(text, voice, speed ?? 1.0);
}
