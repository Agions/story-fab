/**
 * VideoComposing 配置数据
 * 特效预设、配音角色、语音选项、字幕位置
 */

export const EFFECT_PRESET_MAP: Record<string, string | null> = {
  none: null,
  cinematic: 'smooth-fade',
  vivid: 'vibrant',
  retro: 'vintage',
  cool: 'cool',
  warm: 'warm',
};

export const VOICE_OPTIONS = [
  { value: 'female_zh', label: '女声 (中文)', desc: '温柔甜美', emoji: '🎤' },
  { value: 'male_zh', label: '男声 (中文)', desc: '成熟稳重', emoji: '🎙️' },
  { value: 'neutral', label: '中性声音', desc: '通用场景', emoji: '🔊' },
];

export const VOICE_PRESETS = [
  { value: 'XiaoxiaoNeural', label: '晓晓', desc: '青春活力', region: 'zh-CN', emoji: '🌟' },
  { value: 'YunxiNeural', label: '云希', desc: '低沉磁性', region: 'zh-CN', emoji: '🎭' },
  { value: 'YunyangNeural', label: '云扬', desc: '新闻播报', region: 'zh-CN', emoji: '📢' },
  { value: 'XiaoyiNeural', label: '晓伊', desc: '温柔甜美', region: 'zh-CN', emoji: '💕' },
  { value: 'XiaobaiNeural', label: '小白', desc: '轻松活泼', region: 'zh-CN', emoji: '😄' },
];

export const EFFECT_STYLES = [
  { value: 'none', label: '无', desc: '保持原样' },
  { value: 'cinematic', label: '电影感', desc: '调色+暗角' },
  { value: 'vivid', label: '鲜艳', desc: '色彩增强' },
  { value: 'retro', label: '复古', desc: '怀旧色调' },
  { value: 'cool', label: '冷色调', desc: '蓝色系' },
  { value: 'warm', label: '暖色调', desc: '橙色系' },
];

export const DEFAULT_VOICE_SPEED = 100;
export const DEFAULT_VOICE_VOLUME = 80;
export const VOICE_SPEED_MIN = 50;
export const VOICE_SPEED_MAX = 150;
export const VOICE_SPEED_RANGE = VOICE_SPEED_MAX - VOICE_SPEED_MIN;

export const SUBTITLE_POSITIONS = [
  { value: 'bottom', label: '底部' },
  { value: 'center', label: '中间' },
  { value: 'top', label: '顶部' },
];

export const TAB_OPTIONS = [
  { value: 'voice', label: '配音设置' },
  { value: 'subtitle', label: '字幕样式' },
  { value: 'effect', label: '特效' },
] as const;

export type ComposingTab = 'voice' | 'subtitle' | 'effect';

export interface SynthesizeConfig {
  voiceId: string;
  voiceSpeed: number;
  voiceVolume: number;
  originalAudioVolume: number;
  voicePreset: string;
  enableVoice: boolean;
  enableSubtitle: boolean;
  subtitlePosition: 'bottom' | 'center' | 'top';
  enableEffect: boolean;
  effectStyle: string;
  syncAudioVideo: boolean;
}

export const DEFAULT_SYNTHESIZE_CONFIG: SynthesizeConfig = {
  voiceId: 'female_zh',
  voiceSpeed: DEFAULT_VOICE_SPEED,
  voiceVolume: DEFAULT_VOICE_VOLUME,
  originalAudioVolume: 30,
  voicePreset: VOICE_PRESETS[0].value,
  enableVoice: true,
  enableSubtitle: true,
  subtitlePosition: 'bottom',
  enableEffect: false,
  effectStyle: EFFECT_STYLES[1].value, // cinematic
  syncAudioVideo: true,
};