import type { EditorExportSettings, Timeline } from './types';
import { formatFileSize } from '../../../shared/utils/format';

export async function exportTimeline(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-ignore
  timeline: Timeline,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settings?: Partial<EditorExportSettings>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultSettings?: EditorExportSettings
): Promise<Blob> {
  // @ts-ignore
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
