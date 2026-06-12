import type { EditorExportSettings, Timeline } from './types';
import { formatFileSize } from '../../../shared/utils/formatting';

export async function exportTimeline(
  // @ts-expect-error - reserved parameter for future export pipeline integration
  timeline: Timeline,
  settings?: Partial<EditorExportSettings>,
  defaultSettings?: EditorExportSettings
): Promise<Blob> {
  // @ts-expect-error - placeholder settings object reserved for export pipeline
  const _exportSettings = { ...defaultSettings, ...settings };
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
