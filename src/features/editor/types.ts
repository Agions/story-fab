/**
 * Editor Types - 编辑器类型定义
 */
import type { ScriptSegment as CoreScriptSegment } from '@/core/types';

// Re-export and extend ScriptSegment for editor
export type ScriptSegment = CoreScriptSegment & {
  /** 编辑器专用类型 */
  editorType?: 'narration' | 'action' | 'dialogue';
};

export interface VideoAsset {
  id: string;
  url: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  thumbnail?: string;
  size: number;
  format: string;
}

export interface Script {
  id: string;
  title: string;
  content: string;
  segments: ScriptSegment[];
  metadata: ScriptMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptMetadata {
  style: string;
  tone: string;
  length: 'short' | 'medium' | 'long';
  wordCount: number;
  estimatedDuration: number;
}

export interface VoiceSettings {
  voiceId: string;
  speed: number;
  volume: number;
  pitch?: number;
}

export interface Voice {
  id: string;
  url: string;
  duration: number;
  settings: VoiceSettings;
}

export interface EditorTimeline {
  videoTrack: VideoAsset[];
  audioTrack: Voice[];
  subtitleTrack: ScriptSegment[];
}

export type EditorPanel = 'video' | 'script' | 'subtitle' | 'voice' | 'effect';
