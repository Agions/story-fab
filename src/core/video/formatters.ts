/**
 * Video Formatting Utilities
 * 纯函数，无副作用，供 UI 层直接调用
 * 
 * 本文件作为 video 模块的格式化工具层：
 * - formatResolution / formatBitrate: 视频特有，保留原实现在此
 * - formatDuration / formatFileSize: 从 shared/utils/formatting 重导出（统一来源）
 */

// Re-export common formatters from shared utils (single source of truth)
export { formatDuration, formatFileSize } from '../../shared/utils/formatting';

export const formatResolution = (width: number, height: number): string => {
  if (width === 3840 && height === 2160) return `${width}x${height} (4K UHD)`;
  if (width === 2560 && height === 1440) return `${width}x${height} (2K QHD)`;
  if (width === 1920 && height === 1080) return `${width}x${height} (1080p)`;
  if (width === 1280 && height === 720) return `${width}x${height} (720p)`;
  if (width === 720 && height === 480) return `${width}x${height} (480p)`;
  return `${width}x${height}`;
};

export const formatBitrate = (bitrate: number): string => {
  if (bitrate >= 1_000_000) return `${(bitrate / 1_000_000).toFixed(1)} Mbps`;
  if (bitrate >= 1_000) return `${(bitrate / 1_000).toFixed(0)} Kbps`;
  return `${bitrate} bps`;
};
