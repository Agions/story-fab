/**
 * AI Editor 常量定义
 * 避免循环依赖的共享常量
 */
import type { CutDeckStep } from './workflow.types';

// 步骤列表
export const CUT_DECK_STEPS: readonly CutDeckStep[] = [
  'project-create',
  'video-upload',
  'ai-analyze',
  'clip-repurpose',
  'script-generate',
  'video-synthesize',
  'export',
] as const;

// 初始步骤状态
export const INITIAL_STEP_STATUS = {
  'project-create': false,
  'video-upload': false,
  'ai-analyze': false,
  'clip-repurpose': false,
  'script-generate': false,
  'video-synthesize': false,
  'export': false,
} as const;

// 默认语音设置
export const DEFAULT_VOICE_SETTINGS = {
  voiceId: 'female_zh',
  speed: 1.0,
  volume: 0.8,
} as const;

// 默认合成设置
export const DEFAULT_SYNTHESIS_SETTINGS = {
  syncAudioVideo: true,
  addSubtitles: true,
  addWatermark: false,
} as const;
