/**
 * Transcode & Crop Export Service
 * Video export with crop/resize, multi-format export.
 */
import { tauri } from '@/core/tauri';
import { logger } from '@/shared/utils/logging';

export type AspectRatio = '16:9' | '9:16' | '1:1';
export type ExportQuality = 'high' | 'medium' | 'low';
interface TranscodeCropOptions {
  inputPath: string;
  outputPath: string;
  aspect: AspectRatio;
  startTime?: number;
  endTime?: number;
  quality?: ExportQuality;
}

export const transcodeWithCrop = async (options: TranscodeCropOptions): Promise<string> => {
  try {
    return await tauri.transcodeWithCrop(options);
  } catch (error) {
    logger.error('transcodeWithCrop 失败:', error);
    throw error;
  }
};
