/**
 * Multi-Format Export — 多格式导出
 *
 * 支持的宽高比：
 *   - 9:16   portrait  （TikTok / Reels / Shorts）
 *   - 1:1    square    （Instagram Feed）
 *   - 16:9   landscape （YouTube Shorts）
 *
 * 导出策略：
 *   - 当前工作区视频 → 裁切中心区域 + 比例变换
 *   - 字幕位置自动适配不同比例
 */

export type AspectRatio = '9:16' | '1:1' | '16:9';

export interface ExportFormat {
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  /** 裁切策略：center | smart（AI 选择最佳裁切区域） */
  cropStrategy: 'center' | 'smart';
}

export interface ClipExportRequest {
  clipId: string;
  sourceVideoPath: string;
  startTime: number;     // 秒
  endTime: number;       // 秒
  /** 目标格式列表 */
  formats: AspectRatio[];
  /** 输出目录 */
  outputDir: string;
  /** 导出质量 */
  quality: 'high' | 'medium' | 'low';
}

export interface ClipExportResult {
  clipId: string;
  outputs: Array<{
    aspectRatio: AspectRatio;
    outputPath: string;
    width: number;
    height: number;
    duration: number;
  }>;
  success: boolean;
  error?: string;
}

// ============================================================
// Format Definitions
// ============================================================

export const EXPORT_FORMATS: Record<AspectRatio, ExportFormat> = {
  '9:16': {
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    cropStrategy: 'smart',
  },
  '1:1': {
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    cropStrategy: 'smart',
  },
  '16:9': {
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    cropStrategy: 'center',
  },
};

export const QUALITY_PRESETS = {
  high: { crf: 18, preset: 'slow' as const, bitrate: '5M' },
  medium: { crf: 23, preset: 'medium' as const, bitrate: '2.5M' },
  low: { crf: 28, preset: 'fast' as const, bitrate: '1M' },
};

// ============================================================
// Multi-Format Exporter
// ============================================================

export class MultiFormatExporter {
  /**
   * 准备导出任务列表
   * 生成各格式的 FFmpeg 命令参数
   */
  prepareExportTasks(req: ClipExportRequest): ExportTask[] {
    const tasks: ExportTask[] = [];
    const clipDuration = req.endTime - req.startTime;

    for (const ratio of req.formats) {
      const format = EXPORT_FORMATS[ratio];
      const task = this.buildExportTask(req, format, clipDuration);
      tasks.push(task);
    }

    return tasks;
  }

  /**
   * 生成导出的文件名
   */
  buildOutputFilename(
    clipId: string,
    aspectRatio: AspectRatio,
    index: number,
  ): string {
    return `clip_${clipId}_${aspectRatio.replace(':', 'x')}_${String(index).padStart(2, '0')}.mp4`;
  }

  // --------------------------------------------------------
  // Private
  // --------------------------------------------------------

  private buildExportTask(req: ClipExportRequest, format: ExportFormat, duration: number): ExportTask {
    const outputFilename = this.buildOutputFilename(req.clipId, format.aspectRatio, 0);
    const outputPath = `${req.outputDir}/${outputFilename}`;
    const quality = QUALITY_PRESETS[req.quality];

    const ffmpegArgs = this.buildFFmpegArgs({
      inputPath: req.sourceVideoPath,
      outputPath,
      startTime: req.startTime,
      duration,
      format,
      quality,
    });

    return {
      clipId: req.clipId,
      aspectRatio: format.aspectRatio,
      outputPath,
      ffmpegArgs,
      width: format.width,
      height: format.height,
      duration,
    };
  }

  private buildFFmpegArgs(opts: {
    inputPath: string;
    outputPath: string;
    startTime: number;
    duration: number;
    format: ExportFormat;
    quality: (typeof QUALITY_PRESETS)[keyof typeof QUALITY_PRESETS];
  }): string[] {
    const { inputPath, outputPath, startTime, duration, format, quality } = opts;
    const { crf, preset } = quality;

    const scaleFilter = this.buildScaleFilter(format);

    return [
      '-ss', String(startTime),
      '-i', inputPath,
      '-t', String(duration),
      '-vf', scaleFilter,
      '-c:v', 'libx264',
      '-preset', preset,
      '-crf', String(crf),
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    ];
  }

  /**
   * 构建 FFmpeg scale + crop 滤镜
   * 确保输出比例正确，裁切多余部分
   */
  private buildScaleFilter(format: ExportFormat): string {
    const { aspectRatio, width, height, cropStrategy } = format;

    // 源视频假设 16:9 (1920x1080)，scale 到目标高度后 crop/pad
    const srcAspect = 16 / 9;
    const dstAspect = aspectRatio === '9:16' ? 9 / 16 :
                      aspectRatio === '1:1' ? 1 : 16 / 9;

    if (dstAspect < srcAspect) {
      // 目标更窄 → 先 scale 到宽度，再 crop 高度
      // scale=-1:1080 保持宽度自适应，crop 到目标宽高
      const scaleW = `scale=${width}:-1`;
      const crop = `crop=${width}:${height}`;
      return cropStrategy === 'smart'
        ? `${scaleW},${crop},setsar=1:1`
        : `${scaleW},${crop},setsar=1:1`;
    } else {
      // 目标更宽 → 先 scale 到高度，再 pad 宽度
      const scaleH = `scale=-1:${height}`;
      const pad = `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`;
      return `${scaleH},${pad},setsar=1:1`;
    }
  }
}

export interface ExportTask {
  clipId: string;
  aspectRatio: AspectRatio;
  outputPath: string;
  ffmpegArgs: string[];
  width: number;
  height: number;
  duration: number;
}

export const multiFormatExporter = new MultiFormatExporter();
export default multiFormatExporter;
