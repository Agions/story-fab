/**
 * Video Operations — extract key frames, generate thumbnails
 * Split from VideoAnalyzer direct invoke calls
 */
import { invoke, TauriCommand } from '../TauriBridge';

export interface ExtractKeyFramesResult {
  frames: string[];
}

/**
 * 从视频中提取关键帧
 * @param path 视频路径
 * @param count 关键帧数量
 */
export async function extractKeyFrames(
  path: string,
  count: number
): Promise<string[]> {
  return invoke(TauriCommand.EXTRACT_KEY_FRAMES, {
    path,
    count,
  }) as Promise<string[]>;
}

/**
 * 生成视频缩略图
 * @param path 视频路径
 */
export async function generateThumbnail(path: string): Promise<string> {
  return invoke(TauriCommand.GENERATE_THUMBNAIL, {
    path,
  }) as Promise<string>;
}

export const videoOperations = {
  extractKeyFrames,
  generateThumbnail,
};