/**
 * 项目媒体指标解析工具
 *
 * 【优化思路】从 shared/utils/index.ts (334行) 提取项目特定的工具函数，
 * 按职责聚合到独立模块，减少通用工具文件的噪音。
 */

export type RawProjectRecord = Record<string, unknown>;

/**
 * 从未知字段中安全读取数字
 */
export function readNumberField(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * 从项目对象中解析主视频路径
 */
export function resolveProjectVideoPath(project: RawProjectRecord): string {
  if (typeof project.videoPath === 'string' && project.videoPath.trim()) {
    return project.videoPath;
  }
  if (Array.isArray(project.videos) && project.videos.length > 0) {
    const firstVideo = project.videos[0] as Record<string, unknown>;
    if (typeof firstVideo?.path === 'string' && firstVideo.path.trim()) {
      return firstVideo.path;
    }
  }
  return '';
}

/**
 * 从项目中提取媒体指标（时长、显式体积、估算体积）
 */
export function extractProjectMediaMetrics(project: RawProjectRecord): {
  durationSec: number;
  explicitSizeMb: number;
  estimatedSizeMb: number;
} {
  const metadata = (project.metadata && typeof project.metadata === 'object')
    ? (project.metadata as Record<string, unknown>)
    : {};

  const durationSec = readNumberField(metadata.duration, 0);
  const bitrate = readNumberField(metadata.bitrate, 0);
  const explicitSizeMb = readNumberField(project.sizeMb, readNumberField(project.size, 0));
  const estimatedSizeMb = bitrate > 0 && durationSec > 0
    ? (bitrate * durationSec) / 8 / 1024 / 1024
    : 0;

  return { durationSec, explicitSizeMb, estimatedSizeMb };
}

/**
 * 体积优先级选择：真实值 > 显式值 > 估算值
 */
export function pickPreferredSizeMb(
  exactSizeMb: number,
  explicitSizeMb: number,
  estimatedSizeMb: number
): number {
  if (exactSizeMb > 0) return exactSizeMb;
  if (explicitSizeMb > 0) return explicitSizeMb;
  return estimatedSizeMb;
}
