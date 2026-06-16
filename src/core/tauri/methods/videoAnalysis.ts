import { invoke, TauriCommand } from '../invoke';

export const videoAnalysis = {
  /** 检查 FFmpeg 是否可用 */
  async checkFFmpeg() {
    return invoke(TauriCommand.CHECK_FFMPEG, {}) as Promise<{
      installed: boolean;
      version?: string;
    }>;
  },

  /** 分析视频元数据（时长、分辨率、编码等） */
  async analyzeVideo(path: string) {
    return invoke(TauriCommand.ANALYZE_VIDEO, { path });
  },

  /** 运行 ffprobe 原始命令 */
  async runFfprobe(args: string[]) {
    return invoke(TauriCommand.RUN_FFPROBE, { args }) as Promise<string>;
  },
};