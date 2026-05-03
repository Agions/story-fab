/**
 * 多平台导出预设配置
 * 抖音/小红书/B站/快手/视频号/YouTube/TikTok
 */

export type BitratePreset = 'low' | 'medium' | 'high' | 'ultra';
export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface PlatformPreset {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  resolution: { width: number; height: number };
  frameRate: number;
  bitratePreset: BitratePreset;
  subtitlePosition: 'bottom' | 'top';
}

export const PLATFORM_PRESETS: Record<string, PlatformPreset> = {
  douyin: {
    id: 'douyin',
    name: '抖音',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    frameRate: 30,
    bitratePreset: 'high',
    subtitlePosition: 'bottom',
  },
  xiaohongshu: {
    id: 'xiaohongshu',
    name: '小红书',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    frameRate: 30,
    bitratePreset: 'high',
    subtitlePosition: 'bottom',
  },
  bilibili: {
    id: 'bilibili',
    name: 'B站',
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    bitratePreset: 'high',
    subtitlePosition: 'bottom',
  },
  kuaishou: {
    id: 'kuaishou',
    name: '快手',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    frameRate: 30,
    bitratePreset: 'medium',
    subtitlePosition: 'bottom',
  },
  'video号': {
    id: 'video号',
    name: '视频号',
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    bitratePreset: 'medium',
    subtitlePosition: 'bottom',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080 },
    frameRate: 60,
    bitratePreset: 'ultra',
    subtitlePosition: 'bottom',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    frameRate: 30,
    bitratePreset: 'high',
    subtitlePosition: 'bottom',
  },
};

export function getPreset(platformId: string): PlatformPreset {
  const preset = PLATFORM_PRESETS[platformId];
  if (!preset) throw new Error(`Unknown platform: ${platformId}`);
  return preset;
}