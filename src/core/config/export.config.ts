/**
 * 导出配置
 * 格式、质量、编码器预设
 */

import type { ExportFormat, ExportQuality, ExportConfig, EncoderSettings } from './export.service';

// 导出质量预设
export const EXPORT_QUALITY_PRESETS: Record<ExportQuality, Partial<ExportConfig>> = {
  low: {
    resolution: '720p',
    frameRate: 24,
    audioBitrate: '128k',
    encoder: { videoCodec: 'h264', audioCodec: 'aac', crf: 28, preset: 'fast' },
  },
  medium: {
    resolution: '1080p',
    frameRate: 30,
    audioBitrate: '192k',
    encoder: { videoCodec: 'h264', audioCodec: 'aac', crf: 23, preset: 'medium' },
  },
  high: {
    resolution: '1080p',
    frameRate: 60,
    audioBitrate: '256k',
    encoder: { videoCodec: 'h265', audioCodec: 'aac', crf: 20, preset: 'slow' },
  },
  ultra: {
    resolution: '4k',
    frameRate: 60,
    audioBitrate: '320k',
    encoder: { videoCodec: 'h265', audioCodec: 'aac', crf: 18, preset: 'veryslow' },
  },
  custom: {},
};

// 格式信息
export const FORMAT_DETAILS: Record<ExportFormat, { 
  name: string; 
  description: string; 
  container: string;
  mimeType: string;
}> = {
  mp4: { name: 'MP4', description: '通用视频格式，兼容性最好', container: 'ISOBMFF', mimeType: 'video/mp4' },
  webm: { name: 'WebM', description: 'Web 优化格式，支持 VP8/VP9', container: 'WebM', mimeType: 'video/webm' },
  mov: { name: 'MOV', description: 'QuickTime 格式，适合 Mac', container: 'QuickTime', mimeType: 'video/quicktime' },
  mkv: { name: 'MKV', description: 'Matroska 格式，灵活性高', container: 'Matroska', mimeType: 'video/x-matroska' },
};

// 分辨率映射
export const RESOLUTION_MAP: Record<string, { width: number; height: number }> = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 },
};

// 音频码率选项
export const AUDIO_BITRATES = ['64k', '128k', '192k', '256k', '320k'] as const;

// 帧率选项
export const FRAME_RATE_OPTIONS = [24, 25, 30, 60] as const;

// 默认编码器设置
export const DEFAULT_ENCODER: EncoderSettings = {
  videoCodec: 'h264',
  audioCodec: 'aac',
  crf: 20,
  preset: 'medium',
};

// 默认导出配置
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'mp4',
  quality: 'high',
  resolution: '1080p',
  frameRate: 30,
  aspectRatio: '16:9',
  audioCodec: 'aac',
  audioBitrate: '256k',
  sampleRate: 48000,
  channels: 2,
  encoder: DEFAULT_ENCODER,
  subtitleEnabled: false,
  burnSubtitles: false,
  watermarkEnabled: false,
  watermarkPosition: 'bottom-right',
  watermarkOpacity: 0.7,
};

// 编码器预设
export const ENCODER_PRESETS = {
  ultrafast: '极快',
  superfast: '超快',
  veryfast: '很快',
  faster: '较快',
  fast: '快速',
  medium: '中等',
  slow: '慢速',
  veryslow: '很慢',
} as const;

// 视频编码器
export const VIDEO_CODECS = [
  { value: 'h264', label: 'H.264 (AVC)', desc: '兼容性最好' },
  { value: 'h265', label: 'H.265 (HEVC)', desc: '高效编码' },
  { value: 'vp8', label: 'VP8', desc: '开源编码' },
  { value: 'vp9', label: 'VP9', desc: 'Google 开发' },
  { value: 'av1', label: 'AV1', desc: '最新标准' },
] as const;

// 音频编码器
export const AUDIO_CODECS = [
  { value: 'aac', label: 'AAC', desc: '推荐' },
  { value: 'mp3', label: 'MP3', desc: '兼容性好' },
  { value: 'opus', label: 'Opus', desc: '适合语音' },
  { value: 'flac', label: 'FLAC', desc: '无损' },
] as const;
