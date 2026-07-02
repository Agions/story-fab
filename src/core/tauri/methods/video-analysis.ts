import { invoke, TauriCommand } from '../invoke';
import type { VideoInfo } from '@/types';

export const videoAnalysis = {
  /** 检查 FFmpeg 是否已安装 */
  async checkFFmpeg(): Promise<{ installed: boolean; version?: string }> {
    return invoke(TauriCommand.CHECK_FFMPEG, undefined);
  },

  /** 分析视频，返回元数据 */
  async analyzeVideo(path: string): Promise<VideoInfo> {
    return invoke(TauriCommand.ANALYZE_VIDEO, { path });
  },

  /** 运行 FFprobe，返回原始输出 */
  async runFFprobe(args: string[]): Promise<string> {
    return invoke(TauriCommand.RUN_FFPROBE, { args });
  },
};

