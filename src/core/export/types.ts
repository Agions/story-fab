/**
 * 导出相关类型定义
 * 格式、质量、编码器预设 - 单一数据源
 */

// 导出格式
export type ExportFormat = 'mp4' | 'webm' | 'mov' | 'mkv';

// 导出质量
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra' | 'custom';

// 分辨率
export type ExportResolution = '480p' | '720p' | '1080p' | '1440p' | '4k' | 'custom';

// 编码器
export interface EncoderSettings {
  videoCodec: 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1';
  audioCodec: 'aac' | 'mp3' | 'opus';
  bitrate?: string;
  crf?: number;
  preset?: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
}

// 导出配置
export interface ExportConfig {
  format: ExportFormat;
  quality: ExportQuality;
  resolution: ExportResolution;
  frameRate: 24 | 25 | 30 | 60;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9';
  audioCodec: 'aac' | 'mp3' | 'opus';
  audioBitrate: '64k' | '128k' | '192k' | '256k' | '320k';
  sampleRate: 44100 | 48000;
  channels: 1 | 2 | 6;
  encoder: EncoderSettings;
  subtitleEnabled: boolean;
  subtitlePath?: string;
  burnSubtitles: boolean;
  watermarkEnabled: boolean;
  watermarkText?: string;
  watermarkImage?: string;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  watermarkOpacity: number;
  title?: string;
  author?: string;
  copyright?: string;
}

// 导出结果
export interface ExportResult {
  outputPath: string;
  duration: number;
  fileSize: number;
  format: ExportFormat;
}

// 导出质量预设 - 单一数据源
export const EXPORT_PRESETS: Record<ExportQuality, Partial<ExportConfig>> = {
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
export const FORMAT_INFO: Record<ExportFormat, { name: string; description: string; container: string }> = {
  mp4: { name: 'MP4', description: '通用视频格式，兼容性最好', container: 'ISOBMFF' },
  webm: { name: 'WebM', description: 'Web 优化格式，支持 VP8/VP9', container: 'WebM' },
  mov: { name: 'MOV', description: 'QuickTime 格式，适合 Mac', container: 'QuickTime' },
  mkv: { name: 'MKV', description: 'Matroska 格式，灵活性高', container: 'Matroska' },
};
