import { invoke, TauriCommand } from '../TauriBridge';

export const renderTranscode = {
  /** 比例裁切 + 编码导出（9:16 / 1:1 / 16:9） */
  async transcodeWithCrop(input: {
    inputPath: string;
    outputPath: string;
    aspect: '9:16' | '1:1' | '16:9';
    startTime?: number;
    endTime?: number;
    quality?: 'low' | 'medium' | 'high';
  }) {
    return invoke(TauriCommand.TRANSCODE_WITH_CROP, {
      input: {
        inputPath: input.inputPath,
        outputPath: input.outputPath,
        aspect: input.aspect,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        quality: input.quality ?? 'high',
      },
    }) as Promise<string>;
  },

  /** 全自动 AI 剪辑渲染 */
  async autonomousRender(input: Record<string, unknown>) {
    return invoke(TauriCommand.AUTONOMOUS_RENDER, { input }) as Promise<string>;
  },

  /** 生成预览片段 */
  async generatePreview(input: {
    inputPath: string;
    segment: { start: number; end: number };
  }) {
    return invoke(TauriCommand.GENERATE_PREVIEW, { input }) as Promise<string>;
  },

  /** 裁剪视频（多段合并） */
  async cutVideo(input: {
    inputPath: string;
    outputPath: string;
    segments: Array<{ start: number; end: number }>;
    useHwAccel?: boolean;
    onProgress?: (progress: unknown) => void;
  }) {
    return invoke(TauriCommand.CUT_VIDEO, {
      inputPath: input.inputPath,
      outputPath: input.outputPath,
      segments: input.segments,
      useHwAccel: input.useHwAccel ?? false,
    }) as Promise<string>;
  },

  /** 通用视频导出（支持字幕烧录） */
  async exportVideo(input: {
    inputPath: string;
    outputPath: string;
    format?: string;
    resolution?: string;
    frameRate?: number;
    videoCodec?: string;
    audioCodec?: string;
    crf?: number;
    subtitleEnabled?: boolean;
    subtitlePath?: string;
    burnSubtitles?: boolean;
  }) {
    return invoke(
      TauriCommand.EXPORT_VIDEO,
      {
        inputPath: input.inputPath,
        outputPath: input.outputPath,
        format: input.format,
        resolution: input.resolution,
        frameRate: input.frameRate,
        videoCodec: input.videoCodec,
        audioCodec: input.audioCodec,
        crf: input.crf,
        subtitleEnabled: input.subtitleEnabled,
        subtitlePath: input.subtitlePath,
        burnSubtitles: input.burnSubtitles,
      }
    ) as Promise<{ outputPath: string; duration: number; fileSize: number }>;
  },
};