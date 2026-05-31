/**
 * Voice / TTS Domain Types
 * Canonical source for all voice synthesis type definitions.
 */

/** TTS 后端名称 */
export type TtsBackendName = 'edge';

export interface TtsBackend {
  name: TtsBackendName;
  label: string;
  description: string;
  requiresNetwork: boolean;
  requiresModelDownload: boolean;
  modelPath: string | null;
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

/**
 * 音色信息（统一类型，合并了 commentary/VoiceInfo 和 voice-synthesis/VoiceItem）
 */
export interface VoiceInfo {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  style?: string;
  description?: string;
  lang?: string;
}

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