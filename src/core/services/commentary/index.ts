/**
 * Commentary Mode Service — AI 影视解说核心服务
 *
 * 已拆分为 4 个独立服务（2026-07-01 Phase 2 重构）：
 * - session.service.ts: Director Agent 会话管理
 * - script.service.ts: 脚本生成（LLM）
 * - audio.service.ts: 配音合成（TTS）
 * - voice-catalog.service.ts: 音色目录
 *
 * 本文件作为统一导出入口，保持向后兼容性。
 * 新代码请直接导入对应子服务。
 */

// ─── 统一导出所有子服务 ──────────────────────────────────────────────────

export * from './session.service';
export * from './script.service';
export * from './audio.service';
export * from './voice-catalog.service';

// ─── 向后兼容的类型导出 ──────────────────────────────────────────────────

export type {
  ScriptStylePreset,
  CommentarySegment,
  CommentaryScriptOutput,
  VoiceInfo,
} from '@/types';
