import { invoke, TauriCommand } from '../invoke';

export const renderTranscode = {
  /** 取消正在进行的导出 */
  async cancelExport(exportId: string): Promise<void> {
    await invoke(TauriCommand.CANCEL_EXPORT, { exportId });
  },

  /** 转码并裁剪视频（按目标宽高比裁剪，可选裁剪时间段与画质） */
  async transcodeWithCrop(input: {
    inputPath: string;
    outputPath: string;
    aspect: string;
    startTime?: number;
    endTime?: number;
    quality?: string;
  }): Promise<string> {
    return invoke(TauriCommand.TRANSCODE_WITH_CROP, input);
  },

  /** 自动渲染剪辑片段 */
  async renderAutonomousCut(inputPath: string, segments: Array<{ start: number; end: number }>, outputPath: string): Promise<string> {
    return invoke(TauriCommand.AUTONOMOUS_RENDER, { inputPath, segments, outputPath });
  },

  /** 生成视频预览 */
  async generatePreview(inputPath: string, segment: { start: number; end: number }): Promise<string> {
    return invoke(TauriCommand.GENERATE_PREVIEW, { inputPath, segment });
  },

  /** 剪辑视频 */
  async cutVideo(inputPath: string, outputPath: string, segments: Array<{ start: number; end: number }>): Promise<string> {
    return invoke(TauriCommand.CUT_VIDEO, { inputPath, outputPath, segments });
  },
};

