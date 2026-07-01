/**
 * Commentary Session Service
 *
 * 职责：管理 Director Agent 会话生命周期
 * - 创建/销毁会话
 * - 获取会话状态
 * - 启动/停止分析
 * - Plan 管理（生成、确认、修正、完成）
 *
 * 从 commentary/index.ts 拆分（2026-07-01）
 */

import { tauri } from '@/core/tauri';
import type {
  ScriptStylePreset,
  DirectorPlan,
  DirectorStatusResponse,
  PlanModifications,
} from '@/types';

// ─── Session Management ──────────────────────────────────────────────────

/**
 * 创建 Commentary Director 会话
 * @param sessionId 会话 ID（建议使用项目 ID）
 * @param style 风格预设
 */
export async function createCommentarySession(
  sessionId: string,
  style?: ScriptStylePreset,
): Promise<string> {
  return tauri.createSession(sessionId, style);
}

/**
 * 获取 Director 状态
 */
export async function getCommentaryStatus(
  sessionId: string,
): Promise<DirectorStatusResponse> {
  return tauri.getStatus(sessionId) as Promise<DirectorStatusResponse>;
}

/**
 * 销毁 Director 会话（释放内存）
 */
export async function destroyCommentarySession(
  sessionId: string,
): Promise<void> {
  return tauri.destroySession(sessionId);
}

// ─── Analysis & Plan ─────────────────────────────────────────────────────

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
  return tauri.startAnalysis(sessionId, videoPath, subtitles, targetDurationSecs);
}

/**
 * 生成 Director Plan
 */
export async function generateCommentaryPlan(
  sessionId: string,
  style?: ScriptStylePreset,
  targetDurationSecs?: number,
): Promise<DirectorPlan> {
  return tauri.generatePlan(sessionId, style, targetDurationSecs) as Promise<DirectorPlan>;
}

/**
 * 确认 Plan 并开始渲染
 */
export async function approveCommentaryPlan(
  sessionId: string,
): Promise<string> {
  return tauri.approvePlan(sessionId);
}

/**
 * 用户修正 Plan
 */
export async function reviseCommentaryPlan(
  sessionId: string,
  modifications: PlanModifications,
): Promise<DirectorPlan> {
  return tauri.revisePlan(sessionId, modifications) as Promise<DirectorPlan>;
}

/**
 * 渲染完成回调
 */
export async function completeCommentaryRender(
  sessionId: string,
  outputPath: string,
): Promise<string> {
  return tauri.completeRender(sessionId, outputPath);
}
