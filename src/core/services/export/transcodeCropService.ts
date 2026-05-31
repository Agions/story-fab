/**
 * Transcode & Crop Export Service
 * Video export with crop/resize, multi-format export.
 */
import { tauri } from '@/core/tauri/TauriBridge';
import { logger } from '@/shared/utils/logging';

export type AspectRatio = '16:9' | '9:16' | '1:1';
export type ExportQuality = 'high' | 'medium' | 'low';
export interface TranscodeCropOptions {
  inputPath: string;
  outputPath: string;
  aspect: AspectRatio;
  startTime?: number;
  endTime?: number;
  quality?: ExportQuality;
}

export const transcodeWithCrop = async (options: TranscodeCropOptions): Promise<string> => {
  try {
    const result = await tauri.transcodeWithCrop(options);
    return result;
  } catch (error) {
    logger.error('transcodeWithCrop 失败:', error);
    throw error;
  }
};

export const exportMultiFormat = async (
  inputs: Array<{ inputPath: string; outputPath: string; aspect: AspectRatio; quality?: ExportQuality }>
): Promise<string[]> => {
  const results: string[] = [];
  for (const opt of inputs) {
    const result = await transcodeWithCrop(opt);
    results.push(result);
  }
  return results;
};