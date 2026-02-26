import type { Timeline, ExportSettings } from '@/core/types';
import type { EditorConfig } from './types';

export async function exportTimeline(
  timeline: Timeline,
  settings?: Partial<ExportSettings>,
  defaultSettings?: ExportSettings
): Promise<Blob> {
  const exportSettings = { ...defaultSettings, ...settings };
  // 这里应该调用 FFmpeg 或其他导出服务
  return new Blob(['export data'], { type: 'video/mp4' });
}

export function getExportPreview(
  timeline: Timeline,
  defaultSettings: ExportSettings
): {
  duration: number;
  resolution: string;
  estimatedSize: string;
} {
  const duration = timeline.duration;
  const bitrate = parseInt(defaultSettings.bitrate) * 1024 * 1024;
  const estimatedBytes = (duration * bitrate) / 8;

  return {
    duration,
    resolution: defaultSettings.resolution,
    estimatedSize: formatBytes(estimatedBytes)
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
