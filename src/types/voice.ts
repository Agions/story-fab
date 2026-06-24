/**
 * 语音/TTS 相关类型定义
 * 合并自 core/types.ts + core/types/voice.ts
 */

// ─── TTS 后端 ───

export type TtsBackendName = 'edge' | 'azure';

export interface TtsBackend {
  name: TtsBackendName;
  label: string;
  description: string;
  requiresNetwork: boolean;
  requiresModelDownload: boolean;
  modelPath: string | null;
}

// ─── 语音配置 ───

export interface Voice {
  id: string;
  name: string;
  provider: string;
  model?: string;
  settings?: VoiceSettings;
}

export interface VoiceSettings {
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface VoiceConfig {
  voice: string;
  language: string;
  rate: number;
  pitch: number;
  volume: number;
  format: 'mp3' | 'wav' | 'ogg';
  backend: TtsBackendName;
}

// ─── 音色信息 ───

export interface VoiceInfo {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  style?: string;
  description?: string;
  lang?: string;
  commentaryStyle?: string;
  commentaryDescription?: string;
}

// ─── 合成结果 ───

export interface SynthesisResult {
  id: string;
  audioPath: string;
  duration: number;
  text: string;
  config: VoiceConfig;
}

export interface SynthesisProgress {
  stage: 'queued' | 'synthesizing' | 'encoding' | 'done' | 'error';
  progress: number;
  message?: string;
}

export interface SynthesizeOptions {
  text: string;
  voice: string;
  speed: number;
  format?: 'mp3' | 'wav' | 'ogg';
  outputPath?: string;
}

export interface SynthesizeResult {
  audioPath: string;
  durationSecs: number;
}
