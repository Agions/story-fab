/**
 * Editor Types - 编辑器类型定义
 */
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

export interface ScriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  content: string;
  type: 'narration' | 'action' | 'dialogue';
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
