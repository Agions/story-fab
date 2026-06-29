/**
 * 导出服务
 * 支持多种格式的音视频导出
 * 集成 Tauri 后端进行实际视频处理
 */

import { invoke, TauriCommand } from '../../tauri';
import { logger } from '@/shared/utils/logging';

import type { ExportConfig, ExportResult, ExportFormat } from '../../export/types';
import { EXPORT_PRESETS, FORMAT_INFO } from '../../export/types';
export type { ExportResult };

export const FORMAT_MIME_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  gif: 'image/gif',
};

export function mergeExportConfig(
  overrides: Partial<ExportConfig>,
  instance: ExportConfig | null,
): ExportConfig {
  const quality = overrides.quality ?? instance?.quality ?? 'medium';
  const preset = EXPORT_PRESETS[quality];
  return {
    format: overrides.format ?? instance?.format ?? 'mp4',
    quality,
    resolution: overrides.resolution ?? instance?.resolution ?? preset.resolution ?? '1080p',
    frameRate: overrides.frameRate ?? instance?.frameRate ?? preset.frameRate ?? 30,
    aspectRatio: overrides.aspectRatio ?? instance?.aspectRatio ?? '16:9',
    audioCodec: overrides.audioCodec ?? instance?.audioCodec ?? preset.encoder?.audioCodec ?? 'aac',
    audioBitrate: overrides.audioBitrate ?? instance?.audioBitrate ?? preset.audioBitrate ?? '192k',
    sampleRate: overrides.sampleRate ?? instance?.sampleRate ?? 48000,
    channels: overrides.channels ?? instance?.channels ?? 2,
    encoder: overrides.encoder ?? instance?.encoder ?? preset.encoder ?? { videoCodec: 'h264', audioCodec: 'aac', crf: 23, preset: 'medium' },
    subtitleEnabled: overrides.subtitleEnabled ?? instance?.subtitleEnabled ?? false,
    subtitlePath: overrides.subtitlePath ?? instance?.subtitlePath,
    burnSubtitles: overrides.burnSubtitles ?? instance?.burnSubtitles ?? false,
    watermarkEnabled: overrides.watermarkEnabled ?? instance?.watermarkEnabled ?? false,
    watermarkText: overrides.watermarkText ?? instance?.watermarkText,
    watermarkImage: overrides.watermarkImage ?? instance?.watermarkImage,
    watermarkPosition: overrides.watermarkPosition ?? instance?.watermarkPosition ?? 'bottom-right',
    watermarkOpacity: overrides.watermarkOpacity ?? instance?.watermarkOpacity ?? 0.8,
    title: overrides.title ?? instance?.title,
    author: overrides.author ?? instance?.author,
    copyright: overrides.copyright ?? instance?.copyright,
  };
}

export class ExportService {
  private currentExportId: string | null = null;
  private config: ExportConfig | null = null;

  setConfig(config: Partial<ExportConfig>): void {
    this.config = mergeExportConfig(config, null);
  }

  getConfig(): ExportConfig | null {
    return this.config;
  }

  async exportVideo(
    inputPath: string,
    outputPath: string,
    config: Partial<ExportConfig>,
    _onProgress?: (percent: number) => void
  ): Promise<ExportResult> {
    const fullConfig = mergeExportConfig(config, this.config);

    const exportId = crypto.randomUUID();
    this.currentExportId = exportId;

    logger.info('[ExportService] 开始导出:', {
      exportId,
      input: inputPath,
      output: outputPath,
      format: fullConfig.format,
    });

    try {
      const result = await invoke(
        TauriCommand.EXPORT_VIDEO,
        {
          inputPath,
          outputPath,
          format: fullConfig.format,
          resolution: fullConfig.resolution,
          frameRate: fullConfig.frameRate,
          videoCodec: fullConfig.encoder.videoCodec,
          audioCodec: fullConfig.audioCodec,
          crf: fullConfig.encoder.crf ?? 23,
          subtitleEnabled: fullConfig.subtitleEnabled,
          subtitlePath: fullConfig.subtitlePath,
          burnSubtitles: fullConfig.burnSubtitles,
        }
      ) as { outputPath: string; duration: number; fileSize: number };

      logger.info('[ExportService] 导出完成:', { exportId, result });

      return {
        outputPath: result.outputPath,
        duration: result.duration,
        fileSize: result.fileSize,
        format: fullConfig.format,
      };
    } catch (error) {
      logger.error('[ExportService] 导出失败:', { exportId, error });
      throw error;
    } finally {
      this.currentExportId = null;
    }
  }

  async cancelExport(): Promise<void> {
    if (this.currentExportId) {
      logger.info('[ExportService] 取消导出:', { exportId: this.currentExportId });
      try {
        await invoke(TauriCommand.CANCEL_EXPORT, { exportId: this.currentExportId });
      } catch (error) {
        logger.warn('[ExportService] 取消导出失败:', { error });
      }
      this.currentExportId = null;
    }
  }

  getExportPresets(): Record<string, Partial<ExportConfig>> {
    return EXPORT_PRESETS;
  }

  getFormatInfo(format: ExportFormat) {
    return FORMAT_INFO[format];
  }
}

export const exportService = new ExportService();
export default exportService;
