/**
 * Video Formatting Utilities
 * 纯函数，无副作用，供 UI 层直接调用
 */

export const formatDuration = (durationInSeconds: number): string => {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

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

export const formatFileSize = (bytes: number): string => {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(2)} KB`;
  return `${bytes} B`;
};
