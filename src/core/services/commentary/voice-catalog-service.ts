/**
 * Commentary Voice Catalog Service
 *
 * 职责：管理解说音色目录
 * - 获取推荐音色列表
 * - 按风格过滤音色
 *
 * 从 commentary/index.ts 拆分（2026-07-01）
 */

import { tauri } from '@/core/tauri';
import type {
  ScriptStylePreset,
  VoiceInfo,
} from '@/types';

/**
 * 获取推荐音色列表
 * @param style 过滤风格（可选）
 */
export async function listCommentaryVoices(
  style?: ScriptStylePreset,
): Promise<VoiceInfo[]> {
  const voices = (await tauri.listVoices()) as VoiceInfo[];
  if (!style) return voices;
  return voices.filter((v) => v.style === style);
}
