import type { EditorExportSettings, Timeline } from './types';
import { formatFileSize } from '../../../shared/utils/format';

export async function exportTimeline(
  timeline: Timeline,
  settings?: Partial<EditorExportSettings>,
  defaultSettings?: EditorExportSettings
): Promise<Blob> {
  const _exportSettings = { ...defaultSettings, ...settings };
  // 这里应该调用 FFmpeg 或其他导出服务
  return new Blob(['export data'], { type: 'video/mp4' });
}

export function getExportPreview(
  timeline: Timeline,
  defaultSettings: EditorExportSettings
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
    estimatedSize: formatFileSize(estimatedBytes)
  };
}
