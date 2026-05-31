/**
 * File Info Service — file size, FFmpeg status.
 */
import { tauri } from '@/core/tauri/TauriBridge';
import { logger } from '@/shared/utils/logging';

export const getFileSizeBytes = async (path: string): Promise<number> => {
  if (!path?.trim()) return 0;
  try {
    const bytes = await tauri.getFileSize(path);
    return Number.isFinite(bytes) ? bytes : 0;
  } catch (error) {
    logger.warn('获取文件大小失败', { path, error });
    return 0;
  }
};

export const getFileSizeMb = async (path: string): Promise<number> => {
  const bytes = await getFileSizeBytes(path);
  return bytes / (1024 * 1024);
};

export async function checkFFmpeg(): Promise<{ installed: boolean; version?: string }> {
  try {
    const result = await tauri.checkFFmpeg();
    return result;
  } catch (error) {
    logger.error('检查FFmpeg失败:', error);
    return { installed: false };
  }
}