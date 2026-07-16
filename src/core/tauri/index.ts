/**
 * Tauri API Surface — 10 个方法分桶的统一导出
 *
 * Stage 8 PR-3.3 重构：
 * - 47 个方法的手动 re-export 改用 spread 形式
 * - 保留分桶 import + section comment 维持可读性
 * - 公开 API（tauri 对象）签名零变化
 *
 * 唯一约束：所有 10 个分桶的方法名必须唯一（madge + 静态检查已确认）。
 * 未来新增方法时直接在对应分桶添加，tauri 自动包含。
 */

import { videoAnalysis } from './methods/video-analysis';
import { highlightDetection } from './methods/highlight-detection';
import { renderTranscode } from './methods/render-transcode';
import { subtitleAsr } from './methods/subtitle-asr';
import { tts } from './methods/tts';
import { mixAudio } from './methods/mix-audio';
import { fileOperations } from './methods/file-operations';
import { project } from './methods/project';
import { aiScript } from './methods/ai-script';
import { commentary } from './methods/commentary';

export const tauri = {
  // ─── FFmpeg / Video analysis ──────────────────────────────
  ...videoAnalysis,
  getExportDir: project.getExportDir,

  // ─── Highlight detection ──────────────────────────────────
  ...highlightDetection,

  // ─── Render / Transcode ───────────────────────────────────
  ...renderTranscode,

  // ─── Subtitles / ASR ──────────────────────────────────────
  ...subtitleAsr,

  // ─── TTS + Audio mixing ───────────────────────────────────
  ...tts,
  ...mixAudio,

  // ─── File operations ──────────────────────────────────────
  ...fileOperations,

  // ─── Project ──────────────────────────────────────────────
  saveProjectFile: project.saveProjectFile,
  loadProjectFile: project.loadProjectFile,
  deleteProjectFile: project.deleteProjectFile,
  listProjectFiles: project.listProjectFiles,
  listAppDataFiles: project.listAppDataFiles,
  checkAppDataDirectory: project.checkAppDataDirectory,

  // ─── AI Script ────────────────────────────────────────────
  ...aiScript,

  // ─── Commentary / Director ────────────────────────────────
  ...commentary,
} as const;

export default tauri;

// Re-export types and invoke from invoke for barrel import from index
export { TauriCommand, TauriBridgeError, invoke } from './invoke';
export type { BridgeOptions } from './invoke';
